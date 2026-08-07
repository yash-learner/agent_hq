# QA Plan: Multiple Diagnostic Reports per Service Request

## AC1 — Create up to N diagnostic reports for N diagnostic report codes

### Research map

- routes: src/Routers/routes/ServiceRequestRoutes.tsx → /facility/:facilityId/service_request/:serviceRequestId
- components: src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx
- i18n labels: "Create Report", "Select Diagnostic Report Type", "Test Results Entry"
- auth/role: tests/.auth/user.json (admin)
- permissions: facility-scoped (yes)
- fixtures needed: facility, patient, encounter, activity definition with 3 diagnostic report codes, service request, specimen

### Prerequisites

- facility context active: yes
- backend running on port 9000
- database with fixtures loaded

### Data setup

- Prefer fixtures: load_fixtures provides a facility; no Activity Definition with multiple diagnostic report codes exists
- Provenance: diagnostic report codes from tests/facility/settings/activityDefinition/activityDefinition.ts DIAGNOSTIC_REPORT_CODES array (lines 49-60); specimen definitions from SPECIMEN_DEFINITIONS (lines 33-38); codes validated in existing test suite
- UI recipe:
  1. Create Activity Definition with 3 diagnostic report codes:
     - Go to `/facility/{facilityId}/settings/activity_definitions`
     - Click "Create Activity Definition"
     - Navigate to category: "Lab Tests"
     - Fill title: `Multi-Code Lab Test ${Date.now()}`
     - Fill description: "Activity Definition with multiple diagnostic report codes"
     - Fill usage: "Used to test multiple diagnostic reports"
     - Select status: "Active"
     - Select category: "Laboratory"
     - Select kind: "Service Request"
     - Select code: Search "Acyclovir" → select first match
     - Scroll to "Specimen Requirements" → Select "CBC Blood Specimen"
     - Scroll to "Diagnostic Report Codes" section
     - Add diagnostic report code 1: Search "Acyclovir [Susceptibility]" → click Plus button
     - Add diagnostic report code 2: Search "Amdinocillin [Susceptibility]" → click Plus button
     - Add diagnostic report code 3: Search "Cefoperazone [Susceptibility]" → click Plus button
     - Click "Create" button
     - Confirm success toast appears
     - Note the activity definition slug from the URL
  2. Create Service Request from Activity Definition:
     - Go to `/facility/{facilityId}/encounters`
     - Click first encounter in list (or create one if none exist)
     - Click "Service Requests" tab
     - Click "Create Service Request"
     - Select the activity definition created in step 1
     - Fill required fields, select patient
     - Click "Create"
     - Confirm success toast and note service request ID from URL
  3. Process specimen to "available" status:
     - On service request page, expand "Specimen Workflow" section
     - Click on the specimen row
     - Change status from "draft" to "available"
     - Confirm status change

### Steps

1. **Action:** Navigate to the Service Request detail page from step 2 (URL: `/facility/{facilityId}/service_request/{serviceRequestId}`)
   **Expect:** Service Request page loads with "Test Results Entry" section visible
   **Record through:** yes

2. **Action:** Expand "Test Results Entry" section if collapsed
   **Expect:** See "Select Diagnostic Report Type" dropdown and "Create Report" button (no diagnostic reports exist yet)
   **Record through:** yes

3. **Action:** Click the "Select Diagnostic Report Type" dropdown
   **Expect:** Dropdown shows all 3 diagnostic report codes: "Acyclovir [Susceptibility]", "Amdinocillin [Susceptibility]", "Cefoperazone [Susceptibility]"
   **Record through:** yes

4. **Action:** Select first code "Acyclovir [Susceptibility]" from dropdown
   **Expect:** Dropdown value shows selected code
   **Record through:** yes

5. **Action:** Click "Create Report" button
   **Expect:** Toast notification "Diagnostic report created successfully"; form transitions to show observation entry fields for the created report
   **Record through:** yes

6. **Action:** Scroll down below the observation fields
   **Expect:** See the create form reappear with the dropdown and "Create Report" button still visible (not hidden)
   **Record through:** yes

