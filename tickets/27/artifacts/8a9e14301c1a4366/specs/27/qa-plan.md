# QA Plan: Support multiple diagnostic reports per Service Request

## AC1 — All codes visible in dropdown for new SR

### Research map

- routes: `src/Routers/routes/ServiceRequestRoutes.tsx` → `/facility/:facilityId/service/:serviceId/service_request/:serviceRequestId`
- components: `src/pages/Facility/services/serviceRequests/ServiceRequestShow.tsx`, `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx`
- i18n labels: "Select diagnostic report type", "Create report", "Test Results Entry"
- auth/role: `tests/.auth/user.json` (admin) or `tests/.auth/facilityAdmin.json`
- permissions / facility-scoped: yes
- fixtures needed: Facility, Patient, Encounter, Healthcare Service, Activity Definition with multiple diagnostic report codes, Service Request with collected specimens

### Prerequisites

- Backend running on port 9000
- Frontend build exists (`npm run build`)
- Database with fixtures loaded (`npm run playwright:db-reset` or `npm run playwright:db-restore`)
- Authenticated as admin user

### Data setup

- Prefer fixtures: load-fixtures provides facility, patient, encounter, healthcare service. Activity Definition and Service Request must be created.
- Provenance: Activity Definition codes from `tests/facility/settings/activityDefinition/activityDefinition.ts` DIAGNOSTIC_REPORT_CODES constant (lines 49-60)
- UI recipe (Activity Definition):
  1. Go to `/facility/{facilityId}/settings/activity_definitions/categories/f-{facilityId}-lab-tests-activity-definition/new`
  2. Fill title: `qa-ad-27-multi-codes-{unique-slug}`
  3. Select status: Active
  4. Select category: Laboratory
  5. Select kind: Service Request
  6. Select code: `Fluoroscopic venography of left limb with contrast` (from valueset)
  7. Select 3 diagnostic report codes:
     - `Acyclovir [Susceptibility]`
     - `Amdinocillin [Susceptibility] by Serum bactericidal titer`
     - `Cefoperazone [Susceptibility] by Minimum inhibitory concentration (MIC)`
       (from valueset, use combobox "Search diagnostic report codes")
  8. Click "Create"
  9. Verify toast: "Activity definition created successfully"
- UI recipe (Service Request with specimens):
  1. Go to `/facility/{facilityId}/encounters` and open the existing fixture encounter (or create one for test patient)
  2. Create Service Request:
     - Navigate to encounter → Service Requests section → Create Service Request
     - Select the Activity Definition created above: `qa-ad-27-multi-codes-{unique-slug}`
     - Fill required fields (priority, intent, etc.)
     - Save and verify Service Request is created
  3. Collect specimen:
     - Open the Service Request details page
     - Find specimen workflow section
     - Collect all required specimens (change status to "Available")
     - Verify specimens are marked as collected
