# Review Findings

## Round 1

- **blocker** `tests/PLAYWRIGHT_GUIDE.md:290,296,300` — markdown formatting broken by concatenating template literals on single lines; restore newlines between each URL path (line 290: split 6 facility paths, line 296: split 3 patient paths, line 300: split 2 admin paths).
- **should-fix** `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx:196-204` — after creating a diagnostic report, `selectedReportCode` state is not cleared; add `setSelectedReportCode(null)` in the `onSuccess` handler so the next "Create another report" dropdown shows placeholder instead of the previous selection.
- **should-fix** `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx:1272-1279` — the "Create another report" Select uses `selectedReportCode?.code` as value, which maintains a stale selection after that code is used; ensure the Select resets when its code is no longer in `availableCodes`, or rely on the first should-fix to clear state after each creation.
