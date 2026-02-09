import prisma from "../utils/prisma";

interface CategoryMatch {
  categoryId: string;
  confidence: number;
}

export async function categorizeTransaction(description: string): Promise<CategoryMatch | null> {
  const rules = await prisma.categorizationRule.findMany({
    include: { category: true },
    orderBy: { confidence: "desc" },
  });

  const upperDesc = description.toUpperCase();
  let bestMatch: CategoryMatch | null = null;

  for (const rule of rules) {
    if (upperDesc.includes(rule.keyword.toUpperCase())) {
      if (!bestMatch || rule.confidence > bestMatch.confidence) {
        bestMatch = { categoryId: rule.categoryId, confidence: rule.confidence };
      }
    }
  }

  return bestMatch;
}

export function inferPaymentMode(description: string): "UPI" | "CARD" | "CASH" | "BANK" {
  const upper = description.toUpperCase();

  if (upper.includes("UPI") || upper.includes("@")) return "UPI";
  if (upper.includes("POS") || upper.includes("CARD") || upper.includes("ECOM")) return "CARD";
  if (upper.includes("ATM") || upper.includes("CASH WDL") || upper.includes("CASH WITHDRAWAL")) return "CASH";
  return "BANK";
}

export async function learnFromUserEdit(description: string, categoryId: string): Promise<void> {
  // Extract meaningful keywords from the description
  const keywords = extractKeywords(description);

  for (const keyword of keywords) {
    await prisma.categorizationRule.upsert({
      where: { keyword_categoryId: { keyword, categoryId } },
      update: { confidence: 0.85, createdFromUserEdit: true },
      create: {
        keyword,
        categoryId,
        confidence: 0.85,
        createdFromUserEdit: true,
      },
    });
  }
}

function extractKeywords(description: string): string[] {
  const stopWords = new Set([
    "THE", "TO", "FROM", "FOR", "AND", "OR", "IN", "OF", "A", "AN",
    "BY", "AT", "ON", "IS", "IT", "AS", "IF", "NO", "NOT", "SO",
    "REF", "INR", "NEFT", "IMPS", "UPI", "POS", "ECOM", "CR", "DR",
  ]);

  const words = description
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  // Return the most specific word (longest unique word, likely the merchant name)
  if (words.length === 0) return [];

  words.sort((a, b) => b.length - a.length);
  return [words[0]];
}
