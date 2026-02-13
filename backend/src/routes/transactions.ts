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
        include: {
          category: true,
          splits: { include: { category: true }, orderBy: { amount: "desc" } },
        },
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
      include: {
        category: true,
        splits: { include: { category: true }, orderBy: { amount: "desc" } },
      },
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

    if (existing.isSplit) {
      res.status(400).json({ error: "Cannot change category on a split transaction. Remove the split first." });
      return;
    }

    // Learn from user correction
    if (categoryId && categoryId !== existing.categoryId) {
      await learnFromUserEdit(existing.description, categoryId);
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: { categoryId },
      include: {
        category: true,
        splits: { include: { category: true }, orderBy: { amount: "desc" } },
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Update transaction error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Split transaction across categories
router.post("/:id/split", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { splits } = req.body as { splits: { categoryId: string; amount: number }[] };

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: req.userId! },
    });
    if (!existing) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }

    // Validation
    if (!splits || !Array.isArray(splits) || splits.length < 2) {
      res.status(400).json({ error: "At least 2 split entries are required" });
      return;
    }

    const categoryIds = splits.map((s) => s.categoryId);
    if (new Set(categoryIds).size !== categoryIds.length) {
      res.status(400).json({ error: "Duplicate categories are not allowed" });
      return;
    }

    if (splits.some((s) => s.amount <= 0)) {
      res.status(400).json({ error: "All split amounts must be positive" });
      return;
    }

    const totalSplit = splits.reduce((sum, s) => sum + s.amount, 0);
    if (Math.abs(totalSplit - existing.amount) > 0.01) {
      res.status(400).json({ error: `Split amounts must sum to transaction total (${existing.amount})` });
      return;
    }

    // Verify categories exist
    const validCategories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });
    if (validCategories.length !== categoryIds.length) {
      res.status(400).json({ error: "One or more categories not found" });
      return;
    }

    // Atomic: delete old splits, create new, update transaction
    const updated = await prisma.$transaction(async (tx) => {
      await tx.transactionSplit.deleteMany({ where: { transactionId: id } });

      await tx.transactionSplit.createMany({
        data: splits.map((s) => ({
          transactionId: id,
          categoryId: s.categoryId,
          amount: s.amount,
        })),
      });

      return tx.transaction.update({
        where: { id },
        data: { isSplit: true, categoryId: null },
        include: {
          category: true,
          splits: { include: { category: true }, orderBy: { amount: "desc" } },
        },
      });
    });

    res.json(updated);
  } catch (error) {
    console.error("Split transaction error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Remove split from transaction
router.delete("/:id/split", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { categoryId } = req.body || {};

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: req.userId! },
    });
    if (!existing) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }

    if (!existing.isSplit) {
      res.status(400).json({ error: "Transaction is not split" });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.transactionSplit.deleteMany({ where: { transactionId: id } });

      return tx.transaction.update({
        where: { id },
        data: { isSplit: false, categoryId: categoryId || null },
        include: {
          category: true,
          splits: { include: { category: true }, orderBy: { amount: "desc" } },
        },
      });
    });

    res.json(updated);
  } catch (error) {
    console.error("Unsplit transaction error:", error);
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
