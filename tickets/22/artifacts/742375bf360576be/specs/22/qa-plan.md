# QA Plan: Support for creating multiple diagnostic reports for SR

## AC1 — Show all available codes when no reports exist

### Research map

- routes: `src/Routers/routes/ServiceRequestRoutes.tsx` → `/facility/:facilityId/patient/:patientId/encounter/:encounterId/service_requests/:serviceRequestId`
- components: `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx`
- i18n labels: "Select Diagnostic Report Type", "Create Report"
- auth/role: tests/.auth/user.json (doctor/admin role)
- permissions: Facility-scoped access required
- fixtures needed: Facility, Patient, Encounter, Activity Definition with 2+ diagnostic report codes, Service Request, Specimen (collected)

### Prerequisites

- User is logged in with doctor or admin role
- Facility context is active
- Service Request exists with an Activity Definition that has 2+ diagnostic report codes
- Required specimens have been collected (status: available)

### Data setup

- Prefer fixtures: load-fixtures provides facility, patient, encounter. Activity Definition and Service Request need to be created.
- Provenance: All codes from LOINC system (validated via terminology search or existing test fixtures in `tests/`)
- UI recipe for Activity Definition with multiple diagnostic report codes:
  1. Go to `/facility/{facilityId}/settings/activity_definitions`
  2. Click "Create Activity Definition"
  3. Fill in required fields:
     - Title: `qa-multi-report-ad-{Date.now()}`
     - Status: `active`
     - Classification: `laboratory`
     - Code: Select from LOINC picker (e.g., blood test panel)
  4. In "Diagnostic Report Codes" section, add 2+ codes:
     - First code: Use LOINC picker to select (e.g., "Complete Blood Count" - LOINC code from system)
     - Click "Add another code"
     - Second code: Use LOINC picker to select different code (e.g., "Basic Metabolic Panel")
  5. Save and verify the Activity Definition appears in list
- UI recipe for Service Request:
  1. Navigate to `/facility/{facilityId}/patient/{patientId}/encounter/{encounterId}`
  2. Go to "Service Requests" tab
  3. Click "Create Service Request"
  4. Select the Activity Definition created above
  5. Fill in required fields and save
- UI recipe for Specimen Collection:
  1. In the same Service Request view
  2. Find the specimen requirements section
  3. Click "Collect Specimen" for each required specimen
  4. Mark status as "Available"
  5. Save

### Steps

1. **Action:** Navigate to the Service Request detail page at `/facility/{facilityId}/patient/{patientId}/encounter/{encounterId}/service_requests/{serviceRequestId}`
   **Expect:** The page loads showing the Service Request details
   **Record through:** yes

2. **Action:** Scroll to the "Test Results Entry" section
   **Expect:** The section shows "No test results have been recorded yet" message and a dropdown labeled "Select Diagnostic Report Type"
   **Record through:** yes

3. **Action:** Click on the diagnostic report type dropdown
   **Expect:** The dropdown shows all diagnostic report codes defined in the Activity Definition (2+ codes visible)
   **Record through:** yes

### Success looks like

- Dropdown displays all codes from the Activity Definition
- Each code shows both display name and code value
- "Create Report" button is visible but disabled until a code is selected

---

## AC2 — Create first diagnostic report with selected code

### Research map

- Same as AC1
- API: `POST /api/v1/patient/{patient_external_id}/diagnostic_report/` (from `src/types/emr/diagnosticReport/diagnosticReportApi.ts`)
- i18n labels: "Create Report", "Diagnostic report created successfully"

### Prerequisites

- Same as AC1 (Service Request with Activity Definition having 2+ codes, no existing reports)

### Data setup

- Same as AC1 setup (use the same Service Request)

### Steps

1. **Action:** From the dropdown in AC1, select the first diagnostic report code
   **Expect:** The selected code appears in the dropdown
   **Record through:** yes

