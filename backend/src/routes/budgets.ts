import { Router, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import prisma from "../utils/prisma";

const router = Router();

// GET / — List budgets for a given month/year with current spending
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const month = parseInt(req.query.month as string);
    const year = parseInt(req.query.year as string);

    if (!month || !year || month < 1 || month > 12) {
      res.status(400).json({ error: "Valid month (1-12) and year are required" });
      return;
    }

    const budgets = await prisma.budget.findMany({
      where: { userId: req.userId!, month, year },
      include: { category: { select: { id: true, name: true, icon: true } } },
    });

    // Match parser convention: dates stored as local midnight
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const categoryIds = budgets.map((b) => b.categoryId);

    const spending: any[] = categoryIds.length
      ? await (prisma.transaction.groupBy as any)({
          by: ["categoryId"],
          where: {
            userId: req.userId!,
            type: "DEBIT",
            categoryId: { in: categoryIds },
            date: { gte: startDate, lte: endDate },
          },
          _sum: { amount: true },
        })
      : [];

    const spendingMap = new Map<string, number>(
      spending.map((s: any) => [s.categoryId, s._sum.amount || 0])
    );

    const result = budgets.map((b) => ({
      id: b.id,
      categoryId: b.category.id,
      categoryName: b.category.name,
      categoryIcon: b.category.icon,
      amount: b.amount,
      spent: spendingMap.get(b.categoryId) || 0,
      month: b.month,
      year: b.year,
    }));

    res.json({ budgets: result });
  } catch (error) {
    console.error("List budgets error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST / — Create a budget
router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { categoryId, amount, month, year } = req.body;

    if (!categoryId || !amount || !month || !year) {
      res.status(400).json({ error: "categoryId, amount, month, and year are required" });
      return;
    }

    if (amount <= 0) {
      res.status(400).json({ error: "Amount must be greater than 0" });
      return;
    }

    if (month < 1 || month > 12) {
      res.status(400).json({ error: "Month must be between 1 and 12" });
      return;
    }

    // Check for duplicate
    const existing = await prisma.budget.findUnique({
      where: {
        userId_categoryId_month_year: {
          userId: req.userId!,
          categoryId,
          month,
          year,
        },
      },
    });

    if (existing) {
      res.status(409).json({ error: "Budget already exists for this category and month" });
      return;
    }

    const budget = await prisma.budget.create({
      data: {
        userId: req.userId!,
        categoryId,
        amount,
        month,
        year,
      },
      include: { category: { select: { id: true, name: true, icon: true } } },
    });

    res.status(201).json(budget);
  } catch (error) {
    console.error("Create budget error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /:id — Update budget amount
router.put("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({ error: "Amount must be greater than 0" });
      return;
    }

    const budget = await prisma.budget.findFirst({
      where: { id, userId: req.userId! },
    });

    if (!budget) {
      res.status(404).json({ error: "Budget not found" });
      return;
    }

    const updated = await prisma.budget.update({
      where: { id },
      data: { amount },
      include: { category: { select: { id: true, name: true, icon: true } } },
    });

    res.json(updated);
  } catch (error) {
    console.error("Update budget error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /:id — Delete budget
router.delete("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const budget = await prisma.budget.findFirst({
      where: { id, userId: req.userId! },
    });

    if (!budget) {
      res.status(404).json({ error: "Budget not found" });
      return;
    }

    await prisma.budget.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error("Delete budget error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
