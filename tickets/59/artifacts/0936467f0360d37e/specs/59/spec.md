# Spec: Support for creating multiple diagnostic reports for SR

## Problem

When a Service Request (SR) references an Activity Definition (AD) with multiple diagnostic report codes, the frontend currently only allows creating a single diagnostic report. Line 470 of `DiagnosticReportForm.tsx` blocks report creation once `hasReport` is true, preventing users from recording results for the remaining codes. The backend already supports multiple reports per SR; this is a frontend-only limitation in the diagnostic report creation UI.

## Acceptance Criteria

1. Given an SR whose AD defines 3 diagnostic report codes, when the user creates the first report for code A, then the codes dropdown for the next report shows only codes B and C.
2. Given an SR with no diagnostic reports yet, when the user views the SR page, then the codes dropdown shows all codes from the Activity Definition.
3. Given an SR with one report already created, when the user creates a second report without reloading, then the new report appears in the UI immediately below the first report.
4. Given an SR with N diagnostic report codes on its AD, when the user creates N reports (one per code), then the "Create Report" button and dropdown are hidden.
5. Given an SR with 2 reports already created for codes A and B out of 3 codes, when the user reloads the page, then the codes dropdown shows only the remaining code C.
6. Given an SR whose AD has no diagnostic report codes defined, when the user creates a report, then the report is created without requiring a code selection.
7. Given an SR with one final report, when the user views the page, then the form allows creating additional reports for remaining codes if the AD defines multiple codes.

## Capability Notes

- `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx:470` — `handleCreateReport()` currently blocks if `!hasReport`, needs to allow multiple reports
- `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx:138-140` — `hasReport` logic assumes only one report exists, needs updating for multiple reports
- `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx:1242-1275` — codes dropdown renders all AD codes; needs filtering to exclude already-used codes
- `src/types/emr/serviceRequest/serviceRequest.ts:116` — `ServiceRequestReadSpec.diagnostic_reports` is an array, already supporting multiple reports from the backend
- `src/pages/Facility/services/serviceRequests/ServiceRequestShow.tsx:599-607` — parent component renders `DiagnosticReportForm`, may need logic adjustment for showing form when additional reports can be created

## Open Questions

None.
