import { Router, Response } from "express";
import multer from "multer";
import { authenticate, AuthRequest } from "../middleware/auth";
import { HdfcParser } from "../parsers/hdfc-parser";
import { categorizeTransaction, inferPaymentMode } from "../services/categorization";
import prisma from "../utils/prisma";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post("/hdfc", authenticate, (req: AuthRequest, res: Response, next: any) => {
  upload.single("file")(req, res, (err: any) => {
    if (err) {
      console.error("Multer error:", err);
      res.status(400).json({ error: "File upload failed: " + err.message });
      return;
    }
    next();
  });
}, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      console.log("No file in request. Body keys:", Object.keys(req.body || {}));
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    console.log("Upload received:", req.file.originalname, req.file.size, "bytes", req.file.mimetype);

    const parser = new HdfcParser();
    const parsed = parser.parse(req.file.buffer);

    console.log("Parsed transactions:", parsed.length);

    if (parsed.length === 0) {
      res.status(400).json({ error: "No transactions found in file" });
      return;
    }

    // Check for existing hashes to avoid duplicates
    const hashes = parsed.map((t) => t.hash);
    const existing = await prisma.transaction.findMany({
      where: { hash: { in: hashes }, userId: req.userId! },
      select: { hash: true },
    });
    const existingHashes = new Set(existing.map((e: any) => e.hash));

    const newTransactions = parsed.filter((t) => !existingHashes.has(t.hash));

    // Import new transactions with auto-categorization
    const imported = [];
    for (const txn of newTransactions) {
      const categoryMatch = await categorizeTransaction(txn.description);
      const paymentMode = inferPaymentMode(txn.description);

      const created = await prisma.transaction.create({
        data: {
          userId: req.userId!,
          date: txn.date,
          description: txn.description,
          amount: txn.amount,
          type: txn.type,
          paymentMode,
          categoryId: categoryMatch?.categoryId || null,
          source: "HDFC",
          hash: txn.hash,
        },
        include: { category: true },
      });
      imported.push(created);
    }

    res.json({
      total: parsed.length,
      imported: imported.length,
      duplicates: parsed.length - imported.length,
      transactions: imported,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to process file" });
  }
});

export default router;
