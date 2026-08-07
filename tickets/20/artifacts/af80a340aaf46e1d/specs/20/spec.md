# Ticket 20: Support multiple diagnostic reports per Service Request

## Problem

When a Service Request's Activity Definition defines multiple Diagnostic Report codes, the frontend currently only allows creating one diagnostic report. The codes dropdown offers all Activity Definition codes, but once a report is created, no mechanism exists to create additional reports using the remaining codes. The backend already supports multiple diagnostic reports per Service Request; this is a frontend limitation.

## Acceptance Criteria

1. Given an SR with an AD containing 3 diagnostic report codes and no reports created, when the user opens the SR detail page, then all 3 codes appear in the diagnostic report codes dropdown.

2. Given the above SR, when the user creates a diagnostic report using the first code, then that code is removed from the dropdown and the remaining 2 codes are still available for selection.

3. Given the SR now has 1 report and 2 unused codes, when the user creates a second diagnostic report using another code without reloading the page, then the dropdown updates to show only 1 remaining unused code.

4. Given the SR has diagnostic reports for all 3 AD codes, when the user views the SR detail page, then no diagnostic report creation form is displayed.

5. Given the SR with all codes used, when the page is reloaded, then the state persists and no creation form appears.

6. Given an SR with an AD containing N diagnostic report codes, when the user creates N diagnostic reports (one per code), then each report is associated with a distinct code from the AD.

7. Given diagnostic reports exist for some but not all AD codes, when the user reloads the page, then only the unused codes appear in the dropdown.

## Capability Notes

- `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx` — exists; handles diagnostic report creation and displays the codes dropdown (lines 1242-1289)
- `src/pages/Facility/services/serviceRequests/ServiceRequestShow.tsx` — exists; renders DiagnosticReportForm with activity definition data (line 602)
- `src/types/emr/activityDefinition/activityDefinition.ts` — exists; defines `diagnostic_report_codes: Code[]` field on ActivityDefinitionReadSpec (line 49)
- `src/types/emr/serviceRequest/serviceRequest.ts` — exists; ServiceRequestReadSpec includes `diagnostic_reports: DiagnosticReportRead[]` (line 116)
- `src/types/emr/diagnosticReport/diagnosticReport.ts` — exists; DiagnosticReportRead includes optional `code?: Code` field (line 49)

## Open Questions

None.
