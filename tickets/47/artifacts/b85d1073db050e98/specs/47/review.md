# Review: Support for Creating Multiple Diagnostic Reports for Service Request

## Round 1

- **blocker** `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx:221` — useEffect depends on `availableCodes` which is recalculated every render (new array reference), causing the effect to run on every render instead of only when diagnosticReports changes. Remove `availableCodes` from the dependency array and keep only `[diagnosticReports]`, or memoize `availableCodes` with `useMemo`.
