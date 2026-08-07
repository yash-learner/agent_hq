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
- Provenance: Codes from valueset expansion API (`/api/v1/valueset/{slug}/expand/`). Activity Definition creation via `POST /api/v1/facility/{facilityId}/activity_definition/` from `src/types/emr/activityDefinition/activityDefinitionApi.ts`. Service Request creation via `POST /api/v1/facility/{facilityId}/service_request/apply_activity_definition/` from `src/types/emr/serviceRequest/serviceRequestApi.ts`.
- **API setup (preferred)** — Can be adapted into a criterion driver:
  1. Obtain valid codes via valueset expansion:
     - Procedure code: `POST /api/v1/valueset/activity-definition-procedure-code/expand/` with body `{"search": "laboratory", "count": 20}` (use first result)
     - Diagnostic report codes: `POST /api/v1/valueset/system-observation/expand/` with bodies `{"search": "blood", "count": 20}`, `{"search": "panel", "count": 20}`, `{"search": "serum", "count": 20}` (collect 3 unique codes across searches)
  2. Create Activity Definition:
     - `POST /api/v1/facility/{facilityId}/activity_definition/`
     - Auth: `getApiUrl()` + `getApiHeaders()` from `tests/helper/utils.ts` + storage state from `tests/.auth/user.json`
     - Body:
       ```json
       {
         "slug_value": "qa-multi-diagnostic-{Date.now()}",
         "title": "QA Multi Diagnostic Reports {Date.now()}",
         "status": "active",
         "classification": "laboratory",
         "kind": "service_request",
         "code": {procedureCode from step 1},
         "diagnostic_report_codes": [{3 codes from step 1}],
         "specimen_requirements": [],
         "charge_item_definitions": [],
         "observation_result_requirements": [],
         "locations": [],
         "category": null,
         "healthcare_service": null,
         "body_site": null,
         "description": "QA seed for multiple diagnostic reports",
         "usage": "",
         "derived_from_uri": null
       }
       ```
     - Expect: 201 Created with Activity Definition object containing `slug`
  3. Create Service Request via apply_activity_definition:
     - `POST /api/v1/facility/{facilityId}/service_request/apply_activity_definition/`
     - Auth: same as step 2
     - Body:
       ```json
       {
         "encounter": "{encounterId from getEncounterId()}",
         "activity_definition": "{slug from step 2 response}",
         "service_request": {
           "priority": "routine"
         }
       }
       ```
     - Expect: 201 Created with Service Request object containing `id`
  4. Verify:
     - Open `/facility/{facilityId}/service_requests/{serviceRequestId from step 3}`
     - Confirm the SR details page loads
     - Confirm "Diagnostic Report" section is visible
     - Confirm dropdown shows 3 codes (checkpoint before criterion)
- **UI fallback** (if API setup fails for non-permissions reasons):
  1. Activity Definition:
     - Go to `/facility/{facilityId}/settings/activity_definitions`
     - Click "Create" button, navigate to "Lab Tests", click "New Activity Definition"
     - Fill: title `QA Multi Diagnostic Reports {Date.now()}`, description, usage, status "Active", classification "Laboratory", kind "Service Request", select procedure code from valueset picker (search "laboratory" or "test")
     - Under "Diagnostic Report Codes": click combobox, search and select 3 different codes from picker (e.g., search "blood", "panel", "serum" to get diverse results — do not invent LOINC codes)
     - Click "Create", confirm success toast, verify AD appears in list
  2. Service Request:
     - Navigate to `/facility/{facilityId}/patient/{patientId}/encounter/{encounterId}/service_requests`
     - Click "Create Service Request", select the QA AD, expand card, set priority "Routine", submit
     - Confirm success toast, navigate to "Service Requests" tab, click "See Details" on new SR
     - Confirm SR details page loads (checkpoint before criterion)

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

- **API setup (preferred)**: Follow same API approach as AC1, but request only 2 diagnostic report codes in step 1 (use `"count": 2` for the observation valueset expansion, or take first 2 from the 3-code result)
- **UI fallback**: Same as AC1, but select only 2 codes under "Diagnostic Report Codes" instead of 3

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

- **API setup (preferred)**:
  1. Obtain procedure code via `POST /api/v1/valueset/activity-definition-procedure-code/expand/` with body `{"search": "laboratory", "count": 20}`
  2. Create Activity Definition:
     - `POST /api/v1/facility/{facilityId}/activity_definition/`
     - Auth: `getApiUrl()` + `getApiHeaders()` + `tests/.auth/user.json`
     - Body: Same as AC1 step 2, but with `"diagnostic_report_codes": []` (empty array)
     - Expect: 201 Created
  3. Create Service Request: Same as AC1 step 3
  4. Verify: Open SR details page, confirm "Diagnostic Report" section visible
- **UI fallback**:
  1. Activity Definition:
     - Go to `/facility/{facilityId}/settings/activity_definitions`
     - Click "Create", navigate to "Lab Tests", click "New Activity Definition"
     - Fill: title, description, usage, status "Active", classification "Laboratory", kind "Service Request", select procedure code
     - **Do not** add any diagnostic report codes
     - Click "Create", confirm success toast
  2. Service Request:
     - Navigate to `/facility/{facilityId}/patient/{patientId}/encounter/{encounterId}/service_requests`
     - Click "Create Service Request", select the no-code AD, expand, set priority "Routine", submit
     - Confirm success toast, navigate to "Service Requests" tab, click "See Details"

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
