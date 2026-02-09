import { Router, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import prisma from "../utils/prisma";

const router = Router();

router.get("/", authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    res.json(categories);
  } catch (error) {
    console.error("List categories error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, icon } = req.body;
    if (!name) {
      res.status(400).json({ error: "Category name is required" });
      return;
    }

    const category = await prisma.category.create({
      data: { name, icon: icon || "tag", isCustom: true },
    });
    res.status(201).json(category);
  } catch (error: any) {
    if (error.code === "P2002") {
      res.status(409).json({ error: "Category already exists" });
      return;
    }
    console.error("Create category error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
