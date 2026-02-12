import { Router, Response } from "express";
import multer from "multer";
import { authenticate, AuthRequest } from "../middleware/auth";
import { HdfcParser } from "../parsers/hdfc-parser";
import { SbiParser } from "../parsers/sbi-parser";
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

    // Layer 1: Hash-based dedup (fast, catches identical data)
    const hashes = parsed.map((t) => t.hash);
    const existing = await prisma.transaction.findMany({
      where: { hash: { in: hashes }, userId: req.userId! },
      select: { hash: true },
    });
    const existingHashes = new Set(existing.map((e: any) => e.hash));

    let newTransactions = parsed.filter((t) => !existingHashes.has(t.hash));

    // Layer 2: Fallback dedup by date + amount + type + description
    // Catches duplicates when hashes differ due to normalization changes
    // or minor formatting differences across statement downloads
    if (newTransactions.length > 0) {
      const dates = newTransactions.map((t) => t.date);
      const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
      const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
      // Add 1-day buffer to handle timezone edge cases
      minDate.setDate(minDate.getDate() - 1);
      maxDate.setDate(maxDate.getDate() + 1);

      const existingInRange = await prisma.transaction.findMany({
        where: {
          userId: req.userId!,
          date: { gte: minDate, lte: maxDate },
        },
        select: { date: true, amount: true, type: true, description: true },
      });

      const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

      const existingKeys = new Set(
        existingInRange.map((e) => {
          const d = e.date;
          return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}|${e.amount}|${e.type}|${normalize(e.description)}`;
        })
      );

      newTransactions = newTransactions.filter((t) => {
        const d = t.date;
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}|${t.amount}|${t.type}|${normalize(t.description)}`;
        return !existingKeys.has(key);
      });
    }

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

router.post("/sbi", authenticate, (req: AuthRequest, res: Response, next: any) => {
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
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    console.log("SBI Upload received:", req.file.originalname, req.file.size, "bytes");

    const password = req.body?.password as string | undefined;
    const parser = new SbiParser();

    let parsed;
    try {
      parsed = await parser.parseAsync(req.file.buffer, { password });
    } catch (parseError: any) {
      const msg = parseError.message || "";
      if (msg.includes("password") || msg.includes("encrypt") || msg.includes("CFB")) {
        res.status(400).json({
          error: "Could not decrypt file. Please check the password and try again.",
        });
        return;
      }
      throw parseError;
    }

    console.log("Parsed SBI transactions:", parsed.length);

    if (parsed.length === 0) {
      res.status(400).json({ error: "No transactions found in file" });
      return;
    }

    // Layer 1: Hash-based dedup
    const hashes = parsed.map((t) => t.hash);
    const existing = await prisma.transaction.findMany({
      where: { hash: { in: hashes }, userId: req.userId! },
      select: { hash: true },
    });
    const existingHashes = new Set(existing.map((e: any) => e.hash));

    let newTransactions = parsed.filter((t) => !existingHashes.has(t.hash));

    // Layer 2: Fallback dedup by date + amount + type + description
    if (newTransactions.length > 0) {
      const dates = newTransactions.map((t) => t.date);
      const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
      const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
      minDate.setDate(minDate.getDate() - 1);
      maxDate.setDate(maxDate.getDate() + 1);

      const existingInRange = await prisma.transaction.findMany({
        where: {
          userId: req.userId!,
          date: { gte: minDate, lte: maxDate },
        },
        select: { date: true, amount: true, type: true, description: true },
      });

      const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

      const existingKeys = new Set(
        existingInRange.map((e) => {
          const d = e.date;
          return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}|${e.amount}|${e.type}|${normalize(e.description)}`;
        })
      );

      newTransactions = newTransactions.filter((t) => {
        const d = t.date;
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}|${t.amount}|${t.type}|${normalize(t.description)}`;
        return !existingKeys.has(key);
      });
    }

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
          source: "SBI",
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
    console.error("SBI Upload error:", error);
    res.status(500).json({ error: "Failed to process file" });
  }
});

export default router;
