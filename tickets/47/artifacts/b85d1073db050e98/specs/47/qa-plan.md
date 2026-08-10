# QA Plan: Support for Creating Multiple Diagnostic Reports for Service Request

## AC1 — Display all diagnostic report codes in dropdown

### Research map

- routes: `src/Routers/routes/PatientRoutes.tsx` → `/facility/:facilityId/patient/:patientId/encounter/:encounterId/service_requests/:serviceRequestId`
- components: `src/pages/Facility/services/serviceRequests/ServiceRequestShow.tsx`, `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx`
- i18n labels: "Select Diagnostic Report Type", "Create Report"
- auth/role: tests/.auth/user.json (admin)
- permissions / facility-scoped: yes (facility context active)
- fixtures needed: facility, patient, encounter from load-fixtures

### Prerequisites

- Backend running on port 9000
- Facility context active (facilityId from load-fixtures)
- Patient and encounter exist (from load-fixtures)

### Data setup

- Prefer fixtures: load-fixtures provides facility, patient, encounter
- Provenance: Activity Definition with multiple diagnostic report codes needs creation via API
- API seed (Activity Definition with 3 diagnostic report codes):
  - POST `/api/v1/facility/{facilityId}/activity_definition/`
    (from `src/types/emr/activityDefinition/activityDefinitionApi.ts`)
  - Auth: `getApiUrl()` + `getApiHeaders()` from `tests/helper/utils.ts` + `tests/.auth/user.json`
  - Body (adapted from `tests/facility/settings/activityDefinition/activityDefinition.ts` `generateActivityDefinitionData`):
    ```json
    {
      "title": "Multi-Code Lab Test QA47",
      "slug": "multi-code-lab-test-qa47",
      "description": "Test activity definition with multiple diagnostic report codes",
      "usage": "Used for testing multiple diagnostic report creation workflow",
      "status": "active",
      "kind": "ServiceRequest",
      "resource_category": "f-{facilityId}-lab-tests-activity-definition",
      "code": {
        "code": "363679005",
        "display": "Imaging",
        "system": "http://snomed.info/sct"
      },
      "classification": "Laboratory",
      "diagnostic_report_codes": [
        {
          "code": "10834-0",
          "display": "Acyclovir [Susceptibility]",
          "system": "http://loinc.org"
        },
        {
          "code": "10835-7",
          "display": "Amdinocillin [Susceptibility]",
          "system": "http://loinc.org"
        },
        {
          "code": "10836-5",
          "display": "Cefoperazone [Susceptibility]",
          "system": "http://loinc.org"
        }
      ]
    }
    ```
  - Codes from `tests/facility/settings/activityDefinition/activityDefinition.ts` DIAGNOSTIC_REPORT_CODES
  - Verify: After creation, go to `/facility/{facilityId}/settings/activity_definitions` and confirm "Multi-Code Lab Test QA47" appears in list

- Service Request creation via UI (after Activity Definition exists):
  1. Go to `/facility/{facilityId}/patient/{patientId}/encounter/{encounterId}/service_requests`
  2. Click "Create Service Request"
  3. In Activity Definition picker: Navigate to "Lab Tests" → Search "Multi-Code Lab Test QA47" → Select
  4. Expand the SR card → Select Priority "Routine" → Click "Submit"
  5. Verify toast "Questionnaire submitted successfully"
  6. Click "Service Requests" tab → Verify SR row appears → Click "See Details"

### Steps

1. **Action:** On the Service Request detail page, scroll to the "Test Results Entry" section
   **Expect:** The section shows "No test results recorded" and a dropdown labeled "Select Diagnostic Report Type"
   **Record through:** yes

2. **Action:** Click the "Select Diagnostic Report Type" dropdown
   **Expect:** Dropdown opens and displays all three codes from the Activity Definition:
   - "Acyclovir [Susceptibility] (10834-0)"
   - "Amdinocillin [Susceptibility] (10835-7)"
   - "Cefoperazone [Susceptibility] (10836-5)"
     **Record through:** yes

### Success looks like

- Dropdown is visible and enabled
- All three diagnostic report codes are displayed in the dropdown
- Each option shows both the display name and code in format "Display (Code)"

## AC2 — First diagnostic report uses one code and removes it from dropdown

### Research map

- Same as AC1

### Prerequisites

- AC1 completed (Service Request exists with 3-code Activity Definition)
- On the Service Request detail page

### Data setup

- No additional setup needed (continues from AC1)
- If starting fresh, repeat AC1 setup and navigate to the SR detail page

### Steps

1. **Action:** In the "Select Diagnostic Report Type" dropdown, select the first code "Acyclovir [Susceptibility] (10834-0)"
   **Expect:** Dropdown closes and the selected code is shown in the dropdown trigger
   **Record through:** yes

2. **Action:** Click "Create Report" button
   **Expect:** Toast "Diagnostic report created successfully" appears; the Test Results Entry section expands to show observation input fields
   **Record through:** yes

3. **Action:** Scroll down and click the collapse button (chevrons) to collapse the Test Results Entry section, then expand it again
   **Expect:** Section collapses and re-expands; the create report UI is hidden (report now exists)
   **Record through:** yes

