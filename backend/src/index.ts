import env from "./utils/env"; // must be first — loads .env before other imports
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import transactionRoutes from "./routes/transactions";
import categoryRoutes from "./routes/categories";
import analyticsRoutes from "./routes/analytics";
import uploadRoutes from "./routes/upload";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/upload", uploadRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", env });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} [env: ${env}]`);
});

export default app;
