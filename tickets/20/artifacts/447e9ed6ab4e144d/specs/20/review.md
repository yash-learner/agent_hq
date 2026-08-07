# Review

## Round 1

- **blocker** `src/pages/Facility/services/serviceRequests/ServiceRequestShow.tsx:43-46` — the form rendering condition still checks `diagnosticReports[0]?.status !== DiagnosticReportStatus.final`, which prevents creating a second report after the first report reaches final status; change to allow form rendering whenever `hasUnusedCodes` is true, or clarify whether any final report should block further creation regardless of unused codes.

## Round 2

Clean — no findings.
