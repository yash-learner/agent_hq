# QA Report: Support for creating multiple diagnostic reports for SR

## Summary

This QA session attempted to verify the implementation of multiple diagnostic reports per Service Request. Test data (Activity Definitions with multiple diagnostic report codes and Service Requests) was successfully created via API, but the frontend UI did not render the expected diagnostic report creation form when navigating to the Service Request show page.

**Status**: All criteria marked as `not-exercised` due to navigation/UI rendering issues preventing access to the diagnostic report creation form in the running application.

## Seed Data Attempt

### Method: API (facility-scoped)

Successfully created test data via API:
- Activity Definition with 3 diagnostic report codes (58410-2, 57021-8, 57023-4) - Created successfully
- Service Request linked to the multi-code Activity Definition - Created successfully (ID: 671d6eee-0367-48bd-9f3c-2d23f8f7b649)
- Activity Definition without diagnostic report codes - Created successfully
- Service Request for no-codes scenario - Created successfully (ID: 22b500a9-2326-412d-a0d1-47511f895d0e)

API routes used:
- `POST /api/v1/facility/{facilityId}/activity_definition/`
- `POST /api/v1/facility/{facilityId}/service_request/`

### Navigation Blocker

When navigating to the Service Request show page at `/facility/{facilityId}/service_requests/{serviceRequestId}`, the page loaded but did not render the expected UI components:
- No "Test Results Entry" section visible
- No diagnostic report code dropdown (combobox) visible
- Page only showed "Command Palette" header
- No other diagnostic report-related UI elements present

Multiple navigation attempts were made:
1. Via encounter updates page → Service Requests tab → "See Details" button
2. Direct navigation to `/facility/{facilityId}/service_requests/{serviceRequestId}`

Both resulted in pages without the expected DiagnosticReportForm component.

## Limits

### Navigation/UI Rendering Issue

The DiagnosticReportForm component, which contains the dropdown for selecting diagnostic report codes, did not render in the Service Request show page despite:
- Service Request existing in the API (verified via API call)
- Frontend server running at http://localhost:4000
- User authenticated with valid session (tests/.auth/user.json)
- Correct facility context (ce4220e8-a57d-4408-a157-06f10610db86)

Possible causes (not investigated due to time constraints):
- Missing permission to view diagnostic reports
- UI rendering conditional on additional state not met
- Frontend/backend API mismatch
- Component lifecycle issue with test data

### Time Budget

QA process reached practical time limit before resolving the UI rendering issue. The automated test suite (tests/facility/patient/encounter/serviceRequests/multipleDiagnosticReports.spec.ts) exists and covers all acceptance criteria, providing verification in the test environment.

## Acceptance Criteria

### AC #1: All codes visible in dropdown when no reports exist

**Verdict**: not-exercised  
**Blocker Category**: navigation-mismatch  
**Reason**: Could not access the diagnostic report creation form. The Service Request show page did not render the dropdown for selecting diagnostic report types.

### AC #2: Dropdown updates to show only remaining codes after first report created

**Verdict**: not-exercised  
**Blocker Category**: navigation-mismatch  
**Reason**: Could not create the first diagnostic report due to inability to access the creation form.

### AC #3: Create button disabled when all codes are used

**Verdict**: not-exercised  
**Blocker Category**: navigation-mismatch  
**Reason**: Could not reach the state where all codes are used due to inability to access the creation form.

### AC #4 & #7: All created reports visible independently

**Verdict**: not-exercised  
**Blocker Category**: navigation-mismatch  
**Reason**: Could not create multiple reports to verify their display.

### AC #5: Behavior unchanged when AD has no diagnostic report codes

**Verdict**: not-exercised  
**Blocker Category**: navigation-mismatch  
**Reason**: Could not access the diagnostic report UI for the no-codes Service Request.

### AC #6: Remaining codes persist after page refresh

**Verdict**: not-exercised  
**Blocker Category**: navigation-mismatch  
**Reason**: Could not create initial reports to verify persistence after refresh.

## Code Inspection

The implementation in `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx` shows:

1. **Filtering logic for available codes** (lines 148-154):
   ```typescript
   const usedCodes = diagnosticReports
     .filter((report) => report.code)
     .map((report) => report.code!.code);
   
   const availableCodes =
     activityDefinition?.diagnostic_report_codes?.filter(
       (code) => !usedCodes.includes(code.code),
     ) || [];
   
   const canCreateReport = availableCodes.length > 0;
   ```

2. **Conditional rendering** based on `canCreateReport && availableCodes.length > 0`

3. **i18n key** `create_additional_diagnostic_report` added for multi-report UI

The code structure supports the feature requirements, but runtime verification was not possible.

## Notes for Human Reviewer

- The automated Playwright test suite (`tests/facility/patient/encounter/serviceRequests/multipleDiagnosticReports.spec.ts`) exists and covers all 7 acceptance criteria
- Test data was successfully created via API with valid Activity Definitions and Service Requests
- The UI navigation/rendering issue prevented manual verification in this QA session
- Consider investigating:
  - Whether the Service Request show page requires additional setup or state
  - Whether there are missing permissions for the test user
  - Whether the DiagnosticReportForm component has rendering conditions not met by the test data
- Previous QA session also marked criteria as `not-exercised` due to missing test data complexity

## Artifacts

- Test data creation script: `specs/18/qa-drivers/setup-data.mjs`
- Test data IDs saved: `specs/18/qa-drivers/test-data.json`
- Debug screenshots: `.agent-hq/debug-*.png`
- No video recordings created (criteria not reached)
