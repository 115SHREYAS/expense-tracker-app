# Enhancement Opportunities

This document records product and engineering enhancements suggested by the current implementation. The project already supports HDFC and SBI statement imports, automatic categorization, manual transactions, budgets, transaction splits, filtering, CSV export, and dashboard analytics. The items below extend those foundations.

## Recommended priorities

### 1. Make statement imports reviewable and recoverable

**Opportunity:** Add an import preview and import history for HDFC and SBI statements.

**Why:** Upload routes parse and write transactions immediately. The response reports totals, imported rows, and duplicates, but there is no persisted record of the uploaded statement, row-level parse failures, or a way to review proposed transactions before saving them.

**Enhancement:** Show parsed rows, duplicate flags, and uncategorized items before confirmation. Persist an import record with source, filename, timestamp, counts, and status; allow users to inspect failures and retry an interrupted import.

**Value:** Users can catch parser mistakes early and understand what each upload changed.

### 2. Add transaction editing and deletion

**Opportunity:** Let users correct transaction details and remove unwanted records.

**Why:** The transaction API currently supports creation, category updates, and splitting. The UI exposes category correction and splits, but no general edit or delete flow.

**Enhancement:** Provide edit and delete actions for date, description, amount, type, payment mode, and category, with validation and a clear confirmation for deletion. Preserve split integrity when a parent transaction changes.

**Value:** Users can fix misread imports and clean up erroneous manual entries without database intervention.

### 3. Improve categorization controls and transparency

**Opportunity:** Give users a way to manage rules and understand automatic category choices.

**Why:** Categorization is based on substring keyword matches ordered by confidence. User edits learn one longest keyword, and the interface does not show the matched rule or confidence.

**Enhancement:** Show the matching keyword and confidence, support adding/editing/removing rules, and offer a review queue for uncategorized or low-confidence transactions. Consider merchant normalization so small description variations match consistently.

**Value:** Users can correct systematic errors and trust the automation more.

### 4. Strengthen import correctness and performance

**Opportunity:** Make imports safe under retries and efficient for large statements.

**Why:** HDFC and SBI routes duplicate much of the parsing/deduplication/import flow, categorize rows one at a time, and create transactions individually. A concurrent retry can race between duplicate lookup and insert; a uniqueness conflict can fail the request after some rows have been written.

**Enhancement:** Share a common import pipeline, use database-level conflict-safe bulk writes, and return per-row outcomes. Make each import retry idempotent and define duplicate matching behavior for both existing and repeated rows in the same file.

**Value:** Large imports complete faster and partial failures are easier to recover from.

### 5. Expand analytics periods and comparisons

**Opportunity:** Allow custom date ranges and useful period-over-period comparisons.

**Why:** The dashboard offers week, month, and year presets. Its date range uses the trailing 7/30 days or the current calendar year, while budget status is always for the current calendar month.

**Enhancement:** Add custom date selection, calendar-month and year-to-date options, and comparisons with the previous equivalent period. Include trend summaries for category and payment-mode spending.

**Value:** Users can answer questions about specific pay cycles, months, and changes in spending.

### 6. Add recurring transaction detection

**Opportunity:** Identify subscriptions, bills, and regular income.

**Why:** Transactions store descriptions, amounts, dates, and categories, but the app does not identify repeated patterns or forecast upcoming spending.

**Enhancement:** Detect likely recurring merchants and amount/date patterns, let users confirm or dismiss them, and show expected upcoming charges with links to the underlying transactions.

**Value:** Users can spot subscriptions and plan around predictable expenses.

### 7. Support multiple accounts and balances

**Opportunity:** Track which account a transaction belongs to and reconcile balances.

**Why:** A transaction has a bank source (HDFC, SBI, or manual), but there is no account model or account identifier. Parsers can read a balance from statement rows, but imports do not store it.

**Enhancement:** Add user-owned accounts with institution, display name, and optional currency; associate imports and transactions with an account; preserve statement balances and provide reconciliation views.

**Value:** Users with multiple bank accounts can see account-level activity and identify missing or duplicated rows.

### 8. Improve data validation and feedback

**Opportunity:** Return actionable validation errors instead of generic failures.

**Why:** Several routes accept values from request bodies or query parameters with limited validation, and frontend request failures are commonly sent only to the console. Invalid date ranges, enum values, or amounts can therefore be confusing to diagnose.

**Enhancement:** Validate request schemas and bounds consistently, show field-level errors in forms, and provide clear upload/API error messages without exposing internal details.

**Value:** Fewer confusing failures and more predictable data entry.

### 9. Add automated parser and API coverage

**Opportunity:** Protect financial data handling with regression checks.

**Why:** The repository has no test script or test files in its package setup. Statement parsers handle variable headers, date formats, encrypted files, and duplicate hashes, all of which can regress as formats change.

**Enhancement:** Add sanitized statement fixtures and tests for parser edge cases, duplicate handling, categorization, split totals, authorization boundaries, and analytics calculations. Add a repeatable CI build/lint/test workflow.

**Value:** Changes can be made with more confidence and bank-format changes can be caught before release.

### 10. Add user data portability and privacy controls

**Opportunity:** Let users export or remove their account data.

**Why:** CSV export covers filtered transactions, but there is no full-account export or account deletion flow in the visible API. Financial records are sensitive and users may need a complete backup or removal option.

**Enhancement:** Provide a complete export including categories, budgets, and transaction splits, plus an account deletion flow with clear consequences and confirmation.

**Value:** Users retain control over their financial history and account lifecycle.

## Suggested delivery order

1. Parser/API regression coverage and request validation.
2. Transaction editing/deletion and categorization review controls.
3. Reviewable, retry-safe statement imports.
4. Custom analytics ranges and period comparisons.
5. Recurring detection, account tracking, and expanded portability.