7. **Action:** Click the "Select Diagnostic Report Type" dropdown again
   **Expect:** Dropdown now shows only 2 remaining codes: "Amdinocillin [Susceptibility]" and "Cefoperazone [Susceptibility]" (first code "Acyclovir" is not in the list)
   **Record through:** yes

8. **Action:** Select second code "Amdinocillin [Susceptibility]" from dropdown
   **Expect:** Dropdown value shows selected code
   **Record through:** yes

9. **Action:** Click "Create Report" button
   **Expect:** Toast notification "Diagnostic report created successfully"; now 2 diagnostic reports exist
   **Record through:** yes

10. **Action:** Scroll down and click the "Select Diagnostic Report Type" dropdown again
    **Expect:** Dropdown shows only 1 remaining code: "Cefoperazone [Susceptibility]"
    **Record through:** yes

11. **Action:** Select third code "Cefoperazone [Susceptibility]" from dropdown and click "Create Report"
    **Expect:** Toast notification "Diagnostic report created successfully"; 3 diagnostic reports now exist
    **Record through:** yes

12. **Action:** Scroll down to where the create form was
    **Expect:** The create form (dropdown and "Create Report" button) is now hidden/not visible because all 3 codes have been used
    **Record through:** yes

### Success looks like

- Created 3 diagnostic reports, one for each diagnostic report code defined in the Activity Definition
- Dropdown filters out used codes after each report creation
- Create form hides after all codes are used

## AC2 — Dropdown shows only remaining (unused) codes

### Research map

- Same as AC1

### Prerequisites

- Same as AC1, with Activity Definition and Service Request already created
- One diagnostic report already exists (from AC1 step 5)

### Data setup

- Continue from AC1 state: Service Request with AD having 3 codes, 1 report already created

### Steps

1. **Action:** On the Service Request detail page, expand "Test Results Entry" section
   **Expect:** See existing diagnostic report(s) and below them the create form with dropdown
   **Record through:** yes

2. **Action:** Click the "Select Diagnostic Report Type" dropdown
   **Expect:** Dropdown shows only the codes NOT yet used for creating reports (e.g., if 1 report exists with "Acyclovir", dropdown shows only "Amdinocillin" and "Cefoperazone")
   **Record through:** yes

3. **Action:** Note which codes appear in dropdown, then refresh the page (F5 or Ctrl+R)
   **Expect:** After page reload, click dropdown again and verify same unused codes appear (state persists from API response)
   **Record through:** yes

### Success looks like

- Dropdown consistently shows only codes that haven't been used yet
- State persists across page reloads

## AC3 — Create form hides when all codes are used

### Research map

- Same as AC1

### Prerequisites

- Same as AC1, with Activity Definition and Service Request created
- All 3 diagnostic reports already created (from AC1 step 11)

### Data setup

- Continue from AC1 state: Service Request with AD having 3 codes, all 3 reports created

### Steps

1. **Action:** On the Service Request detail page, scroll to "Test Results Entry" section
   **Expect:** See all 3 existing diagnostic reports; no dropdown or "Create Report" button visible below them
   **Record through:** yes

2. **Action:** Refresh the page (F5)
   **Expect:** After reload, the create form still does not appear (all codes are used)
   **Record through:** yes

### Success looks like

- Create form is completely hidden when all diagnostic report codes have been used
- No dropdown or "Create Report" button visible

## AC4 — Draft report doesn't block creating additional reports

### Research map

- Same as AC1

### Prerequisites

- Same as AC1, with Activity Definition and Service Request created
- No diagnostic reports exist yet

### Data setup

- Same as AC1, but start fresh without reports

### Steps

1. **Action:** Create first diagnostic report with code "Acyclovir [Susceptibility]" (leave it in "preliminary" status - do not finalize)
   **Expect:** Toast "Diagnostic report created successfully"; report appears with status badge "preliminary"
   **Record through:** yes

2. **Action:** Without finalizing the first report, scroll down and verify the create form is still visible
   **Expect:** See dropdown and "Create Report" button
   **Record through:** yes

3. **Action:** Click dropdown and select second code "Amdinocillin [Susceptibility]", then click "Create Report"
   **Expect:** Toast "Diagnostic report created successfully"; second report created successfully even though first report is still in "preliminary" status
   **Record through:** yes