2. **Action:** Click the "Create Report" button
   **Expect:** Toast notification "Diagnostic report created successfully" appears
   **Record through:** yes

3. **Action:** Wait for the page to reload/refresh the data
   **Expect:** The form expands showing test results entry fields for the selected report type
   **Record through:** yes

4. **Action:** Verify the report header shows the selected code's display name
   **Expect:** The diagnostic report code display name is visible in the expanded form
   **Record through:** yes

### Success looks like

- Toast confirms report creation
- Form transitions from "no reports" state to showing observations entry fields
- Report badge shows "preliminary" status

---

## AC3 — Show "Create Another Report" button when codes remain

### Research map

- Same as AC1
- i18n labels: "Create Another Report", "Create another diagnostic report for a different test type"

### Prerequisites

- Continuation from AC2 (one diagnostic report exists, Activity Definition has 2+ codes)

### Data setup

- Use the same Service Request from AC1/AC2 with one report already created

### Steps

1. **Action:** Scroll down in the "Test Results Entry" section
   **Expect:** Below the observations/conclusion/files sections, see a new section with message "Create another diagnostic report for a different test type"
   **Record through:** yes

2. **Action:** Observe the dropdown and button in this new section
   **Expect:** A dropdown labeled "Select Diagnostic Report Type" and a button labeled "Create Another Report" are visible
   **Record through:** yes

### Success looks like

- "Create Another Report" section is visible below the current report's form
- UI clearly distinguishes between editing current report and creating a new one

---

## AC4 — Code dropdown shows only unused codes

### Research map

- Same as AC1
- Logic: `availableCodes` filters out codes already used by existing reports

### Prerequisites

- Continuation from AC3 (one report exists with one code used)

### Data setup

- Same Service Request with one diagnostic report already created for one of the codes

### Steps

1. **Action:** In the "Create Another Report" section, click the diagnostic report type dropdown
   **Expect:** The dropdown opens showing available codes
   **Record through:** yes

2. **Action:** Compare the codes shown in the dropdown with the codes from the Activity Definition
   **Expect:** The dropdown shows only codes NOT yet used by existing reports (the first selected code should not appear)
   **Record through:** yes

3. **Action:** Count the number of codes in the dropdown
   **Expect:** The count equals (total AD codes - number of existing reports)
   **Record through:** yes

### Success looks like

- Dropdown excludes the code used by the existing report
- Only unused codes are selectable
- Each code shows display name and code value

---

## AC5 — Hide "Create Report" when all codes used

### Research map

- Same as AC1
- Logic: `canCreateMoreReports = availableCodes.length > 0`

### Prerequisites

- Service Request with Activity Definition having exactly 2 diagnostic report codes
- Both reports have been created (one per code)

### Data setup

- Use the same Service Request from AC1-AC4
- Create the second report by following AC2-AC4 steps with the remaining available code

### Steps

1. **Action:** After creating the second diagnostic report, scroll through the "Test Results Entry" section
   **Expect:** The "Create Another Report" section is no longer visible
   **Record through:** yes

2. **Action:** Verify only the report selector tabs and the active report's form are shown
   **Expect:** No dropdown or "Create Another Report" button appears anywhere in the section
   **Record through:** yes

### Success looks like

- "Create Another Report" section disappears when all codes are used
- Users can only switch between existing reports, not create new ones
- Form remains fully functional for editing existing reports

---

## AC6 — Switch between multiple reports independently

### Research map

- Same as AC1
- Component: Report selector tabs added when `diagnosticReports.length > 1`
- State: `activeReportId` tracks current report

### Prerequisites

- Continuation from AC5 (at least 2 diagnostic reports exist for the Service Request)

### Data setup

- Same Service Request with 2+ diagnostic reports already created

### Steps

1. **Action:** In the "Test Results Entry" section, observe the report selector tabs at the top of the expanded form
   **Expect:** Multiple tabs/buttons are visible, one for each diagnostic report, labeled with their code display names
   **Record through:** yes

