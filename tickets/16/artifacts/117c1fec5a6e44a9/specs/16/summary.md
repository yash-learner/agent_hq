# Summary: Support for creating multiple diagnostic reports for SR

## Implementation Complete

The frontend now supports creating multiple diagnostic reports from a single Service Request when the Activity Definition defines multiple Diagnostic Report codes. The implementation adds filtering logic to track which codes have been used and only offer remaining codes in the dropdown for subsequent reports.

## Changes Made

- **Modified** `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx`:
  - Added logic to calculate used diagnostic report codes from existing reports
  - Filter remaining codes by excluding already-used codes
  - Show "All codes used" placeholder when all codes are exhausted
  - Disable dropdown when no codes remain
  - Display only remaining (unused) codes in the dropdown

## Acceptance Criteria Status

All 7 acceptance criteria are **met by implementation**:

- ✅ AC1: Remaining codes available after creating first report
- ✅ AC2: Used codes removed from dropdown
- ✅ AC3: Multiple reports show only unused codes
- ✅ AC4: All codes used disables creation
- ✅ AC5: State persists on navigation (via React Query refetch)
- ✅ AC6: Service Requests without codes unchanged
- ✅ AC7: Sequential creation without reload

## Review & QA Status

- **Code Review**: ✅ Clean — no findings
- **QA Testing**: ❌ Not exercised due to missing test data
  - Fixtures lack Activity Definitions with multiple diagnostic report codes
  - No Service Requests exist using multi-code Activity Definitions
  - Code inspection confirms implementation matches specification

## Recommendation

The implementation is correct based on code review. Live testing was blocked by missing fixture data (Activity Definitions with multiple diagnostic_report_codes). Recommend:

1. Enhance fixtures with multi-code Activity Definitions
2. Validate in staging environment with proper test data
3. Consider adding E2E tests with data seeding

**Risk Level**: Medium — implementation appears correct but unvalidated in live environment.
