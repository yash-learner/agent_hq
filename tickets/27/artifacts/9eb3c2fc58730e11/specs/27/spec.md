# Specification: Support multiple diagnostic reports per Service Request

## Problem

When a Service Request's Activity Definition specifies multiple Diagnostic Report codes, the frontend currently allows creating only one diagnostic report. The `handleCreateReport()` function checks `if (!hasReport)` and exits early if any report exists, preventing users from creating additional reports for the remaining codes. The backend already supports multiple diagnostic reports per Service Request.

## Acceptance Criteria

1. Given an SR with an AD that has 3 diagnostic report codes and 0 existing reports, when the user opens the diagnostic report form, then all 3 codes appear in the dropdown.
2. Given the user selects code A and creates a report, when the form reloads, then code A is filtered from the dropdown and codes B and C remain selectable.
3. Given an SR with 2 remaining unused codes, when the user creates a report for code B, then the form shows code C as the only remaining option.
4. Given an SR with N diagnostic report codes and N existing reports (one per code), when the user views the form, then no dropdown is shown and the create button is disabled.
5. Given an SR with 2 existing reports (codes A, B) and 3 total codes, when the user navigates to the page, then they can create a third report using code C.
6. Given multiple existing reports, when the user views the service request, then all reports are visible in the UI and individually editable.
7. Given an SR with an AD that has 0 diagnostic report codes, when the user creates a report, then the dropdown is not shown and the report is created without a code (existing behavior).

## Capability Notes

- `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx:468-489` -- `handleCreateReport()` exists, currently blocks creation when `hasReport` is true
- `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx:1242-1276` -- Code dropdown exists, shows all `activityDefinition.diagnostic_report_codes`
- `src/types/emr/activityDefinition/activityDefinition.ts:49` -- `diagnostic_report_codes: Code[]` exists on ActivityDefinition
- `src/types/emr/serviceRequest/serviceRequest.ts:116` -- `diagnostic_reports: DiagnosticReportRead[]` exists on ServiceRequest
- `src/types/emr/diagnosticReport/diagnosticReport.ts:49` -- `code?: Code` exists on DiagnosticReport

## Open Questions

None.
