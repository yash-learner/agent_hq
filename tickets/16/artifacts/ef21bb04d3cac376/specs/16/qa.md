# QA Report: Support for creating multiple diagnostic reports for SR

**Ticket**: #16  
**QA Date**: 2026-08-07  
**Status**: Not Exercised (Auth Failure)

## Summary

QA was blocked by authentication token expiration in the test environment. The implementation was verified via API (Activity Definition with 3 diagnostic report codes was successfully created, and Service Request was instantiated), but live-flow testing in the browser could not be completed due to session timeout.

## Blockers

### Primary Blocker: Authentication Token Expiration

The JWT token in `tests/.auth/user.json` expired during QA execution, preventing access to the Service Request detail page. Multiple approaches were attempted:

1. **Direct navigation** to Service Request URL - resulted in redirect to login page
2. **Navigation through facility context** (home → facility overview → service request) - still showed login page
3. **API validation** - confirmed token was expired (403 response with "Token is expired" message)
4. **Fresh login attempt** - login form selectors couldn't be resolved in time

Given the 45-minute time constraint for QA and the auth infrastructure issues, live-flow verification could not be completed.

## Test Data Setup

**Method**: API (facility-scoped)  
**Result**: Successful

Successfully created test data via API:

1. **Activity Definition** created with:
   - Title: `Multi-Code Diagnostic Test QA-16-1786097363273`
   - ID: `27cef862-0915-4e7f-8fa7-584a9b53c6f0`
   - 3 diagnostic report codes:
     - CBC panel - Blood by Automated count (58410-2)
     - Lipid panel with direct LDL (LP97557-0)  
     - Fasting glucose [Mass/volume] in Serum or Plasma (1558-6)

2. **Service Request** created via `apply_activity_definition` endpoint:
   - ID: `95380317-058b-4b0b-bb88-b78151285599`
   - Status: active
   - Encounter linked correctly
   - Response confirmed `diagnostic_reports: []` (empty array ready for population)

The backend API confirmed the implementation supports the data model required for multiple diagnostic reports per service request.

## Acceptance Criteria

### AC1: From an SR whose AD has N diagnostic report codes, the user can create up to N diagnostic reports, one per code

**Verdict**: `not-exercised`  
**Blocker**: Auth token expiration prevented browser access to Service Request detail page  
**Evidence Kind**: unreachable

**Seed Attempt**:
- **Method**: api
- **Summary**: Successfully created Activity Definition with 3 diagnostic_report_codes via `POST /api/v1/facility/{facilityId}/activity_definition/` and Service Request via `POST /api/v1/facility/{facilityId}/service_request/apply_activity_definition/`. API responses confirmed the data model is correct. Browser access blocked by expired JWT token in tests/.auth/user.json storage state.

**What Was Attempted**:
- Created Activity Definition with 3 diagnostic report codes via API
- Created Service Request using the multi-code Activity Definition via API
- Attempted to navigate to Service Request detail page in browser with stored auth
- Attempted facility-context navigation path (home → facility → service request)
- Verified token expiration via API (403 response)

### AC2: The codes dropdown offers a remaining (not-yet-used) code for each new report

**Verdict**: `not-exercised`  
**Blocker**: Auth token expiration prevented browser access  
**Evidence Kind**: unreachable

**Seed Attempt**:
- **Method**: api
- **Summary**: Same as AC1 - test data successfully created via API, but browser testing blocked by auth failure.

### AC3: Reports can be created one after another without a reload

**Verdict**: `not-exercised`  
**Blocker**: Auth token expiration prevented browser access  
**Evidence Kind**: unreachable

**Seed Attempt**:
- **Method**: api
- **Summary**: Same as AC1 - test data successfully created via API, but browser testing blocked by auth failure.

### AC4: Already-used codes are no longer offered

**Verdict**: `not-exercised`  
**Blocker**: Auth token expiration prevented browser access  
**Evidence Kind**: unreachable

**Seed Attempt**:
- **Method**: api
- **Summary**: Same as AC1 - test data successfully created via API, but browser testing blocked by auth failure.

## Code Inspection Notes

From reviewing the implementation diff (`.agent-hq/diff.patch`) and API responses:

- The Activity Definition model correctly stores an array of `diagnostic_report_codes`
- The Service Request includes the full Activity Definition with all codes in the response
- The API layer supports the required data structure for multiple diagnostic reports
- The frontend components were modified to filter out used codes (based on diff analysis)

However, **code inspection alone cannot verify the user-facing acceptance criteria** - live-flow testing with video evidence is required to confirm:
- The dropdown interaction works as expected
- Used codes are properly filtered
- The "All codes used" state is displayed correctly
- Multiple reports can be created sequentially without reload

## Limits

**Unable to exercise any live-flow criteria** due to:

1. **Authentication infrastructure**: JWT token expiration in the prepared test environment
2. **Time constraint**: 45-minute QA window with ~25 minutes spent on auth debugging
3. **Environment assumptions**: The setup expected working credentials in `tests/.auth/user.json`, but tokens have finite lifetime

**Recommendation**: QA should be re-run with:
- Fresh authentication tokens (either via backend fixture refresh or new login flow)
- Extended session timeout for QA runs
- Or a token refresh mechanism in the test harness

The implementation appears structurally sound based on API validation, but user-facing behavior must be verified through live browser testing.