4. **Action:** Look for the "Select Diagnostic Report Type" dropdown in the collapsed/unexpanded state
   **Expect:** Dropdown is no longer visible (replaced by the existing report UI)
   **Record through:** yes

### Success looks like

- After creating the first report, the dropdown is not shown when the section is collapsed
- The Test Results Entry section now shows the observation input fields for the created report
- Toast confirms successful report creation

## AC3 — Create second report with remaining codes

### Research map

- Same as AC1

### Prerequisites

- AC2 completed (first diagnostic report created)
- On the same Service Request detail page

### Data setup

- No additional setup needed (continues from AC2)
- If starting fresh, repeat AC1 and AC2 setup steps

### Steps

1. **Action:** Scroll to find if there's a way to create another diagnostic report (look for "Create Report" button or similar UI below the existing report)
   **Expect:** Currently, the UI only shows the existing report; may need to save the current report first to enable creating another
   **Record through:** yes

2. **Action:** Fill in a test value in the observation input field (e.g., "5" in the Result field), then click "Save Results"
   **Expect:** Toast "Test results saved successfully" appears
   **Record through:** yes

3. **Action:** After saving, look for UI to create another diagnostic report (may appear after save or require page refresh)
   **Expect:** UI shows option to create another report (dropdown or button)
   **Record through:** yes

4. **Action:** If dropdown appears, click "Select Diagnostic Report Type" dropdown
   **Expect:** Dropdown now shows only TWO remaining codes:
   - "Amdinocillin [Susceptibility] (10835-7)"
   - "Cefoperazone [Susceptibility] (10836-5)"
   - The first code "Acyclovir [Susceptibility]" is NOT shown
     **Record through:** yes

5. **Action:** Select "Amdinocillin [Susceptibility] (10835-7)" and click "Create Report"
   **Expect:** Toast "Diagnostic report created successfully" appears; new report section expands
   **Record through:** yes

### Success looks like

- After creating and saving the first report, UI allows creating a second report
- Dropdown for second report only shows the two unused codes
- The used code (Acyclovir) is excluded from the dropdown
- Second report is created successfully

## AC4 — All codes consumed, no dropdown shown

### Research map

- Same as AC1

### Prerequisites

- AC3 completed (two diagnostic reports created)
- On the same Service Request detail page

### Data setup

- No additional setup needed (continues from AC3)
- If starting fresh, repeat AC1, AC2, and AC3 setup steps

### Steps

1. **Action:** Save the second report by filling in a test value and clicking "Save Results"
   **Expect:** Toast "Test results saved successfully" appears
   **Record through:** yes

2. **Action:** Look for UI to create a third diagnostic report
   **Expect:** UI shows option to create another report
   **Record through:** yes

3. **Action:** If dropdown appears, click "Select Diagnostic Report Type" dropdown
   **Expect:** Dropdown shows only ONE remaining code: "Cefoperazone [Susceptibility] (10836-5)"
   **Record through:** yes

4. **Action:** Select "Cefoperazone [Susceptibility] (10836-5)" and click "Create Report"
   **Expect:** Toast "Diagnostic report created successfully" appears; third report section expands
   **Record through:** yes

5. **Action:** Save the third report by filling in a test value and clicking "Save Results"
   **Expect:** Toast "Test results saved successfully" appears
   **Record through:** yes

6. **Action:** After saving the third report, look for UI to create another diagnostic report
   **Expect:** No dropdown is shown; "Create Report" button is either hidden or disabled; message may show "All diagnostic report codes used"
   **Record through:** yes

### Success looks like

- After all three codes are used, no dropdown is visible
- "Create Report" button is disabled or not shown
- UI clearly indicates all diagnostic report codes have been used

## AC5 — Reload preserves used codes exclusion

### Research map

- Same as AC1

### Prerequisites

- AC4 completed (all three diagnostic reports created)
- On the same Service Request detail page

### Data setup

- No additional setup needed (continues from AC4)
- If starting fresh, repeat AC1, AC2, AC3, and AC4 setup steps

### Steps

1. **Action:** Note the current URL (should be `/facility/{facilityId}/patient/{patientId}/encounter/{encounterId}/service_requests` with detail view open)
   **Expect:** URL is visible in browser
   **Record through:** yes

2. **Action:** Reload the page (F5 or browser refresh button)
   **Expect:** Page reloads and returns to the same Service Request detail view
   **Record through:** yes

3. **Action:** Scroll to the Test Results Entry section
   **Expect:** All three diagnostic reports are still visible; no dropdown or "Create Report" button is shown (all codes consumed)
   **Record through:** yes

4. **Action:** Verify each report shows the test values entered in previous steps
   **Expect:** All three reports show "preliminary" status and the saved observation values
   **Record through:** yes

### Success looks like

- After reload, the Service Request still shows all three created reports
- No dropdown is shown (all codes remain consumed)
- Used codes are persisted and excluded from any future dropdown
- All saved data is preserved

## AC6 — Specimen collection required before report creation

