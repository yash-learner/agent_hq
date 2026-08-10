# QA Plan: Support for Creating Multiple Diagnostic Reports for Service Request

## AC1 — Code dropdown displays all available codes

### Research map

- routes: `/facility/{facilityId}/patient/{patientId}/encounter/{encounterId}/service_requests` → Service Request list → Click "See Details" on a row → `/facility/{facilityId}/service_request/{serviceRequestId}`
- components: `src/pages/Facility/services/serviceRequests/ServiceRequestShow.tsx`, `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx`
- i18n labels: "Create Report", "Select diagnostic report type", "Collect specimen before report"
- auth/role: `tests/.auth/user.json` (admin)
- permissions / facility-scoped: yes
- fixtures needed: facility, patient, encounter, activity definition with 3 diagnostic report codes, service request

### Prerequisites

- Facility context active
- Patient and encounter exist (from load-fixtures)
- Activity Definition with multiple diagnostic report codes must exist
- Service Request created from that Activity Definition

### Data setup

**Prefer fixtures:** `load-fixtures` provides facility, patient, encounter. No Activity Definition with multiple diagnostic report codes exists in fixtures.

**Provenance:**

- Diagnostic report codes from `tests/facility/settings/activityDefinition/activityDefinition.ts` DIAGNOSTIC_REPORT_CODES array (lines 49-60)
- Activity Definition codes from `ACTIVITY_DEFINITION_CODES` in same file (lines 20-31)
- UI create pattern from `createActivityDefinition` helper function (lines 149-256)

**UI recipe:**

1. Navigate to `/facility/{facilityId}/settings/activity_definitions/categories/f-{facilityId}-lab-tests-activity-definition/new`
2. Fill Activity Definition form:
   - Title: `Multi-Code Diagnostic Test {Date.now()}`
   - Slug: auto-generated
   - Description: `Test activity definition for multiple diagnostic report codes`
   - Usage: `Used for testing multiple diagnostic reports workflow`
   - Status: `Active`
   - Category: `Laboratory`
   - Kind: `Service Request`
   - Code: Select "Urinary tract infection prophylaxis" (from valueset search)
3. Scroll down to "Diagnostic Report Codes" section
4. Click "Search Diagnostic Report Codes" combobox
5. Add three codes by searching and selecting:
   - "Acyclovir [Susceptibility]"
   - "Amdinocillin [Susceptibility] by Serum bactericidal titer"
   - "Cefoperazone [Susceptibility] by Minimum inhibitory concentration (MIC)"
6. Click "Create" button
7. Verify toast "Activity definition created successfully"
8. Verify redirect to `/facility/{facilityId}/settings/activity_definitions`
9. Verify the new Activity Definition appears in the list

**Create Service Request:**

10. Navigate to `/facility/{facilityId}/patient/{patientId}/encounter/{encounterId}/service_requests`
11. Click "Create Service Request" button
12. In the Activity Definition picker:
    - Navigate to "Lab Tests" category
    - Search for the created Activity Definition title
    - Select it
13. Expand the service request card that appears
14. Select Priority: "Routine"
15. Click "Submit" button
16. Verify toast "Questionnaire submitted successfully"
17. Click "Service Requests" tab
18. Click "See Details" on the first row (the newly created SR)

### Steps

1. **Action:** On the Service Request detail page, scroll down to the "Test Results" section
   **Expect:**
   - "No test results recorded" message is visible
   - A dropdown labeled "Select diagnostic report type" is visible
   - "Create Report" button is visible
     **Record through:** yes

2. **Action:** Click the "Select diagnostic report type" dropdown
   **Expect:** All three diagnostic report codes are visible as options:
   - "Acyclovir [Susceptibility] (code)"
   - "Amdinocillin [Susceptibility] by Serum bactericidal titer (code)"
   - "Cefoperazone [Susceptibility] by Minimum inhibitory concentration (MIC) (code)"
     **Record through:** yes

### Success looks like

- Dropdown shows all three codes that were configured on the Activity Definition
- No codes are missing from the dropdown

---

## AC2 — Used code removed from dropdown after creating report

### Research map

- Same as AC1
- Additional component logic: `availableCodes` calculation in `DiagnosticReportForm.tsx` lines 142-151

### Prerequisites

