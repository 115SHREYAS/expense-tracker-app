import { Router, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import prisma from "../utils/prisma";

const router = Router();

// Summary stats
router.get("/summary", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = { userId: req.userId!, type: "DEBIT" };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const result = await prisma.transaction.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
    });

    const creditResult = await prisma.transaction.aggregate({
      where: { ...where, type: "CREDIT" },
      _sum: { amount: true },
      _count: true,
    });

    res.json({
      totalExpense: result._sum.amount || 0,
      totalIncome: creditResult._sum.amount || 0,
      transactionCount: result._count + creditResult._count,
    });
  } catch (error) {
    console.error("Summary error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Category breakdown
router.get("/by-category", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = { userId: req.userId!, type: "DEBIT" };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const result: any[] = await (prisma.transaction.groupBy as any)({
      by: ["categoryId"],
      where,
      _sum: { amount: true },
      _count: true,
    });

    // Fetch category names
    const categoryIds = result.map((r: any) => r.categoryId).filter(Boolean) as string[];
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });
    const categoryMap = new Map<string, any>(categories.map((c: any) => [c.id, c]));

    const breakdown = result.map((r: any) => ({
      categoryId: r.categoryId,
      categoryName: r.categoryId ? categoryMap.get(r.categoryId)?.name || "Unknown" : "Uncategorized",
      categoryIcon: r.categoryId ? categoryMap.get(r.categoryId)?.icon || "tag" : "help-circle",
      total: r._sum.amount || 0,
      count: r._count,
    }));

    breakdown.sort((a: any, b: any) => b.total - a.total);
    res.json(breakdown);
  } catch (error) {
    console.error("Category breakdown error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Spending over time (daily)
router.get("/over-time", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, groupBy = "day" } = req.query;

    const where: any = { userId: req.userId!, type: "DEBIT" };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const transactions = await prisma.transaction.findMany({
      where,
      select: { date: true, amount: true },
      orderBy: { date: "asc" },
    });

    const grouped = new Map<string, number>();
    for (const txn of transactions) {
      let key: string;
      if (groupBy === "month") {
        key = `${txn.date.getFullYear()}-${String(txn.date.getMonth() + 1).padStart(2, "0")}`;
      } else {
        key = txn.date.toISOString().split("T")[0];
      }
      grouped.set(key, (grouped.get(key) || 0) + txn.amount);
    }

    const data = Array.from(grouped.entries()).map(([date, amount]) => ({
      date,
      amount: Math.round(amount * 100) / 100,
    }));

    res.json(data);
  } catch (error) {
    console.error("Over time error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Payment mode breakdown
router.get("/by-payment-mode", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = { userId: req.userId!, type: "DEBIT" };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const result: any[] = await (prisma.transaction.groupBy as any)({
      by: ["paymentMode"],
      where,
      _sum: { amount: true },
      _count: true,
    });

    const breakdown = result.map((r: any) => ({
      paymentMode: r.paymentMode,
      total: r._sum.amount || 0,
      count: r._count,
    }));

    res.json(breakdown);
  } catch (error) {
    console.error("Payment mode breakdown error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
