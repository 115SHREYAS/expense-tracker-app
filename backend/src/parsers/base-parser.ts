export interface ParsedTransaction {
  date: Date;
  description: string;
  amount: number;
  type: "DEBIT" | "CREDIT";
  balance?: number;
  hash: string;
}

export interface BankParser {
  parse(buffer: Buffer): ParsedTransaction[];
}
