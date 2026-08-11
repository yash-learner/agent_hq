# Review: Support for creating multiple diagnostic reports for SR

## Round 1

### Blockers

- **blocker** `specs/59/qa-plan.md:26-42` — UI recipe for adding multiple diagnostic report codes is incomplete. The form uses a multi-select pattern (ValueSetSelect that adds to an array, with individual remove buttons per line 1015-1070 of `ActivityDefinitionForm.tsx`), but the recipe at lines 32-33 says "Add 3 diagnostic report codes from valueset picker" without numbered steps showing: (1) search for first code, (2) select it to add to list, (3) repeat for second code, (4) repeat for third code. Without this, QA cannot execute the setup.

- **blocker** `specs/59/qa-plan.md:58-81` — API seed body provides LOINC codes (10562-1, 16365-9, 18881-2) without provenance proving these codes are correct for the display names. The `DIAGNOSTIC_REPORT_CODES` constant at `tests/facility/settings/activityDefinition/activityDefinition.ts:49-60` contains display names only; no test file uses these specific LOINC codes. Either cite a valueset fixture/API response proving the code-to-display mapping, or use the UI recipe exclusively (which validates codes through the actual valueset picker).

### Should-fix

- **should-fix** `src/pages/Facility/services/serviceRequests/ServiceRequestShow.tsx:36-47` — Code duplication: lines 36-47 compute `usedReportCodes`, `availableReportCodes`, and `canCreateMoreReports` identically to `DiagnosticReportForm.tsx:88-104`. Extract to a shared helper `getAvailableReportCodes(diagnosticReports, activityDefinition)` in `src/Utils/` to avoid maintaining the same logic in two places.

## Round 2

Clean — no findings.