### Research map

- Same as AC1

### Prerequisites

- Facility, patient, encounter from load-fixtures
- Activity Definition with specimen requirements needs to be created

### Data setup

- API seed (Activity Definition with specimen requirement and diagnostic report codes):
  - POST `/api/v1/facility/{facilityId}/activity_definition/`
  - Auth: Same as AC1
  - Body:
    ```json
    {
      "title": "Specimen Required Test QA47",
      "slug": "specimen-required-test-qa47",
      "description": "Test activity definition with specimen requirements",
      "usage": "Used for testing specimen requirement workflow",
      "status": "active",
      "kind": "ServiceRequest",
      "resource_category": "f-{facilityId}-lab-tests-activity-definition",
      "code": {
        "code": "363679005",
        "display": "Imaging",
        "system": "http://snomed.info/sct"
      },
      "classification": "Laboratory",
      "specimen_requirements": [
        {
          "slug": "urinalysis-specimen"
        }
      ],
      "diagnostic_report_codes": [
        {
          "code": "10834-0",
          "display": "Acyclovir [Susceptibility]",
          "system": "http://loinc.org"
        }
      ]
    }
    ```
  - Specimen slug from `tests/facility/settings/activityDefinition/activityDefinition.ts` SPECIMEN_DEFINITIONS
  - Verify: After creation, go to `/facility/{facilityId}/settings/activity_definitions` and confirm "Specimen Required Test QA47" appears

- Service Request creation via UI:
  1. Go to `/facility/{facilityId}/patient/{patientId}/encounter/{encounterId}/service_requests`
  2. Click "Create Service Request"
  3. In Activity Definition picker: Navigate to "Lab Tests" → Search "Specimen Required Test QA47" → Select
  4. Expand the SR card → Select Priority "Routine" → Click "Submit"
  5. Verify toast "Questionnaire submitted successfully"
  6. Click "Service Requests" tab → Verify SR row appears → Click "See Details"

### Steps

1. **Action:** On the Service Request detail page, scroll to the Test Results Entry section
   **Expect:** Section shows "Collect specimen before report" message; "Create Report" button is disabled; no dropdown is shown or dropdown is disabled
   **Record through:** yes

2. **Action:** Click "Collect Specimen" button (should be above or near the Test Results section)
   **Expect:** Specimen collection modal/page opens showing QR code and collection form
   **Record through:** yes

3. **Action:** Fill specimen details (Value: "2", Notes: "Test specimen"), then click "Collect"
   **Expect:** Toast "Specimen collected successfully" appears; modal closes
   **Record through:** yes

4. **Action:** Return to the Test Results Entry section (scroll down)
   **Expect:** The "Collect specimen before report" message is gone; "Select Diagnostic Report Type" dropdown is now enabled; "Create Report" button is enabled after selecting a code
   **Record through:** yes

5. **Action:** Select the diagnostic report code from dropdown and click "Create Report"
   **Expect:** Toast "Diagnostic report created successfully" appears; report creation succeeds
   **Record through:** yes

### Success looks like

- Before specimen collection, "Create Report" button is disabled
- Message clearly indicates specimen collection is required
- After specimen collection, report creation is enabled
- Full workflow completes successfully

## AC7 — Service Request completion after all reports created

### Research map

- Same as AC1

### Prerequisites

- Service Request with multiple diagnostic reports created (from AC4 or AC5)
- All diagnostic reports saved with final status

### Data setup

- No additional setup needed (continues from AC4 or AC5)
- If starting fresh, repeat AC1-AC4 setup steps

### Steps

1. **Action:** On the Service Request detail page, verify all diagnostic reports are in "preliminary" status
   **Expect:** Each report shows a badge with "preliminary" status
   **Record through:** yes

2. **Action:** For each report, fill in results and click "Save Results"
   **Expect:** Each report saves successfully with toast "Test results saved successfully"
   **Record through:** yes

3. **Action:** Look for a "Complete Service Request" or "Mark as Completed" button on the SR detail page
   **Expect:** Button is visible and enabled after all reports are created/saved
   **Record through:** yes

4. **Action:** Click the "Complete Service Request" button (if it exists)
   **Expect:** Service Request status changes to "Completed" or similar; toast confirms status change
   **Record through:** yes

5. **Action:** Navigate back to the Service Requests list tab
   **Expect:** The Service Request row shows updated status reflecting completion
   **Record through:** yes

### Success looks like

- Service Request can be marked as completed after all reports are created and saved
- Status change is reflected in the UI and persisted
- Workflow follows expected state transitions

## Test plan / notes

- Playwright E2E coverage should include:
  - Test for creating SR with multi-code AD and verifying dropdown shows all codes
  - Test for creating first report and verifying code is removed from dropdown
  - Test for creating multiple reports sequentially and verifying dropdown updates
  - Test for preventing report creation when all codes are consumed
  - Test for specimen requirement blocking report creation
  - Test for state persistence after reload
- CI must pass with no regressions in existing Service Request tests
- The fix (memoizing availableCodes) should eliminate the useEffect infinite loop issue