- Same as AC1
- Service Request detail page is open with all three codes visible in dropdown

### Data setup

- Continue from AC1 setup
- Service Request is open on detail page

### Steps

1. **Action:** From AC1, click the "Select diagnostic report type" dropdown and select the first code "Acyclovir [Susceptibility]"
   **Expect:** The dropdown closes and shows the selected code
   **Record through:** yes

2. **Action:** Click the "Create Report" button
   **Expect:**
   - Toast message "Diagnostic report created successfully"
   - The page refreshes/updates to show the report form with observation fields
   - The "Test Results" section now shows fields to enter results
     **Record through:** yes

3. **Action:** Click the "Service Requests" tab in the left navigation, then click "See Details" on the same service request again to return to the detail view
   **Expect:** Page loads and shows the Service Request detail with the Test Results section
   **Record through:** no

4. **Action:** In the Test Results section, look for the code dropdown (it should be visible if not all codes are used)
   **Expect:** The dropdown is no longer visible since a report exists
   **Record through:** yes

5. **Action:** Scroll down and click "Save" button to save the report (even without filling observations)
   **Expect:** Toast message "Test results saved successfully"
   **Record through:** yes

6. **Action:** Reload the page (F5 or navigate away and back)
   **Expect:**
   - The saved diagnostic report is still visible
   - Look for a way to create another report (there may be a button or link)
     **Record through:** yes

### Success looks like

- After creating the first report, the used code "Acyclovir [Susceptibility]" is no longer available in the dropdown when creating a second report
- The report persists after reload

---

## AC3 — Only remaining unused codes available when creating another report

### Research map

- Same as AC1 and AC2
- Key logic: `usedCodes` Set and `availableCodes` filter in `DiagnosticReportForm.tsx`

### Prerequisites

- Same as AC2
- One diagnostic report already created and saved
- Service Request detail page is open

### Data setup

- Continue from AC2 setup
- First diagnostic report created with "Acyclovir [Susceptibility]"

### Steps

1. **Action:** Look for any UI element that allows creating a second report. This might be:
   - A "Create Another Report" button
   - A dropdown that appears when scrolling to the bottom
   - A collapsed section that can be expanded
     If found, click it to reveal the code selection dropdown
     **Expect:**
   - A code selection dropdown appears
   - Only two codes are shown (the unused ones):
     - "Amdinocillin [Susceptibility] by Serum bactericidal titer (code)"
     - "Cefoperazone [Susceptibility] by Minimum inhibitory concentration (MIC) (code)"
   - The previously used code "Acyclovir [Susceptibility]" is NOT in the list
     **Record through:** yes

2. **Action:** Select the second code "Amdinocillin [Susceptibility] by Serum bactericidal titer" from the dropdown
   **Expect:** The dropdown shows the selected code
   **Record through:** yes

3. **Action:** Click "Create Report" button
   **Expect:**
   - Toast message "Diagnostic report created successfully"
   - A second diagnostic report section appears
     **Record through:** yes

4. **Action:** Save the second report (click "Save" button)
   **Expect:** Toast message "Test results saved successfully"
   **Record through:** yes

5. **Action:** Look for the code dropdown again (to create a third report)
   **Expect:**
   - Only one code remains in the dropdown:
     - "Cefoperazone [Susceptibility] by Minimum inhibitory concentration (MIC) (code)"
   - The two previously used codes are NOT in the list
     **Record through:** yes

### Success looks like

- After each report is created, only the unused codes remain in the dropdown
- The dropdown correctly filters out all previously used codes
- The third code is still available for selection

---

## AC4 — Create button disabled when all codes consumed

### Research map

- Same as AC3
- Button disable logic: `availableCodes.length === 0` condition in `DiagnosticReportForm.tsx` line 1299

### Prerequisites

- Same as AC3
- Two diagnostic reports already created
- One code remains unused

### Data setup

- Continue from AC3 setup
- Two diagnostic reports created
- Only "Cefoperazone [Susceptibility] by Minimum inhibitory concentration (MIC)" remains

### Steps

1. **Action:** From AC3, with only one code remaining, select it from the dropdown: "Cefoperazone [Susceptibility] by Minimum inhibitory concentration (MIC)"
   **Expect:** The dropdown shows the selected code
   **Record through:** yes

