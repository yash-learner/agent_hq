# Specification: Support Multiple Diagnostic Reports per Service Request

## Problem

Service Requests whose Activity Definition defines multiple diagnostic report codes currently allow creating only a single diagnostic report in the frontend. The diagnostic report code dropdown shows all AD codes, but after creating one report, the form prevents creating additional reports. The backend already supports multiple diagnostic reports per service request; this is a frontend limitation.

## Acceptance Criteria

1. Given an SR with an AD defining 3 diagnostic report codes and no reports created, when the user views the SR, then all 3 codes are available in the dropdown.
2. Given an SR with an AD defining 3 codes and 1 report already created, when the user views the SR, then only the 2 unused codes appear in the dropdown.
3. Given an SR where the user selects an unused code from the dropdown, when the user creates the diagnostic report, then the report is created and that code no longer appears in the dropdown without requiring a page reload.
4. Given an SR with an AD defining N codes and N reports already created, when the user views the SR, then no code dropdown is shown and no new report can be created.
5. Given an SR with 2 unused diagnostic report codes, when the user creates a report for one code, then the other code remains available for creating a second report.
6. Given an SR with multiple reports created for different codes, when the user reloads the page, then the dropdown shows only the remaining unused codes.
7. Given an SR whose AD has no diagnostic report codes defined, when the user views the SR, then the existing single-report behavior continues working unchanged.

## Capability Notes

- `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx:130` — `selectedReportCode` state exists
- `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx:1242-1276` — Diagnostic report code dropdown exists, renders all AD codes
- `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx:139` — `latestReport` variable assumes single report; needs multi-report handling
- `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx:1283-1284` — Report creation button disables when no code selected; condition needs adjustment for multi-report flow
- Filter function for unused codes — needs building

## Open Questions

None.
