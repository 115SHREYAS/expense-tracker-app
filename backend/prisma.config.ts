import dotenv from "dotenv";
import path from "path";
import { defineConfig } from "prisma/config";

const env = process.env.NODE_ENV || "des";
dotenv.config({ path: path.resolve(__dirname, `.env.${env}`) });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