2. **Action:** Note which report tab is currently active (highlighted/selected)
   **Expect:** One tab appears selected/highlighted with a different style (e.g., solid background vs outline)
   **Record through:** yes

3. **Action:** Add a test observation to the current report: enter a value in one of the observation fields, then click "Save Results"
   **Expect:** Toast confirms "Test results saved successfully"
   **Record through:** yes

4. **Action:** Click on a different report tab
   **Expect:** The form refreshes showing different observation fields and any previously saved data for that report
   **Record through:** yes

5. **Action:** Verify the observations you entered in step 3 are not shown in this second report
   **Expect:** The second report's observations are empty or show different values (not the ones from the first report)
   **Record through:** yes

6. **Action:** Click back to the first report tab
   **Expect:** The form shows the observations you entered in step 3
   **Record through:** yes

### Success looks like

- Report selector clearly shows which report is active
- Switching tabs loads different report data
- Each report maintains its own observations independently
- No data bleed between reports

---

## AC7 — Editing observations affects only the active report

### Research map

- Same as AC6
- API: `POST /api/v1/patient/{patient_external_id}/diagnostic_report/{external_id}/observation/` (from `src/types/emr/observation/observationApi.ts`)

### Prerequisites

- Continuation from AC6 (at least 2 diagnostic reports exist)

### Data setup

- Same Service Request with 2+ reports, each with different observation definitions based on their codes

### Steps

1. **Action:** Select the first report tab, enter unique observation values (e.g., "100" for a numeric field), add a conclusion (e.g., "Report 1 conclusion"), and click "Save Results"
   **Expect:** Toast confirms save, observations and conclusion are saved
   **Record through:** yes

2. **Action:** Switch to the second report tab
   **Expect:** Form loads with empty or different observation fields specific to that report's code
   **Record through:** yes

3. **Action:** Enter different observation values for the second report (e.g., "200"), add a different conclusion (e.g., "Report 2 conclusion"), and click "Save Results"
   **Expect:** Toast confirms save
   **Record through:** yes

4. **Action:** Switch back to the first report tab
   **Expect:** The observations show "100" and conclusion shows "Report 1 conclusion" (unchanged from step 1)
   **Record through:** yes

5. **Action:** Switch to the second report tab again
   **Expect:** The observations show "200" and conclusion shows "Report 2 conclusion" (from step 3)
   **Record through:** yes

6. **Action:** Navigate away from the Service Request and return to it
   **Expect:** Both reports still show their respective observations and conclusions correctly
   **Record through:** yes

### Success looks like

- Each report saves its observations and conclusion independently
- Switching between reports never mixes or overwrites data
- Data persists correctly across page reloads/navigation
- No observation or conclusion from one report appears in another

---

## Test plan / notes

### Playwright E2E Coverage

While the above criteria are for live QA, the following should be covered by Playwright tests:

- Test creating multiple diagnostic reports for a Service Request with 3+ AD codes
- Test code filtering logic (availableCodes excludes used codes)
- Test report selector UI state management (activeReportId switching)
- Test API mutations target correct report ID (no cross-report data pollution)
- Test edge case: Activity Definition with single code (no multi-report UI shown)
- Test permissions: ensure non-doctors cannot create/edit reports if applicable

### CI Requirements

- All existing Playwright tests must pass
- TypeScript compilation must succeed (pre-existing errors acceptable if unrelated)
- Build must complete successfully
- ESLint/Prettier checks must pass

### Known Limitations

- This implementation assumes specimens must be collected before creating any report
- File attachments are scoped per report via `associating_id` (backend handles this)
- Report status transitions (preliminary → final) work per-report independently

### Test Data Requirements

For complete testing, ensure:

- Activity Definitions with 1, 2, 3, and 5+ diagnostic report codes exist
- LOINC codes used are valid and searchable via terminology API
- Specimen definitions match the Activity Definition requirements
- Test users have appropriate facility-level permissions for the Service Request workflow
