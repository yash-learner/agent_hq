# Review: Support Multiple Diagnostic Reports per Service Request

## Round 1

- **blocker** `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx:256-260` — AC 7 regression: button disable logic `!hasUnusedCodes || (!!unusedReportCodes.length && !selectedReportCode)` blocks report creation when AD has no diagnostic_report_codes defined. When AD has no codes, `hasUnusedCodes` is false, making `!hasUnusedCodes` true, disabling the button. Original logic was `(!!activityDefinition?.diagnostic_report_codes?.length && !selectedReportCode)` which allowed no-code ADs. Fix: change to `(!hasUnusedCodes && !!activityDefinition?.diagnostic_report_codes?.length) || (!!unusedReportCodes.length && !selectedReportCode)` to disable only when codes exist but none are unused.
- **blocker** `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx:165-167` — Same disable logic in additional report section will block no-code ADs, though this section shouldn't render for no-code ADs anyway (guarded by `hasUnusedCodes`). Still, the button logic should match the initial creation form for consistency.
