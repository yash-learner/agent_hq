# Spec: Support for Creating Multiple Diagnostic Reports for Service Request

## Problem

When an Activity Definition has multiple diagnostic report codes, the frontend currently only allows creating one diagnostic report from the Service Request workflow. The code dropdown does not filter out already-used codes, and users cannot create subsequent reports for the remaining codes without a reload, breaking the intended multi-report workflow.

## Acceptance Criteria

1. Given a Service Request created from an Activity Definition with three diagnostic report codes, when the user views the diagnostic report form, then the code dropdown displays all three codes.
2. Given the user selects a code and creates the first diagnostic report, when the report is successfully created, then the used code is removed from the dropdown options.
3. Given one diagnostic report already exists, when the user returns to create another report, then only the remaining unused codes are available in the dropdown.
4. Given the user creates diagnostic reports for all available codes, when all codes are consumed, then the create report button is disabled and no dropdown is shown.
5. Given multiple diagnostic reports have been created, when the user reloads the page, then all previously used codes remain excluded from the dropdown.
6. Given a Service Request with specimen requirements, when the user attempts to create a diagnostic report before specimen collection, then the create report button is disabled.
7. Given a Service Request is marked as completed, when all diagnostic reports have been created and saved, then the Service Request status reflects completion according to workflow rules.

## Capability Notes

- `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx` -- handles diagnostic report creation, code selection dropdown (lines 1242-1290), and create report logic (handleCreateReport at line 470)
- `src/types/emr/activityDefinition/activityDefinition.ts:diagnostic_report_codes` -- array of Code objects on ActivityDefinitionReadSpec (line 49)
- `src/types/emr/serviceRequest/serviceRequest.ts:diagnostic_reports` -- array of DiagnosticReportRead on ServiceRequestReadSpec (line 116)
- `src/types/emr/diagnosticReport/diagnosticReport.ts:code` -- optional Code field on DiagnosticReportRead (line 49)
- `src/pages/Facility/services/serviceRequests/ServiceRequestShow.tsx` -- parent component that renders DiagnosticReportForm and manages Service Request state

## Open Questions

None.
