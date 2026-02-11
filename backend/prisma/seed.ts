import path from "path";
import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const env = process.env.NODE_ENV || "des";
dotenv.config({ path: path.resolve(__dirname, `../.env.${env}`) });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const defaultCategories = [
  { name: "Food & Dining", icon: "utensils" },
  { name: "Transport", icon: "car" },
  { name: "Shopping", icon: "shopping-bag" },
  { name: "Entertainment", icon: "film" },
  { name: "Bills & Utilities", icon: "zap" },
  { name: "Health", icon: "heart" },
  { name: "Education", icon: "book" },
  { name: "Groceries", icon: "shopping-cart" },
  { name: "Rent", icon: "home" },
  { name: "Salary", icon: "briefcase" },
  { name: "Investment", icon: "trending-up" },
  { name: "Transfer", icon: "repeat" },
  { name: "ATM Withdrawal", icon: "credit-card" },
  { name: "Other", icon: "tag" },
];

const defaultRules = [
  { keyword: "SWIGGY", category: "Food & Dining", confidence: 0.95 },
  { keyword: "ZOMATO", category: "Food & Dining", confidence: 0.95 },
  { keyword: "DOMINOS", category: "Food & Dining", confidence: 0.9 },
  { keyword: "MCDONALD", category: "Food & Dining", confidence: 0.9 },
  { keyword: "RESTAURANT", category: "Food & Dining", confidence: 0.8 },
  { keyword: "UBER", category: "Transport", confidence: 0.9 },
  { keyword: "OLA", category: "Transport", confidence: 0.9 },
  { keyword: "RAPIDO", category: "Transport", confidence: 0.9 },
  { keyword: "IRCTC", category: "Transport", confidence: 0.85 },
  { keyword: "BMTC", category: "Transport", confidence: 0.95 },
  { keyword: "METRO", category: "Transport", confidence: 0.7 },
  { keyword: "AMAZON", category: "Shopping", confidence: 0.85 },
  { keyword: "FLIPKART", category: "Shopping", confidence: 0.85 },
  { keyword: "MYNTRA", category: "Shopping", confidence: 0.9 },
  { keyword: "AJIO", category: "Shopping", confidence: 0.9 },
  { keyword: "NETFLIX", category: "Entertainment", confidence: 0.95 },
  { keyword: "HOTSTAR", category: "Entertainment", confidence: 0.95 },
  { keyword: "SPOTIFY", category: "Entertainment", confidence: 0.95 },
  { keyword: "PRIME VIDEO", category: "Entertainment", confidence: 0.95 },
  { keyword: "ELECTRICITY", category: "Bills & Utilities", confidence: 0.9 },
  { keyword: "BROADBAND", category: "Bills & Utilities", confidence: 0.9 },
  { keyword: "AIRTEL", category: "Bills & Utilities", confidence: 0.8 },
  { keyword: "JIO", category: "Bills & Utilities", confidence: 0.8 },
  { keyword: "VODAFONE", category: "Bills & Utilities", confidence: 0.8 },
  { keyword: "APOLLO", category: "Health", confidence: 0.8 },
  { keyword: "PHARMACY", category: "Health", confidence: 0.85 },
  { keyword: "HOSPITAL", category: "Health", confidence: 0.9 },
  { keyword: "MEDPLUS", category: "Health", confidence: 0.85 },
  { keyword: "BIGBASKET", category: "Groceries", confidence: 0.9 },
  { keyword: "BLINKIT", category: "Groceries", confidence: 0.9 },
  { keyword: "DMART", category: "Groceries", confidence: 0.85 },
  { keyword: "ZERODHA", category: "Investment", confidence: 0.9 },
  { keyword: "GROWW", category: "Investment", confidence: 0.9 },
  { keyword: "MUTUAL FUND", category: "Investment", confidence: 0.9 },
  { keyword: "SALARY", category: "Salary", confidence: 0.95 },
  { keyword: "ATM", category: "ATM Withdrawal", confidence: 0.9 },
  { keyword: "ATW", category: "ATM Withdrawal", confidence: 0.9 },
  { keyword: "CASH WDL", category: "ATM Withdrawal", confidence: 0.95 },
  { keyword: "NEFT", category: "Transfer", confidence: 0.7 },
  { keyword: "IMPS", category: "Transfer", confidence: 0.7 },
  { keyword: "RTGS", category: "Transfer", confidence: 0.7 },
];

async function main() {
  console.log("Seeding database...");

  // Upsert categories
  const categoryMap: Record<string, string> = {};
  for (const cat of defaultCategories) {
    const created = await prisma.category.upsert({
      where: { name: cat.name },
      update: { icon: cat.icon },
      create: { name: cat.name, icon: cat.icon, isCustom: false },
    });
    categoryMap[cat.name] = created.id;
  }

  // Upsert categorization rules
  for (const rule of defaultRules) {
    const categoryId = categoryMap[rule.category];
    if (!categoryId) continue;
    await prisma.categorizationRule.upsert({
      where: { keyword_categoryId: { keyword: rule.keyword, categoryId } },
      update: { confidence: rule.confidence },
      create: {
        keyword: rule.keyword,
        categoryId,
        confidence: rule.confidence,
        createdFromUserEdit: false,
      },
    });
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