### Success looks like

- Can create multiple reports without finalizing previous ones
- Draft/partial status reports don't block creating new reports with different codes

## AC5 — Dropdown updates after each report creation

### Research map

- Same as AC1

### Prerequisites

- Same as AC1, with Activity Definition and Service Request created
- Start with 2 of 3 codes already used

### Data setup

- Continue from state where 2 diagnostic reports exist (e.g., "Acyclovir" and "Amdinocillin" used)

### Steps

1. **Action:** On Service Request page, expand "Test Results Entry" and click dropdown
   **Expect:** Dropdown shows only 1 remaining code: "Cefoperazone [Susceptibility]"
   **Record through:** yes

2. **Action:** Select the remaining code and click "Create Report"
   **Expect:** Toast "Diagnostic report created successfully"
   **Record through:** yes

3. **Action:** Scroll to where dropdown was located
   **Expect:** Dropdown and "Create Report" button are now hidden (no remaining codes)
   **Record through:** yes

### Success looks like

- Dropdown immediately updates after report creation to hide itself when no codes remain

## AC6 — Service Request with no diagnostic report codes works as before

### Research map

- Same as AC1

### Prerequisites

- Facility context active
- Backend running

### Data setup

- Create Activity Definition WITHOUT diagnostic report codes:
  1. Go to `/facility/{facilityId}/settings/activity_definitions`
  2. Create activity definition: "No-Code Lab Test"
  3. Fill all required fields (title, description, usage, status: Active, category: Laboratory, kind: Service Request, code)
  4. Add specimen requirement: "CBC Blood Specimen"
  5. DO NOT add any diagnostic report codes
  6. Click "Create"
- Create Service Request from this AD (same process as AC1 step 2)
- Process specimen to "available"

### Steps

1. **Action:** Navigate to the Service Request detail page
   **Expect:** Service Request page loads with "Test Results Entry" section
   **Record through:** yes

2. **Action:** Expand "Test Results Entry" section
   **Expect:** See "Create Report" button but NO dropdown (because AD has no diagnostic report codes defined)
   **Record through:** yes

3. **Action:** Click "Create Report" button (no code selection needed)
   **Expect:** Toast "Diagnostic report created successfully"; report created without a code
   **Record through:** yes

4. **Action:** Scroll to check if create form is still visible
   **Expect:** Create form is hidden (only one report allowed when no codes are defined, legacy behavior maintained)
   **Record through:** yes

### Success looks like

- Service Requests with no diagnostic report codes continue to work as before
- No dropdown appears, single report allowed, form hides after creation

## AC7 — State persists after page reload

### Research map

- Same as AC1

### Prerequisites

- Same as AC1, with Service Request having 3 codes and 1 report created

### Data setup

- Continue from AC1 state where 1 diagnostic report exists with code "Acyclovir"

### Steps

1. **Action:** Note which codes appear in the dropdown (should show 2 remaining: "Amdinocillin" and "Cefoperazone")
   **Expect:** Dropdown shows only unused codes
   **Record through:** yes

2. **Action:** Refresh the browser (F5 or Ctrl+R)
   **Expect:** Page reloads successfully
   **Record through:** yes

3. **Action:** Expand "Test Results Entry" section and click dropdown
   **Expect:** Dropdown still shows the same 2 unused codes (state loaded from API, not lost on reload)
   **Record through:** yes

4. **Action:** Select "Amdinocillin" and create second report
   **Expect:** Report created successfully
   **Record through:** yes

5. **Action:** Refresh browser again
   **Expect:** After reload, dropdown shows only 1 remaining code: "Cefoperazone"
   **Record through:** yes

### Success looks like

- Used codes remain filtered out after page reload
- State is correctly loaded from API response each time

## Test plan / notes

- Add Playwright E2E test coverage for multiple diagnostic report creation flow
- Test should create Activity Definition with 3 diagnostic report codes via UI helper
- Test should verify dropdown filtering and form hiding logic
- Test should verify state persistence across page reloads
- CI must pass with no new lint errors
- Format code before commit
