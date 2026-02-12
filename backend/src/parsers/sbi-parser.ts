import * as XLSX from "xlsx";
import crypto from "crypto";
import { BankParser, ParsedTransaction, ParseOptions } from "./base-parser";

/**
 * SBI Bank XLSX Statement Parser
 *
 * SBI column layout (6 columns):
 *   0: Date           (DD/MM/YYYY)
 *   1: Details        (multiline transaction description)
 *   2: Ref No/Cheque No
 *   3: Debit          (empty for credits)
 *   4: Credit         (empty for debits)
 *   5: Balance        (closing balance)
 *
 * Header row is variable (around row 16) due to account metadata.
 * Data ends at statement summary section.
 * Files may be password-protected.
 */
export class SbiParser implements BankParser {
  async parseAsync(buffer: Buffer, options?: ParseOptions): Promise<ParsedTransaction[]> {
    let rows: any[][];

    if (options?.password) {
      // Use xlsx-populate for password-protected files
      const XlsxPopulate = require("xlsx-populate");
      const workbook = await XlsxPopulate.fromDataAsync(buffer, { password: options.password });
      const sheet = workbook.sheet(0);
      const usedRange = sheet.usedRange();
      if (!usedRange) return [];
      // Extract raw values from xlsx-populate
      const rangeValues: any[][] = usedRange.value();
      rows = rangeValues.map((row: any[]) =>
        row.map((cell: any) => (cell === undefined || cell === null ? "" : cell))
      );
    } else {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
    }

    const transactions: ParsedTransaction[] = [];
    const headerIndex = this.findHeaderRow(rows);
    if (headerIndex === -1) return transactions;

    for (let i = headerIndex + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 4) continue;

      // Stop at summary section
      const firstCell = String(row[0] || "").trim().toLowerCase();
      if (firstCell.includes("opening balance") || firstCell.includes("closing balance")) break;
      if (firstCell.includes("transaction total")) break;

      const parsed = this.parseRow(row);
      if (parsed) transactions.push(parsed);
    }

    return transactions;
  }

  // Synchronous interface for BankParser compatibility (not used for SBI, but required by interface)
  parse(buffer: Buffer, options?: ParseOptions): ParsedTransaction[] {
    throw new Error("SBI parser requires async parsing. Use parseAsync() instead.");
  }

  private findHeaderRow(rows: any[][]): number {
    for (let i = 0; i < Math.min(rows.length, 30); i++) {
      const row = rows[i];
      if (!row) continue;
      const joined = row.map((c: any) => String(c || "").toLowerCase()).join(" ");
      if (joined.includes("date") && joined.includes("details")) {
        return i;
      }
    }
    return -1;
  }

  private parseRow(row: any[]): ParsedTransaction | null {
    const dateStr = String(row[0] || "").trim();
    const description = this.cleanDescription(String(row[1] || ""));
    const refNo = String(row[2] || "").trim();
    const debitStr = String(row[3] || "").trim();
    const creditStr = String(row[4] || "").trim();
    const balanceStr = String(row[5] || "").trim();

    if (!dateStr || !description) return null;

    const date = this.parseDate(dateStr);
    if (!date) return null;

    const debit = this.parseAmount(debitStr);
    const credit = this.parseAmount(creditStr);

    if (debit === 0 && credit === 0) return null;

    const type = debit > 0 ? "DEBIT" : "CREDIT";
    const amount = debit > 0 ? debit : credit;
    const balance = this.parseAmount(balanceStr);

    const hash = this.generateHash(date, description, refNo, amount, type);

    return { date, description, amount, type, balance: balance || undefined, hash };
  }

  private cleanDescription(raw: string): string {
    return raw
      .replace(/\r?\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private parseDate(str: string): Date | null {
    // SBI format: DD/MM/YYYY or DD MMM YYYY
    const slashParts = str.split("/");
    if (slashParts.length === 3) {
      const day = parseInt(slashParts[0], 10);
      const month = parseInt(slashParts[1], 10) - 1;
      let year = parseInt(slashParts[2], 10);
      if (year < 100) year += 2000;

      if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
      const date = new Date(year, month, day);
      if (isNaN(date.getTime())) return null;
      return date;
    }

    // Handle Date objects from xlsx-populate (come as JS Date already)
    if (str && !isNaN(new Date(str).getTime())) {
      return new Date(str);
    }

    return null;
  }

  private parseAmount(str: string): number {
    if (!str) return 0;
    const cleaned = str.replace(/,/g, "").replace(/[^\d.]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  private generateHash(date: Date, description: string, refNo: string, amount: number, type: string): string {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const normalizedDesc = description.toLowerCase().replace(/\s+/g, " ").trim();
    const normalizedRef = refNo.toLowerCase().trim();
    const raw = `${dateStr}|${normalizedDesc}|${normalizedRef}|${amount.toFixed(2)}|${type}`;
    return crypto.createHash("sha256").update(raw).digest("hex");
  }
}
