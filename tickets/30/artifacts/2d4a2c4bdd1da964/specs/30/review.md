# Review: Date filter on invoice list

## Round 1

- **blocker** `tests/` — No Playwright E2E tests added for date filter functionality. Constitution requires "every implementation task ships tests for the code it adds." QA plan specifies required test coverage for AC1-AC6 (filter UI visibility, preset/custom date ranges, badge display, filter clearing, combined filtering). Add tests following patterns in `tests/facility/billing/` that verify: (1) Period filter appears in filter menu, (2) preset date range filtering (e.g., "Last 7 days") updates URL and filters results, (3) custom date range selection works, (4) date filter badge appears in selected filters bar, (5) clearing date filter restores all invoices, (6) combining date filter with status/created_by filters works correctly.

## Round 2

Clean — no findings.
