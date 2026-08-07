# Ticket 18: Support for creating multiple diagnostic reports for SR

## Problem

The `DiagnosticReportForm` component currently allows creating only one diagnostic report per Service Request, even when the Activity Definition specifies multiple diagnostic report codes. The component treats `diagnosticReports[0]` as "the report" and hides the creation UI once any report exists. Users cannot create subsequent reports for the remaining codes defined in the Activity Definition.

## Acceptance criteria

1. Given an SR with an AD defining 3 diagnostic report codes and no existing reports, when the user views the SR, then the codes dropdown shows all 3 codes as options.
2. Given the same SR, when the user creates a diagnostic report for one code, then the codes dropdown updates to show only the 2 remaining unused codes.
3. Given an SR with 2 existing reports and 1 remaining code, when the user creates a report for the last code, then the "Create Report" button is disabled and no codes appear in the dropdown.
4. Given an SR with multiple diagnostic reports created, when the user views the SR page, then all created reports are visible (not just the first one).
5. Given an SR whose AD has no diagnostic report codes defined, when the user creates a report, then the behavior remains unchanged from the current implementation.
6. Given an SR with 2 of 3 reports created, when the user refreshes the page, then the codes dropdown still shows only the 1 unused code.
7. Given an SR with multiple finalized reports, when the user views the SR, then each report displays independently with its own observations and conclusion.

## Capability notes

- `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx:138-140` — currently uses `diagnosticReports[0]` as the single report; needs logic to handle multiple reports and filter available codes.
- `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx:468-488` — `handleCreateReport` checks `!hasReport` before creating; needs to allow creation when unused codes remain.
- `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx:1242-1275` — codes dropdown and "Create Report" button are hidden when `hasReport` is true; needs to show when `availableCodes.length > 0`.
- `src/types/emr/activityDefinition/activityDefinition.ts:49` — `diagnostic_report_codes: Code[]` exists and supports multiple codes.
- `src/types/emr/serviceRequest/serviceRequest.ts:116` — `diagnostic_reports: DiagnosticReportRead[]` already supports multiple reports in the data model.

## Open questions

None.
