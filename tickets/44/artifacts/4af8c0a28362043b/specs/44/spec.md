# Spec: Support for creating multiple diagnostic reports for SR

## Problem

The DiagnosticReportForm component currently only supports creating a single diagnostic report per Service Request, even when the Activity Definition defines multiple diagnostic report codes. The codes dropdown always shows all codes from the Activity Definition without filtering out codes already used in created reports, and the UI does not allow creating additional reports after the first one is created.

## Acceptance Criteria

1. Given an SR with an AD defining 3 diagnostic report codes, when the user views the SR, then the codes dropdown shows all 3 unused codes.
2. Given the user creates a diagnostic report using code A, when the form reloads, then the codes dropdown shows only the 2 remaining unused codes (B and C).
3. Given 2 of 3 diagnostic reports have been created, when the user creates the third report, then the codes dropdown and create button are no longer available.
4. Given all AD codes have been used, when the page reloads, then no code dropdown or create button is shown and existing reports remain visible.
5. Given the user creates a report without a page reload, when the report is saved successfully, then the UI updates to show the remaining available codes immediately.
6. Given an SR with no diagnostic reports yet, when the user creates reports sequentially for codes A, B, and C, then each report is created with its distinct code and all three reports are visible in the SR view.
7. Given an SR where some codes remain unused, when the user navigates away and returns, then the unused codes are still available for creating new reports.

## Capability Notes

- `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx` — exists; renders the diagnostic report creation form with codes dropdown and handles report creation
- `src/types/emr/activityDefinition/activityDefinition.ts` — exists; defines `diagnostic_report_codes: Code[]` array on ActivityDefinitionReadSpec
- `src/types/emr/serviceRequest/serviceRequest.ts` — exists; ServiceRequestReadSpec includes `diagnostic_reports: DiagnosticReportRead[]` array and `activity_definition: ActivityDefinitionReadSpec`
- `src/types/emr/diagnosticReport/diagnosticReportApi.ts` — exists; provides createDiagnosticReport mutation accepting a `code` field in the request body
- Filtering logic for unused codes — needs building; must compare `activity_definition.diagnostic_report_codes` against `diagnostic_reports[].code` to identify remaining codes

## Open Questions

None.
