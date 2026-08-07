# Review: Add date range filter to facility invoice list

## Round 1

- **blocker** `tests/` — Missing Playwright test coverage. QA plan section "Test plan / notes" (lines 309-318) specifies test file `tests/facility/billing/invoiceListDateFilter.spec.ts` with 7 test scenarios, but no test file exists in the implementation.
- **blocker** `specs/29/qa-plan.md` — Data setup lacks provenance. Multiple acceptance criteria (AC2, AC3, AC5) require "at least 2-3 invoices with different created_date values" but the Data setup sections (lines 57-67, 104-108, 186-194) don't cite fixture IDs, don't reference existing test seed helpers (e.g., from `tests/` directory), and fallback UI recipes lack numbered steps and proven payloads from `src/types/billing/invoice/invoiceApi.ts` schemas.
- **blocker** `specs/29/qa-plan.md:67` — UI recipe for invoice creation (AC2 Data setup) says "Fill required fields and create invoice" without enumerating which fields are required or providing example values based on the `InvoiceCreate` schema from `invoiceApi.ts`.