- Entity chain: Activity Definition → Service Request → Specimens (must be collected before creating reports)
- After seed: Open `/facility/{facilityId}/service/pathology-lab/service_request/{serviceRequestId}` and scroll to "Test Results Entry" section; confirm dropdown shows 3 codes and "Create Report" button is enabled

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/service/pathology-lab/service_request/{serviceRequestId}` (use the Service Request ID from setup)
   **Expect:** Page loads showing Service Request details with "Test Results Entry" section
   **Record through:** yes

2. **Action:** Scroll to "Test Results Entry" section and expand if collapsed
   **Expect:** Section shows "No test results recorded" message with a dropdown and "Create Report" button
   **Record through:** yes

3. **Action:** Click the diagnostic report code dropdown
   **Expect:** Dropdown opens showing all 3 codes:
   - `Acyclovir [Susceptibility]`
   - `Amdinocillin [Susceptibility] by Serum bactericidal titer`
   - `Cefoperazone [Susceptibility] by Minimum inhibitory concentration (MIC)`
     **Record through:** yes

### Success looks like

- All 3 diagnostic report codes from the Activity Definition appear in the dropdown
- "Create Report" button is disabled until a code is selected
- Dropdown and button are visible and functional

## AC2 — Code A filtered after first report created

### Research map

- Same as AC1

### Prerequisites

- Same as AC1
- Service Request from AC1 with 0 existing reports

### Data setup

- Use the same Service Request from AC1 (no additional setup needed)

### Steps

1. **Action:** Select first code `Acyclovir [Susceptibility]` from dropdown
   **Expect:** Code is selected and shown in dropdown trigger
   **Record through:** yes

2. **Action:** Click "Create Report" button
   **Expect:**
   - Toast notification: "Diagnostic report created successfully"
   - Page refreshes/updates
   - "Test Results Entry" section now shows the created report with status badge (e.g., "preliminary")
     **Record through:** yes

3. **Action:** Scroll down to find another "Create Report" section or button (may appear below the existing report or in a separate area)
   **Expect:** A new diagnostic report creation form/section is visible
   **Record through:** yes

4. **Action:** Click the diagnostic report code dropdown in the new report section
   **Expect:** Dropdown opens showing only 2 remaining codes:
   - `Amdinocillin [Susceptibility] by Serum bactericidal titer`
   - `Cefoperazone [Susceptibility] by Minimum inhibitory concentration (MIC)`
   - Code A (`Acyclovir [Susceptibility]`) is NOT in the list
     **Record through:** yes

### Success looks like

- First report is created successfully with code A
- Dropdown for new report only shows codes B and C
- Code A is filtered out and not selectable

## AC3 — Code B filtered after second report created

### Research map

- Same as AC1

### Prerequisites

- Same as AC2
- Service Request with 1 existing report (code A used)

### Data setup

- Use the same Service Request from AC2 (no additional setup needed)

### Steps

1. **Action:** Select second code `Amdinocillin [Susceptibility] by Serum bactericidal titer` from dropdown
   **Expect:** Code B is selected and shown in dropdown trigger
   **Record through:** yes

2. **Action:** Click "Create Report" button
   **Expect:**
   - Toast notification: "Diagnostic report created successfully"
   - Page refreshes/updates
   - Two reports now visible in the UI
     **Record through:** yes

3. **Action:** Find the diagnostic report code dropdown for creating a new report
   **Expect:** Dropdown opens showing only 1 remaining code:
   - `Cefoperazone [Susceptibility] by Minimum inhibitory concentration (MIC)`
   - Codes A and B are NOT in the list
     **Record through:** yes

### Success looks like

- Second report is created successfully with code B
- Dropdown for new report only shows code C
- Codes A and B are filtered out

## AC4 — All codes used, create button disabled

### Research map

- Same as AC1

### Prerequisites

- Same as AC3
- Service Request with 2 existing reports (codes A and B used)

### Data setup

- Use the same Service Request from AC3 (no additional setup needed)

### Steps

1. **Action:** Select third code `Cefoperazone [Susceptibility] by Minimum inhibitory concentration (MIC)` from dropdown
   **Expect:** Code C is selected and shown in dropdown trigger
   **Record through:** yes

2. **Action:** Click "Create Report" button
   **Expect:**
   - Toast notification: "Diagnostic report created successfully"
   - Page refreshes/updates
   - Three reports now visible in the UI
     **Record through:** yes

3. **Action:** Look for diagnostic report code dropdown and "Create Report" button
   **Expect:**
   - Either the dropdown and button are hidden/removed, OR
   - The dropdown is empty/disabled AND the "Create Report" button is disabled
   - No way to create a 4th report
     **Record through:** yes

### Success looks like

- Third report is created successfully with code C
- No dropdown or create button available (or both disabled)
- UI clearly indicates all reports have been created

## AC5 — Can create third report when 2 exist

### Research map

- Same as AC1

### Prerequisites

- Backend running on port 9000
- Frontend build exists
- Database with fixtures loaded
- New Service Request needed (independent from AC1-4)

### Data setup

- Create a new Activity Definition with 3 codes (same as AC1)
- Create a new Service Request using this Activity Definition
- Collect specimens
- Create 2 diagnostic reports via UI (use codes A and B)
- Navigate away from the page (e.g., go to facility overview)
- After seed: Record the Service Request ID; return to `/facility/{facilityId}/service/pathology-lab/service_request/{serviceRequestId}`

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/service/pathology-lab/service_request/{serviceRequestId}` (fresh page load)
   **Expect:** Page loads showing Service Request with 2 existing reports
   **Record through:** yes

2. **Action:** Scroll to "Test Results Entry" section
   **Expect:** Section shows 2 existing reports and a dropdown/button to create a new report
   **Record through:** yes

3. **Action:** Click the diagnostic report code dropdown
   **Expect:** Dropdown opens showing only 1 remaining code (code C)
   **Record through:** yes

4. **Action:** Select code C and click "Create Report"
   **Expect:**
   - Toast notification: "Diagnostic report created successfully"
   - Third report is created
   - Page shows 3 reports
     **Record through:** yes

