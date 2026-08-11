# Review: Support for Creating Multiple Diagnostic Reports for Service Request

## Round 1

- **blocker** `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx:221` — useEffect depends on `availableCodes` which is recalculated every render (new array reference), causing the effect to run on every render instead of only when diagnosticReports changes. Remove `availableCodes` from the dependency array and keep only `[diagnosticReports]`, or memoize `availableCodes` with `useMemo`.

## Round 2

- **blocker** `specs/47/qa-plan.md:63` — Data setup claims LOINC codes (10834-0, 10835-7, 10836-5) come from `DIAGNOSTIC_REPORT_CODES` in test file, but that array contains only display names (line 50-52 of activityDefinition.ts), not Code objects with system/code/display. The three LOINC codes in the setup body have no provenance from fixtures, existing test seeds, or proven backend acceptance; use codes from an existing fixture or add a proven API seed helper that other tests validate.
- **blocker** `specs/47/qa-plan.md:316` — AC6 data setup uses specimen slug "urinalysis-specimen" but `SPECIMEN_DEFINITIONS` (line 33-38 of activityDefinition.ts) contains display names like "Urinalysis Specimen", not slugs. The slug format and backend acceptance are unproven; use a specimen slug from an existing working test or fixture.
- **should-fix** `specs/47/qa-plan.md:403-410` — Test plan includes suite/CI requirements ("Playwright E2E coverage should include...", "CI must pass") in the live Action/Expect criteria section; these are build gates, not QA traversal steps, and should be removed from the plan or moved to a separate CI validation note.
