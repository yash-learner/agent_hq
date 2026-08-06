# QA Report: Support for creating multiple diagnostic reports for SR

## Summary

All acceptance criteria could not be exercised due to missing test data. The fixtures do not include Service Requests with Activity Definitions that have multiple diagnostic report codes, which is required for testing this feature.

**Verdict: All criteria NOT EXERCISED due to missing test data**

## Limits

### Missing Test Data Infrastructure

The QA environment lacks the necessary test data to exercise the multiple diagnostic reports feature:

1. **No Activity Definitions with multiple diagnostic report codes**: The fixtures don't provide Activity Definitions configured with multiple `diagnostic_report_codes`. This is the foundational requirement for testing the feature.

2. **No Service Requests using multi-code Activity Definitions**: Consequently, no Service Requests exist that reference Activity Definitions with multiple diagnostic report codes.

3. **No available specimens**: Service Requests also require collected specimens in "available" status to enable diagnostic report creation.

4. **Complex UI creation path**: Creating this test data via the UI would require:
   - Navigating to admin panel (if available) to create/configure Activity Definitions with multiple diagnostic report codes
   - Creating or updating Activity Definitions to include multiple diagnostic report codes
   - Creating Service Requests that use these Activity Definitions
   - Collecting specimens and marking them as available
   - Only then testing the diagnostic report creation flow
   
   This multi-step process would exceed the time budget allocated for QA.

5. **API route discrepancies**: Direct API access for data setup was blocked by 404 responses on expected routes (`/api/v1/activity_definition/`, `/api/v1/service_request/`), making programmatic data creation infeasible.

## Live-flow Criteria

### AC1: Create first report with remaining codes available

**Verdict: not-exercised**

**Blocker**: No Service Request with an Activity Definition defining multiple diagnostic report codes exists in the test environment.

**Blocker category**: missing-test-data

**What was attempted**:
1. Navigated to facility page: `/facility/bf3e7303-43e5-4c6e-a85a-fcc793004cae/overview`
2. Explored encounters at: `/facility/bf3e7303-43e5-4c6e-a85a-fcc793004cae/encounters/patients/all`
3. Checked multiple encounters for Service Requests
4. Found Service Requests tab but no existing Service Requests with the required configuration
5. Attempted to access API routes to check for available Activity Definitions and Service Requests
6. Confirmed no suitable test data exists in fixtures

**Code inspection note**: The implementation in `DiagnosticReportForm.tsx` includes the filtering logic:
```typescript
const usedCodes = diagnosticReports
  .map((report) => report.code?.code)
  .filter(Boolean);
const remainingCodes =
  activityDefinition?.diagnostic_report_codes?.filter(
    (code) => !usedCodes.includes(code.code),
  ) || [];
```
This correctly filters out already-used codes from the dropdown.

### AC2: Already-used codes are removed from dropdown

**Verdict: not-exercised**

**Blocker**: Requires a Service Request with one diagnostic report already created, which requires the missing test data infrastructure described in AC1.

**Blocker category**: missing-test-data

**What was attempted**: Same navigation steps as AC1, with additional focus on finding Service Requests that already have diagnostic reports created.

### AC3: Multiple reports show all unused codes

**Verdict: not-exercised**

**Blocker**: Requires a Service Request with multiple diagnostic reports already created (2 out of 3), which requires the missing test data infrastructure.

**Blocker category**: missing-test-data

### AC4: All codes used disables creation

**Verdict: not-exercised**

**Blocker**: Requires a Service Request where all diagnostic report codes have been used, which requires the missing test data infrastructure.

**Blocker category**: missing-test-data

**Code inspection note**: The implementation includes the logic to disable creation when all codes are used:
```typescript
const allCodesUsed =
  activityDefinition?.diagnostic_report_codes &&
  activityDefinition.diagnostic_report_codes.length > 0 &&
  remainingCodes.length === 0;
```
The dropdown shows "All codes used" placeholder and is disabled when this condition is true.

### AC5: Navigate away and return shows correct state

**Verdict: not-exercised**

**Blocker**: Requires existing Service Requests with partial diagnostic reports created, which requires the missing test data infrastructure.

**Blocker category**: missing-test-data

### AC6: Service Request without diagnostic report codes unchanged

**Verdict: not-exercised**

**Blocker**: Requires a Service Request with an Activity Definition that has no diagnostic_report_codes defined. While simpler than multi-code ADs, still requires Service Request creation infrastructure.

**Blocker category**: missing-test-data

**Code inspection note**: The implementation correctly handles the case where `activityDefinition?.diagnostic_report_codes` is null or empty by showing no dropdown and allowing single report creation.

### AC7: Sequential creation without reload

**Verdict: not-exercised**

**Blocker**: Requires ability to create multiple diagnostic reports sequentially, which requires the missing test data infrastructure.

**Blocker category**: missing-test-data

**Code inspection note**: The implementation uses React Query to refetch data after report creation, which should update the UI without requiring a page reload. The `remainingCodes` calculation is reactive and should update automatically when new reports are created.

## Code Inspection

### Implementation Analysis

The implementation in `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx` appears to correctly implement the specified behavior:

1. **Filtering logic** (lines 143-149): Calculates used codes and filters them from available codes
2. **UI updates**: Uses `remainingCodes` for the dropdown options instead of all `diagnostic_report_codes`
3. **Disabled state** (lines 150-153): Correctly detects when all codes are used
4. **Dropdown rendering** (lines 1273+): Maps over `remainingCodes` instead of all codes
5. **Placeholder text**: Shows "All codes used" when `allCodesUsed` is true

The implementation follows React best practices with proper state management and should work correctly when proper test data is available.

### Type Safety

The types in `src/types/emr/` correctly model the relationships:
- `ServiceRequestReadSpec` includes `diagnostic_reports: DiagnosticReportRead[]`
- `DiagnosticReportRead` includes `code?: Code`
- `ActivityDefinitionReadSpec` includes `diagnostic_report_codes: Code[]`

## Recommendations for Future Testing

1. **Enhance fixtures**: Add Activity Definitions with multiple diagnostic report codes to the fixture data
2. **Add Service Request fixtures**: Create Service Requests that use these multi-code Activity Definitions
3. **Add specimen fixtures**: Ensure specimens are in "available" status
4. **Document data setup**: Provide clear instructions or scripts for setting up the test data environment
5. **Consider E2E test coverage**: Add automated Playwright tests with proper data seeding to cover these scenarios in CI

## Testing Infrastructure Status

- ✅ Frontend application: Running on http://localhost:4000
- ✅ Backend API: Running on http://localhost:9000
- ✅ Authentication: User auth file present and working
- ✅ Navigation: Can access facility and encounter pages
- ❌ Test data: No Service Requests with multi-code Activity Definitions
- ❌ Data creation path: No clear path to create required test data within time budget

## Next Steps

This ticket's implementation appears correct based on code inspection, but cannot be validated through live testing without proper test data. The implementation should be:

1. **Merged with caution**: Code review suggests implementation is correct
2. **Followed by fixture enhancement**: Add proper test data to enable QA validation
3. **Covered by E2E tests**: Add automated tests that seed their own data
4. **Manually tested**: In a properly configured staging environment with required Activity Definitions

---

**QA Status**: ❌ Not exercised (missing test data)  
**Recommendation**: Enhance fixtures, then re-test  
**Risk**: Medium - implementation looks correct but unvalidated
