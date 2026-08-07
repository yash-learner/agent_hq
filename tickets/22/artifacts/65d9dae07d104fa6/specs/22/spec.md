# Ticket 22: Support for creating multiple diagnostic reports for SR

## Problem

The frontend currently allows only one diagnostic report to be created per Service Request, even when the Activity Definition defines multiple Diagnostic Report codes. The form always works with `diagnosticReports[0]` (the first report) and does not expose the ability to create additional reports for the remaining codes. The backend already supports multiple reports per SR, so this is purely a frontend limitation.

## Acceptance Criteria

1. Given an SR whose AD has 2+ diagnostic report codes and no existing reports, when viewing the SR, then the codes dropdown shows all available codes.

2. Given an SR whose AD has 2+ diagnostic report codes, when creating the first diagnostic report, then the selected code is saved and that report is displayed.

3. Given an SR that has 1 diagnostic report and the AD defines 2+ codes, when viewing the SR again, then a UI affordance (e.g., "Create another report" button) appears to create a second report.

4. Given an SR with 1 existing diagnostic report, when creating a new report, then the codes dropdown shows only codes not yet used by existing reports.

5. Given an SR with N diagnostic reports matching N codes from the AD, when viewing the SR, then the "create report" affordance is hidden or disabled.

6. Given multiple diagnostic reports exist for an SR, when switching between reports, then each report displays its own observations, conclusion, and attachments independently.

7. Given multiple diagnostic reports exist for an SR, when adding/editing observations for one report, then changes are saved to that specific report without affecting others.

## Capability Notes

- `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx` -- handles the current single-report UI; currently uses `diagnosticReports[0]`; needs refactor to support multiple reports (lines 138-140, 202-207).
- `src/types/emr/activityDefinition/activityDefinition.ts` -- `ActivityDefinitionReadSpec.diagnostic_report_codes` is an array of `Code[]` (line 49).
- `src/types/emr/serviceRequest/serviceRequest.ts` -- `ServiceRequestReadSpec.diagnostic_reports` is `DiagnosticReportRead[]`, backend already returns all reports (line 116).
- `src/types/emr/diagnosticReport/diagnosticReportApi.ts` -- `createDiagnosticReport` accepts a `code` field in the body (lines 16-21).
- `src/types/emr/diagnosticReport/diagnosticReport.ts` -- `DiagnosticReportCreate` includes optional `code?: Code` (line 49).

## Open Questions

None.