2. **Action:** Click "Create Report" button
   **Expect:**
   - Toast message "Diagnostic report created successfully"
   - A third diagnostic report section appears
     **Record through:** yes

3. **Action:** Save the third report (click "Save" button)
   **Expect:** Toast message "Test results saved successfully"
   **Record through:** yes

4. **Action:** Look for the code selection dropdown and "Create Report" button
   **Expect:**
   - The dropdown is no longer visible (or is empty)
   - The "Create Report" button is disabled
   - A message appears: "All diagnostic report codes have been used"
     **Record through:** yes

5. **Action:** Try to click the disabled "Create Report" button
   **Expect:** Nothing happens - the button is disabled and does not respond
   **Record through:** yes

### Success looks like

- After all three codes are used, no more reports can be created
- The UI clearly indicates that all codes have been used
- The create button is visually disabled and non-functional

---

## AC5 — Used codes remain excluded after page reload

### Research map

- Same as AC4
- Data persistence via backend API - codes are read from `diagnosticReports` array

### Prerequisites

- Same as AC4
- All three diagnostic reports created

### Data setup

- Continue from AC4 setup
- All three diagnostic reports exist in the system

### Steps

1. **Action:** With all three reports created, hard reload the page (Ctrl+Shift+R or Cmd+Shift+R)
   **Expect:**
   - Page reloads completely
   - All three diagnostic reports are still visible
   - The message "All diagnostic report codes have been used" is still shown
   - No code dropdown is visible
   - "Create Report" button is disabled
     **Record through:** yes

2. **Action:** Navigate away to another page (e.g., click "Updates" tab), then navigate back to Service Requests detail
   **Expect:**
   - Same state as before navigation
   - All three reports still present
   - No dropdown visible
   - Create button disabled
     **Record through:** yes

3. **Action:** Open browser DevTools, go to Application/Storage tab, clear all localStorage, then hard reload
   **Expect:**
   - After login redirect completes
   - Navigate back to the service request detail
   - All three reports still visible
   - State persisted correctly despite localStorage clear
     **Record through:** yes

### Success looks like

- The used codes remain filtered out after page reloads
- The state of diagnostic reports persists correctly
- The application correctly reconstructs the available/used codes from the server data on every load

---

## AC6 — Create button disabled before specimen collection

### Research map

- Same as previous ACs
- Specimen requirement logic: `hasCollectedSpecimens` check in `DiagnosticReportForm.tsx` lines 153-156

### Prerequisites

- Facility context active
- Patient and encounter exist
- New Activity Definition with specimen requirements and diagnostic report codes
- Service Request created without specimen collected

### Data setup

**Note:** This criterion requires an Activity Definition with specimen requirements. We'll create a new one.

**UI recipe:**

1. Navigate to `/facility/{facilityId}/settings/activity_definitions/categories/f-{facilityId}-lab-tests-activity-definition/new`
2. Fill Activity Definition form:
   - Title: `Specimen Required Test {Date.now()}`
   - Slug: auto-generated
   - Description: `Test with specimen requirements`
   - Usage: `Used for testing specimen workflow`
   - Status: `Active`
   - Category: `Laboratory`
   - Kind: `Service Request`
   - Code: Select "Urinary tract infection prophylaxis"
3. Add Specimen Requirement:
   - Click "Select specimen requirements" combobox
   - Search and select "Urinalysis Specimen"
4. Add Diagnostic Report Code:
   - Click "Search Diagnostic Report Codes" combobox
   - Search and select "Acyclovir [Susceptibility]"
5. Click "Create" button
6. Verify toast "Activity definition created successfully"

**Create Service Request:**

7. Navigate to `/facility/{facilityId}/patient/{patientId}/encounter/{encounterId}/service_requests`
8. Click "Create Service Request"
9. Select the newly created Activity Definition
10. Set Priority: "Routine"
11. Click "Submit"
12. Navigate to Service Request detail page

### Steps

1. **Action:** On the Service Request detail page, look at the "Specimen Collection" section (should be above or near Test Results)
   **Expect:**
   - A specimen requirement is listed showing "Urinalysis Specimen"
   - Status shows "Draft" or "Not Collected"
     **Record through:** yes