### Success looks like

- Can create a third report after page reload
- Dropdown correctly shows only remaining code
- All 3 reports are visible after creation

## AC6 — All reports visible and editable

### Research map

- Same as AC1
- Additional: `src/pages/Facility/services/serviceRequests/components/DiagnosticReportReview.tsx` (may handle multi-report display)

### Prerequisites

- Same as AC5
- Service Request with 3 existing reports (codes A, B, C used)

### Data setup

- Use the Service Request from AC5 with 3 reports (no additional setup needed)

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/service/pathology-lab/service_request/{serviceRequestId}`
   **Expect:** Page loads showing Service Request details
   **Record through:** yes

2. **Action:** Scroll through the entire page
   **Expect:**
   - All 3 diagnostic reports are visible somewhere on the page
   - Each report shows its code/title
   - Each report may be in a card, section, or list
     **Record through:** yes

3. **Action:** For each of the 3 reports, look for edit controls (buttons, forms, status badges)
   **Expect:**
   - Each report has visible controls (e.g., "Edit", status dropdown, observation fields)
   - Each report can be interacted with independently
     **Record through:** yes

4. **Action:** Attempt to edit one report (e.g., change status, add observations, add conclusion)
   **Expect:**
   - Edit controls work for that specific report
   - Changes save successfully (toast confirmation)
   - Other reports are not affected
     **Record through:** yes

### Success looks like

- All 3 reports are visible on the page
- Each report is independently editable
- UI clearly differentiates between reports (by code, title, or visual separation)

## AC7 — No codes in AD, report created without code

### Research map

- Same as AC1

### Prerequisites

- Backend running on port 9000
- Frontend build exists
- Database with fixtures loaded

### Data setup

- UI recipe (Activity Definition without diagnostic report codes):
  1. Go to `/facility/{facilityId}/settings/activity_definitions/categories/f-{facilityId}-lab-tests-activity-definition/new`
  2. Fill title: `qa-ad-27-no-codes-{unique-slug}`
  3. Select status: Active
  4. Select category: Laboratory
  5. Select kind: Service Request
  6. Select code: `Post-exposure herpesvirus infection prophylaxis` (from valueset)
  7. Do NOT select any diagnostic report codes (skip this field)
  8. Click "Create"
  9. Verify toast: "Activity definition created successfully"
- UI recipe (Service Request):
  1. Create a Service Request using the Activity Definition created above
  2. Collect specimens
  3. Navigate to the Service Request details page
- After seed: Open `/facility/{facilityId}/service/pathology-lab/service_request/{serviceRequestId}`; verify "Test Results Entry" section shows "Create Report" button but NO dropdown

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/service/pathology-lab/service_request/{serviceRequestId}`
   **Expect:** Page loads showing Service Request details
   **Record through:** yes

2. **Action:** Scroll to "Test Results Entry" section
   **Expect:**
   - Section shows "No test results recorded" message
   - "Create Report" button is visible and enabled
   - NO diagnostic report code dropdown is present
     **Record through:** yes

3. **Action:** Click "Create Report" button directly (without selecting a code)
   **Expect:**
   - Toast notification: "Diagnostic report created successfully"
   - Report is created without a code
   - Page refreshes/updates showing the new report
     **Record through:** yes

4. **Action:** Verify the created report
   **Expect:**
   - Report exists and is visible
   - Report has no code/title associated (or shows a generic label)
   - Report can be edited normally (status, observations, etc.)
     **Record through:** yes

### Success looks like

- Dropdown is not shown when Activity Definition has 0 codes
- "Create Report" button works without code selection
- Report is created successfully without a code (existing behavior preserved)

## Test plan / notes

- **Playwright E2E coverage:** Add test suite in `tests/facility/services/serviceRequests/diagnosticReports.spec.ts` covering:
  - Creating multiple reports with different codes
  - Dropdown filtering after each report creation
  - Button disabled state when all codes used
  - No-code scenario (Activity Definition with 0 diagnostic report codes)
  - Page reload preserves state (remaining codes shown correctly)
- **CI must pass:** All existing tests should pass; no regressions in Service Request or Diagnostic Report flows
- **Code review:** Verify that:
  - `usedCodes` calculation correctly extracts codes from existing reports
  - `availableCodes` filtering logic matches spec requirements
  - `allCodesUsed` flag correctly disables create button
  - `selectedReportCode` is reset after successful report creation
  - Component handles edge cases (0 codes, 1 code, N codes)
