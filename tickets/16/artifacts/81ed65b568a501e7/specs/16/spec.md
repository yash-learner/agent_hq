# Specification: Support for creating multiple diagnostic reports for SR

## Problem statement

When a Service Request's Activity Definition defines multiple Diagnostic Report codes, the frontend currently allows creating only one diagnostic report. The codes dropdown shows all available codes, but after the first report is created, the UI prevents creating additional reports for the remaining codes. The backend already supports multiple diagnostic reports per Service Request; this limitation exists only in the frontend.

## Acceptance criteria

1. Given a Service Request whose Activity Definition defines 3 diagnostic report codes, when the user creates a report for the first code, then the codes dropdown still offers the 2 remaining codes for creating another report.
2. Given a Service Request with multiple diagnostic report codes defined, when the user creates a report for one code, then that code is removed from the dropdown and no longer selectable.
3. Given a Service Request with 3 diagnostic report codes where 2 reports have already been created, when the user views the dropdown, then only the 1 unused code is shown.
4. Given a Service Request where all diagnostic report codes have been used, when the user views the create report section, then the create button is disabled and the dropdown shows no options.
5. Given a Service Request with multiple reports created, when the user navigates away and returns to the page, then all created reports are displayed and the dropdown shows only unused codes.
6. Given a Service Request with no diagnostic report codes defined in its Activity Definition, when the user creates a report, then the behavior remains unchanged (no dropdown, single report creation).
7. Given a Service Request with multiple diagnostic report codes, when creating reports sequentially, then no page reload is required between creations.

## Capability notes

- `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx` -- exists; renders the codes dropdown (lines 1242-1276) and handles report creation (lines 468-489). Currently shows all `activityDefinition.diagnostic_report_codes` without filtering used codes.
- `src/types/emr/serviceRequest/serviceRequest.ts:ServiceRequestReadSpec` -- exists; includes `diagnostic_reports: DiagnosticReportRead[]` array that contains all created reports for the SR.
- `src/types/emr/diagnosticReport/diagnosticReport.ts:DiagnosticReportRead` -- exists; includes `code?: Code` field identifying which AD code the report uses.
- `src/types/emr/activityDefinition/activityDefinition.ts:ActivityDefinitionReadSpec` -- exists; defines `diagnostic_report_codes: Code[]` array (line 49).
- Filtering logic for remaining codes -- needs building in `DiagnosticReportForm.tsx` to compare `diagnosticReports` against `activityDefinition.diagnostic_report_codes`.

## Open questions

None.
