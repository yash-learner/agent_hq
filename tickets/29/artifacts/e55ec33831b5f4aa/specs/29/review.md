# Review: Add date range filter to facility invoice list

## Round 1

- **blocker** `tests/` — Missing Playwright test coverage. QA plan section "Test plan / notes" (lines 309-318) specifies test file `tests/facility/billing/invoiceListDateFilter.spec.ts` with 7 test scenarios, but no test file exists in the implementation.
- **blocker** `specs/29/qa-plan.md` — Data setup lacks provenance. Multiple acceptance criteria (AC2, AC3, AC5) require "at least 2-3 invoices with different created_date values" but the Data setup sections (lines 57-67, 104-108, 186-194) don't cite fixture IDs, don't reference existing test seed helpers (e.g., from `tests/` directory), and fallback UI recipes lack numbered steps and proven payloads from `src/types/billing/invoice/invoiceApi.ts` schemas.
- **blocker** `specs/29/qa-plan.md:67` — UI recipe for invoice creation (AC2 Data setup) says "Fill required fields and create invoice" without enumerating which fields are required or providing example values based on the `InvoiceCreate` schema from `invoiceApi.ts`.

## Round 2

- **blocker** `tests/facility/billing/invoiceListDateFilter.spec.ts:28-67` — Test data setup creates invoices with different `issue_date` values but filters operate on backend-assigned `created_date`. Both invoices are created during the same `beforeAll` execution, so both will have nearly identical `created_date` timestamps (both ~now), making date range filter tests ineffective. Backend invoice creation API doesn't accept `created_date` in POST body per `InvoiceCreate` type (lines 34-40 in `src/types/billing/invoice/invoice.ts`). Backend likely auto-sets `created_date=now()` on creation. Need one of: (1) create one invoice, wait several seconds, create second invoice (fragile timing dependency); (2) use existing fixture invoices with varied `created_date` if backend `load_fixtures` provides them; (3) if backend test fixtures don't have date variety, document that date filter tests rely on manual/fixture data and adjust test to only verify filter UI/params without asserting on result counts.

## Round 3

Clean — no findings.
