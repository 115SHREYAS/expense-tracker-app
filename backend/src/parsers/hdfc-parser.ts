import * as XLSX from "xlsx";
import crypto from "crypto";
import { BankParser, ParsedTransaction } from "./base-parser";

/**
 * HDFC Bank XLS Statement Parser
 *
 * Actual HDFC column layout (7 columns):
 *   0: Date           (DD/MM/YY)
 *   1: Narration      (transaction description)
 *   2: Chq./Ref.No.   (reference number)
 *   3: Value Dt       (value date)
 *   4: Withdrawal Amt (debit)
 *   5: Deposit Amt    (credit)
 *   6: Closing Balance
 *
 * The file contains header rows, address info, asterisk separators,
 * and a summary section at the bottom — all of which must be skipped.
 */
export class HdfcParser implements BankParser {
  parse(buffer: Buffer): ParsedTransaction[] {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });

    const transactions: ParsedTransaction[] = [];
    const headerIndex = this.findHeaderRow(rows);
    if (headerIndex === -1) return transactions;

    for (let i = headerIndex + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 5) continue;

      const firstCell = String(row[0] || "").trim();

      // Skip asterisk separator rows
      if (firstCell.startsWith("***")) {
        // If we already have transactions, the bottom separator means we're done
        if (transactions.length > 0) break;
        continue;
      }

      const parsed = this.parseRow(row);
      if (parsed) transactions.push(parsed);
    }

    return transactions;
  }

  private findHeaderRow(rows: any[][]): number {
    for (let i = 0; i < Math.min(rows.length, 30); i++) {
      const row = rows[i];
      if (!row) continue;
      const joined = row.map((c: any) => String(c || "").toLowerCase()).join(" ");
      if (joined.includes("date") && joined.includes("narration")) {
        return i;
      }
    }
    return -1;
  }

  private parseRow(row: any[]): ParsedTransaction | null {
    const dateStr = String(row[0] || "").trim();
    const description = String(row[1] || "").trim();
    const refNo = String(row[2] || "").trim();
    // row[3] = Value Date (not needed)
    const withdrawalStr = String(row[4] || "").trim();
    const depositStr = String(row[5] || "").trim();
    const balanceStr = String(row[6] || "").trim();

    // Skip non-transaction rows (asterisks, empty, summary)
    if (!dateStr || !description) return null;
    if (dateStr.startsWith("***") || description.startsWith("***")) return null;

    const date = this.parseDate(dateStr);
    if (!date) return null;

    const debit = this.parseAmount(withdrawalStr);
    const credit = this.parseAmount(depositStr);

    if (debit === 0 && credit === 0) return null;

    const type = debit > 0 ? "DEBIT" : "CREDIT";
    const amount = debit > 0 ? debit : credit;
    const balance = this.parseAmount(balanceStr);

    // Use ref number in hash for uniqueness — same person/amount/date can occur multiple times
    const hash = this.generateHash(date, description, refNo, amount, type);

    return { date, description, amount, type, balance: balance || undefined, hash };
  }

  private parseDate(str: string): Date | null {
    // HDFC format: DD/MM/YY
    const parts = str.split("/");
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    let year = parseInt(parts[2], 10);
    if (year < 100) year += 2000;

    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    const date = new Date(year, month, day);
    if (isNaN(date.getTime())) return null;
    return date;
  }

  private parseAmount(str: string): number {
    const cleaned = str.replace(/,/g, "").replace(/[^\d.]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  private generateHash(date: Date, description: string, refNo: string, amount: number, type: string): string {
    const raw = `${date.toISOString().split("T")[0]}|${description}|${refNo}|${amount.toFixed(2)}|${type}`;
    return crypto.createHash("sha256").update(raw).digest("hex");
  }
}
