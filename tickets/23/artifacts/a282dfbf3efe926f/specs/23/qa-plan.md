# QA Plan: Support Multiple Diagnostic Reports per Service Request

This plan covers live browser testing of the multiple diagnostic reports functionality. All criteria are user-facing and require a running application.

## AC1 — All codes available with no reports created

### Research map

- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/service_requests/:serviceRequestId`
- components: `src/pages/Facility/services/serviceRequests/ServiceRequestShow.tsx`, `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx`
- i18n labels: "Create Report", "Select Diagnostic Report Type"
- auth/role: `tests/.auth/user.json` (admin)
- permissions / facility-scoped: Yes
- fixtures needed: facility (from load-fixtures), patient (from load-fixtures), encounter (from load-fixtures)

### Prerequisites

- Backend running on port 9000 with load-fixtures data
- Authenticated as admin (`tests/.auth/user.json`)
- Facility, patient, and encounter exist from fixtures

### Data setup

- Prefer fixtures: load-fixtures provides facility (`getFacilityId()`), patient (`getPatientId()`), and encounter (`getEncounterId()`), but no Activity Definition with multiple diagnostic report codes.
- Provenance: Activity Definition codes from `tests/facility/settings/activityDefinition/activityDefinition.ts` lines 20-31 (ACTIVITY_DEFINITION_CODES) and lines 49-60 (DIAGNOSTIC_REPORT_CODES). Service Request creation follows `tests/facility/patient/encounter/serviceRequests/serviceRequest.ts` pattern. `apply_activity_definition` endpoint from `src/types/emr/serviceRequest/serviceRequestApi.ts` line 44.
- UI recipe (Activity Definition):
  1. Go to `/facility/{facilityId}/settings/activity_definitions`
  2. Click "Create" button
  3. Navigate to "Lab Tests" category
  4. Click "New Activity Definition"
  5. Fill required fields:
     - Title: `QA Multi Diagnostic Reports {Date.now()}`
     - Slug: auto-generated from title
     - Description: "QA seed for multiple diagnostic reports"
     - Usage: "Test multiple diagnostic report creation"
     - Status: "Active"
     - Category: "Laboratory"
     - Kind: "Service Request"
     - Code: Select any code from valueset picker (search "laboratory" or "test")
  6. Under "Diagnostic Report Codes" section:
     - Click the diagnostic report codes combobox
     - Search and select first code from picker (e.g., "Acyclovir")
     - Click the combobox again
     - Search and select second code (e.g., "Amdinocillin")
     - Click the combobox again
     - Search and select third code (e.g., "Cefoperazone")
  7. Click "Create" button
  8. Confirm success toast "Activity Definition created successfully"
  9. Verify the new AD appears in the list
- UI recipe (Service Request):
  1. Navigate to `/facility/{facilityId}/patient/{patientId}/encounter/{encounterId}/service_requests`
  2. Click "Create Service Request" button
  3. In the Activity Definition picker, select the newly created QA AD
  4. Expand the service request card
  5. Select "Routine" priority
  6. Click "Submit" button
  7. Confirm success toast "Questionnaire submitted successfully"
  8. Click the "Service Requests" tab
  9. Find the newly created SR in the table and click "See Details"
  10. Confirm the SR details page loads (checkpoint before criterion)

### Steps

1. **Action:** On the Service Request details page, locate the "Diagnostic Report" section
   **Expect:** The section shows "Create Report" button and a dropdown labeled "Select Diagnostic Report Type"
   **Record through:** yes

2. **Action:** Click the "Select Diagnostic Report Type" dropdown
   **Expect:** All 3 diagnostic report codes from the Activity Definition are listed in the dropdown options
   **Record through:** yes

3. **Action:** Verify no reports exist yet
   **Expect:** No diagnostic report cards are visible above the "Create Report" section
   **Record through:** yes

### Success looks like

- Dropdown shows all 3 codes
- No diagnostic report cards visible
- "Create Report" button is visible

## AC2 — Only unused codes shown after one report created

### Research map

- Same as AC1
- Additional: diagnostic report creation flow in `DiagnosticReportForm.tsx` lines 192-216

### Prerequisites

- Continuation from AC1 (same SR with 3 codes, 0 reports)
- Same session, no reload

### Data setup

- Uses SR created in AC1
- No additional data needed

### Steps

1. **Action:** From the dropdown, select the first diagnostic report code
   **Expect:** The dropdown shows the selected code
   **Record through:** yes

2. **Action:** Click the "Create Report" button
   **Expect:** Toast notification "Diagnostic report created successfully" appears
   **Record through:** yes

3. **Action:** Without reloading, observe the dropdown options
   **Expect:** Dropdown now shows only 2 codes (the 2 unused codes); the used code is no longer in the list
   **Record through:** yes

### Success looks like

- Toast confirms report creation
- Dropdown shows exactly 2 remaining codes
- First code no longer appears in dropdown

## AC3 — Create report without reload, code removed from dropdown

### Research map

- Same as AC2
- Validates state management and query invalidation (lines 200-209 in DiagnosticReportForm.tsx)

### Prerequisites

- Continuation from AC2 (same SR, now with 1 report created, 2 codes remaining)
- Same session, no reload

### Data setup

- Uses SR from AC2
- No additional data needed

### Steps

1. **Action:** Confirm the dropdown shows 2 remaining codes
   **Expect:** Dropdown displays exactly 2 codes
   **Record through:** yes

2. **Action:** Select one of the 2 remaining codes from the dropdown
   **Expect:** The dropdown shows the selected code
   **Record through:** yes

3. **Action:** Click the "Create Report" button
   **Expect:** Toast notification "Diagnostic report created successfully" appears
   **Record through:** yes

4. **Action:** Without reloading, observe the dropdown
   **Expect:** Dropdown now shows only 1 code; the just-used code has been removed
   **Record through:** yes

5. **Action:** Verify a diagnostic report card for the second code is now visible
   **Expect:** A card showing the second report appears in the reports section
   **Record through:** yes

### Success looks like

- Toast confirms second report creation
- Dropdown shows exactly 1 remaining code
- Second diagnostic report card is visible

## AC4 — No dropdown when all codes used

### Research map

- Same as AC3
- Validates UI hiding logic (lines 1248-1276 and 1307-1338 in DiagnosticReportForm.tsx)

### Prerequisites

- Continuation from AC3 (same SR, now with 2 reports created, 1 code remaining)
- Same session, no reload

### Data setup

- Uses SR from AC3
- No additional data needed

### Steps

1. **Action:** Confirm the dropdown shows 1 remaining code
   **Expect:** Dropdown displays exactly 1 code
   **Record through:** yes

2. **Action:** Select the last remaining code from the dropdown
   **Expect:** The dropdown shows the selected code
   **Record through:** yes

3. **Action:** Click the "Create Report" button
   **Expect:** Toast notification "Diagnostic report created successfully" appears
   **Record through:** yes

4. **Action:** Without reloading, observe the "Diagnostic Report" section
   **Expect:** The dropdown is no longer visible; only the "Create Report" button remains, and it should be disabled
   **Record through:** yes

5. **Action:** Verify all 3 diagnostic report cards are visible
   **Expect:** 3 report cards are displayed, one for each code
   **Record through:** yes

### Success looks like

- Toast confirms third report creation
- No dropdown visible
- "Create Report" button is disabled or not actionable
- All 3 diagnostic report cards are visible

## AC5 — One code remains available after creating one of two unused codes

### Research map

- Same as AC1
- Tests filtering logic with different code counts

### Prerequisites

- Backend running on port 9000
- Authenticated as admin
- New SR needed (separate from AC1-4 flow)

### Data setup

- Create a new Activity Definition with exactly 2 diagnostic report codes using the same UI recipe as AC1, but selecting only 2 codes in step 6
- Create a new Service Request using that AD, following the same UI recipe as AC1

### Steps

1. **Action:** On the new SR details page, verify the dropdown shows 2 codes
   **Expect:** Dropdown displays exactly 2 codes
   **Record through:** yes

2. **Action:** Select the first code and click "Create Report"
   **Expect:** Toast notification "Diagnostic report created successfully" appears
   **Record through:** yes

3. **Action:** Without reloading, verify the dropdown shows 1 code
   **Expect:** Dropdown displays exactly 1 code (the other unused code)
   **Record through:** yes

4. **Action:** Confirm the first code is not in the dropdown
   **Expect:** Only the second code is available in the dropdown
   **Record through:** yes

### Success looks like

- Toast confirms report creation
- Dropdown shows exactly 1 remaining code
- First code is not in the dropdown options

## AC6 — Reload preserves exhausted/remaining state

### Research map

- Same as AC1
- Tests persistence and server-side state

### Prerequisites

- Continuation from AC4 (SR with all 3 codes used)
- Same session

### Data setup

- Uses SR from AC4 with all 3 reports created
- No additional data needed

### Steps

1. **Action:** Reload the browser page (F5 or reload button)
   **Expect:** Page reloads and shows the SR details
   **Record through:** yes

2. **Action:** Observe the "Diagnostic Report" section
   **Expect:** No dropdown is visible; the "Create Report" button remains disabled or not actionable
   **Record through:** yes

3. **Action:** Verify all 3 diagnostic report cards are still visible
   **Expect:** All 3 report cards are displayed
   **Record through:** yes

### Success looks like

- After reload, no dropdown is visible
- "Create Report" button is disabled
- All 3 diagnostic report cards persist

## AC7 — Single-report behavior unchanged for no-code ADs

### Research map

- Same as AC1
- Tests backward compatibility (blocker fix at lines 1285-1286)

### Prerequisites

- Backend running on port 9000
- Authenticated as admin
- New SR needed with AD that has NO diagnostic report codes

### Data setup

- UI recipe (Activity Definition without diagnostic codes):
  1. Go to `/facility/{facilityId}/settings/activity_definitions`
  2. Click "Create" button, navigate to "Lab Tests", click "New Activity Definition"
  3. Fill required fields (title, description, usage, status "Active", category "Laboratory", kind "Service Request", code from valueset)
  4. **Do not** add any diagnostic report codes
  5. Click "Create"
  6. Confirm success toast
- UI recipe (Service Request):
  1. Navigate to `/facility/{facilityId}/patient/{patientId}/encounter/{encounterId}/service_requests`
  2. Click "Create Service Request"
  3. Select the no-code AD
  4. Expand, set priority "Routine", click "Submit"
  5. Confirm success toast
  6. Navigate to "Service Requests" tab, click "See Details" on the new SR

### Steps

1. **Action:** On the SR details page, locate the "Diagnostic Report" section
   **Expect:** No dropdown is visible (since AD has no codes)
   **Record through:** yes

2. **Action:** Observe the "Create Report" button
   **Expect:** The "Create Report" button is visible and enabled (not disabled by the no-code condition)
   **Record through:** yes

3. **Action:** Click the "Create Report" button
   **Expect:** A diagnostic report is created; toast notification "Diagnostic report created successfully" appears
   **Record through:** yes

4. **Action:** Verify a diagnostic report card appears
   **Expect:** A report card is visible with no specific code selection
   **Record through:** yes

### Success looks like

- No dropdown visible for no-code AD
- "Create Report" button is enabled
- Toast confirms report creation
- Report card appears without code selection

## Test plan / notes

### Playwright E2E Coverage

- Add E2E test `tests/facility/patient/encounter/serviceRequests/multipleDiagnosticReports.spec.ts` covering:
  1. Create AD with 3 diagnostic report codes via API (see spec QA data setup)
  2. Create SR via `apply_activity_definition` API
  3. Verify all 3 codes in dropdown
  4. Create first report, verify 2 codes remain
  5. Create second report, verify 1 code remains
  6. Create third report, verify no dropdown and button disabled
  7. Reload and verify state persists
  8. Create AD with 0 codes, verify button enabled

### CI Expectations

- `npm run lint` must pass
- `npm run build` must complete successfully
- Playwright test suite must include new coverage
- No regressions in existing service request tests
