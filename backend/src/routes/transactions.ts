import { Router, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import { categorizeTransaction, inferPaymentMode, learnFromUserEdit } from "../services/categorization";
import prisma from "../utils/prisma";
import crypto from "crypto";

const router = Router();

// List transactions with filters
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const category = req.query.category as string | undefined;
    const paymentMode = req.query.paymentMode as string | undefined;
    const type = req.query.type as string | undefined;
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "50", 10);

    const where: any = { userId: req.userId! };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    if (category) where.categoryId = category;
    if (paymentMode) where.paymentMode = paymentMode;
    if (type) where.type = type;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { category: true },
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({ transactions, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("List transactions error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add manual transaction
router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { date, description, amount, type, paymentMode, categoryId } = req.body;

    if (!date || !description || !amount || !type) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const hash = crypto
      .createHash("sha256")
      .update(`MANUAL|${req.userId}|${date}|${description}|${amount}|${Date.now()}`)
      .digest("hex");

    const autoCategory = categoryId || (await categorizeTransaction(description))?.categoryId || null;
    const mode = paymentMode || inferPaymentMode(description);

    const transaction = await prisma.transaction.create({
      data: {
        userId: req.userId!,
        date: new Date(date),
        description,
        amount: parseFloat(amount),
        type,
        paymentMode: mode,
        categoryId: autoCategory,
        source: "MANUAL",
        hash,
      },
      include: { category: true },
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error("Create transaction error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update transaction category
router.patch("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { categoryId } = req.body;

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: req.userId! },
    });
    if (!existing) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }

    // Learn from user correction
    if (categoryId && categoryId !== existing.categoryId) {
      await learnFromUserEdit(existing.description, categoryId);
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: { categoryId },
      include: { category: true },
    });

    res.json(updated);
  } catch (error) {
    console.error("Update transaction error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete transaction
router.delete("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.transaction.findFirst({
      where: { id, userId: req.userId! },
    });
    if (!existing) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }

    await prisma.transaction.delete({ where: { id } });
    res.json({ message: "Transaction deleted" });
  } catch (error) {
    console.error("Delete transaction error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
