# Ticket 28: Support Multiple Diagnostic Reports per Service Request

## Problem

The frontend currently limits users to creating a single diagnostic report per Service Request (SR), even when the Activity Definition (AD) specifies multiple `diagnostic_report_codes`. Once a diagnostic report is created, the form hides and no additional reports can be created, wasting the remaining codes from the AD.

## Acceptance Criteria

1. Given an SR with an AD defining 3 diagnostic report codes, when viewing the SR, then the user can create up to 3 diagnostic reports, one for each code.

2. Given an SR where 1 diagnostic report has been created, when the user views the codes dropdown, then only the remaining (unused) codes appear as options.

3. Given an SR where all diagnostic report codes have been used, when the user views the form, then the create report UI is hidden and no dropdown appears.

4. Given an SR where the latest report is in draft/partial status, when creating a new report, then the form allows creating another report with a different unused code without requiring the first to be finalized.

5. Given an SR where 2 of 3 codes have been used, when the user creates a report using the last remaining code, then after creation the dropdown updates to show no remaining options and the form hides.

6. Given an SR with no AD or an AD with zero diagnostic report codes, when viewing the SR, then the report creation flow works as before (no codes dropdown, single report allowed).

7. Given an SR with 1 diagnostic report code used, when the page reloads, then the codes dropdown still shows only the unused codes (state persists from the API response).

## Capability Notes

- `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx` -- existing component that handles report creation and code selection (lines 116-1300+); currently shows the form only when `diagnosticReports.length === 0` or the latest report is not final.
- `src/types/emr/diagnosticReport/diagnosticReport.ts:DiagnosticReportRead` -- existing interface includes `code?: Code` field which stores which diagnostic report code was used.
- `src/types/emr/activityDefinition/activityDefinition.ts:ActivityDefinitionReadSpec.diagnostic_report_codes` -- existing field (line 49) that provides the list of available codes.
- `src/pages/Facility/services/serviceRequests/ServiceRequestShow.tsx:diagnosticReports` -- existing data (line 268) passed to DiagnosticReportForm; contains all reports for the SR.
- `src/types/emr/diagnosticReport/diagnosticReportApi.ts:createDiagnosticReport` -- existing API endpoint that supports creating multiple reports per SR.

## Open Questions

None.