2. **Action:** Scroll to the "Test Results" section
   **Expect:**
   - Message shows "Collect specimen before report"
   - The code dropdown is visible but disabled (grayed out)
   - The "Create Report" button is disabled
     **Record through:** yes

3. **Action:** Try to click the disabled "Create Report" button
   **Expect:** Nothing happens or a toast appears saying "Specimen collection required"
   **Record through:** yes

4. **Action:** Go back to the Specimen section and collect the specimen:
   - Click on the specimen card or "Collect" button
   - Fill in required fields (collection date/time, etc.)
   - Mark status as "Available"
   - Save the specimen
     **Expect:**
   - Toast message indicating specimen saved/collected
   - Specimen status changes to "Available"
     **Record through:** yes

5. **Action:** Return to the "Test Results" section
   **Expect:**
   - The dropdown is now enabled
   - The "Create Report" button is enabled (when a code is selected)
   - The message changes from "Collect specimen before report" to "No test results recorded"
     **Record through:** yes

6. **Action:** Select a code from the dropdown and click "Create Report"
   **Expect:**
   - Toast "Diagnostic report created successfully"
   - Report form appears with observation fields
     **Record through:** yes

### Success looks like

- Cannot create a diagnostic report before specimen collection
- Clear messaging about the specimen requirement
- After specimen collection, report creation is enabled
- The workflow enforces the proper order: specimen first, then report

---

## AC7 — Service Request completion workflow continues

### Research map

- routes: Service Request detail page, completion flow
- components: `ServiceRequestShow.tsx` completion dialog and workflow logic
- i18n labels: "Complete Service Request", "Mark as Completed"
- auth/role: `tests/.auth/user.json` (admin)

### Prerequisites

- Same as AC6
- All diagnostic reports for all codes have been created and saved
- Specimens collected (if required)

### Data setup

- Continue from any previous AC setup where all reports are created
- All diagnostic reports should be in "Preliminary" or "Final" status
- Service Request should still be in "Active" status

### Steps

1. **Action:** On the Service Request detail page with all reports created, look for a "Complete" or "Mark as Completed" action
   - This might be in a dropdown menu (three dots icon)
   - Or a direct button at the top/bottom of the page
     **Expect:** A completion action is available
     **Record through:** yes

2. **Action:** Click the completion action (button or menu item)
   **Expect:**
   - A confirmation dialog appears
   - Dialog asks for confirmation or optional completion notes
     **Record through:** yes

3. **Action:** If the dialog has a notes field, enter: "All diagnostic reports completed"
   Then click "Confirm" or "Complete" button in the dialog
   **Expect:**
   - Dialog closes
   - Toast message "Service request completed" or similar
   - The Service Request status changes to "Completed"
   - The page may disable editing actions
     **Record through:** yes

4. **Action:** Verify the completion by checking:
   - The Service Request status badge/label at the top
   - Try to create another report (should be disabled)
   - Navigate to the Service Request list and check the status column
     **Expect:**
   - Status shows "Completed" throughout the UI
   - No editing or new report creation is possible
   - The workflow has properly concluded
     **Record through:** yes

5. **Action:** Reload the page
   **Expect:**
   - Status remains "Completed"
   - All diagnostic reports are still visible
   - The completion is persisted
     **Record through:** yes

### Success looks like

- The Service Request can be marked as completed after all reports are created
- The completion workflow functions correctly
- All data persists after completion
- The UI properly reflects the completed state

---

## Test plan / notes

**Playwright test coverage expectations:**

- Add E2E test covering the complete multi-report workflow:
  - Create Activity Definition with 3 diagnostic report codes
  - Create Service Request from that AD
  - Create first diagnostic report, verify code removed from dropdown
  - Create second report, verify only 2 remaining codes shown
  - Create third report, verify dropdown empty and button disabled
  - Reload page, verify state persists
  - Test specimen requirement blocking (if applicable)

**CI expectations:**

- Type checking must pass: `npx tsc --noEmit`
- Linting must pass: `npm run lint`
- Build must succeed: `npm run build`
- All existing tests must continue passing

**Edge cases to consider:**

- Activity Definition with only 1 diagnostic report code
- Activity Definition with no diagnostic report codes
- Service Request with specimen requirements
- Service Request without specimen requirements
- Multiple concurrent users creating reports on the same SR
- Partial report completion (some observations filled, some not)
