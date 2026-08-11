# QA Plan: Support for creating multiple diagnostic reports for SR

## AC1 — Filter codes dropdown to show only remaining codes

### Research map

- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/service_requests/:serviceRequestId`
- components: `src/pages/Facility/services/serviceRequests/ServiceRequestShow.tsx`, `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx`
- i18n labels: "Select Diagnostic Report Type", "Create Report"
- auth/role: tests/.auth/user.json (admin)
- permissions / facility-scoped: yes
- fixtures needed: facility, patient, encounter, activity definition with 3+ diagnostic report codes, service request

### Prerequisites

- Backend running on port 9000
- Fixture facility, patient, and encounter exist (from load-fixtures)
- User authenticated as admin

### Data setup

- Prefer fixtures: load-fixtures provides facility, patient, and encounter
- Provenance: Activity definition codes from `tests/facility/settings/activityDefinition/activityDefinition.ts` DIAGNOSTIC_REPORT_CODES
- UI recipe:
  1. Go to `/facility/{facilityId}/settings/activity_definitions/categories/f-{facilityId}-lab-tests-activity-definition/new`
  2. Create Activity Definition with:
     - Title: `Multi-Code AD ${Date.now()}`
     - Status: Active
     - Classification: Laboratory
     - Kind: Service Request
     - Code: Select first code from valueset (e.g., "Acyclovir [Susceptibility]")
     - Add 3 diagnostic report codes from valueset picker:
       - "Acyclovir [Susceptibility]"
       - "Amdinocillin [Susceptibility] by Serum bactericidal titer"
       - "Cefoperazone [Susceptibility] by Minimum inhibitory concentration (MIC)"
  3. Save; confirm the new AD appears in the list
  4. Go to `/facility/{facilityId}/patient/{patientId}/encounter/{encounterId}/service_requests`
  5. Click "Create Service Request"
  6. Select the newly created AD from the activity definition picker
  7. Select priority: Routine
  8. Submit; confirm success toast
  9. Note the service request URL (e.g., `/facility/{facilityId}/service_requests/{serviceRequestId}`)
- API seed (if UI graph is deep):
  - POST `/api/v1/facility/{facilityId}/activity_definition/`
    (from `src/types/emr/activityDefinition/activityDefinitionApi.ts`)
  - Auth: Use `getApiUrl()` + `getApiHeaders()` from `tests/helper/utils.ts` + `tests/.auth/user.json`
  - Body: Adapt from `tests/facility/settings/activityDefinition/activityDefinition.ts` createActivityDefinition helper
    ```json
    {
      "title": "Multi-Code AD 59",
      "slug": "multi-code-ad-59",
      "resource_category": "f-{facilityId}-lab-tests-activity-definition",
      "description": "Test AD with 3 diagnostic report codes",
      "usage": "For testing multiple diagnostic reports",
      "status": "active",
      "classification": "Laboratory",
      "kind": "ServiceRequest",
      "code": {
        "code": "10562-1",
        "display": "Acyclovir [Susceptibility]",
        "system": "http://loinc.org"
      },
      "diagnostic_report_codes": [
        {
          "code": "10562-1",
          "display": "Acyclovir [Susceptibility]",
          "system": "http://loinc.org"
        },
        {
          "code": "16365-9",
          "display": "Amdinocillin [Susceptibility] by Serum bactericidal titer",
          "system": "http://loinc.org"
        },
        {
          "code": "18881-2",
          "display": "Cefoperazone [Susceptibility] by Minimum inhibitory concentration (MIC)",
          "system": "http://loinc.org"
        }
      ]
    }
    ```
  - Then POST `/api/v1/facility/{facilityId}/encounter/{encounterId}/service_request/`
    (from `src/types/emr/serviceRequest/serviceRequestApi.ts`)
  - Body:
    ```json
    {
      "activity_definition": "{activityDefinitionId}",
      "status": "active",
      "priority": "routine",
      "locations": []
    }
    ```
- Verify: Open `/facility/{facilityId}/service_requests/{serviceRequestId}` and confirm the codes dropdown is visible before scoring

### Steps

1. **Action:** Go to `/facility/{facilityId}/service_requests/{serviceRequestId}`
   **Expect:** Service request page loads with "Test Results" section visible
   **Record through:** yes

2. **Action:** Scroll to "Test Results" section, observe the codes dropdown
   **Expect:** Dropdown shows all 3 codes: "Acyclovir [Susceptibility]", "Amdinocillin [Susceptibility] by Serum bactericidal titer", "Cefoperazone [Susceptibility] by Minimum inhibitory concentration (MIC)"
   **Record through:** yes

3. **Action:** Select the first code "Acyclovir [Susceptibility]" from dropdown
   **Expect:** Dropdown shows selected code
   **Record through:** yes

4. **Action:** Click "Create Report" button
   **Expect:** Toast notification "Diagnostic report created successfully" appears; new report section appears below
   **Record through:** yes

5. **Action:** Scroll to "Test Results" section again, observe the codes dropdown
   **Expect:** Dropdown now shows only 2 codes (excluding "Acyclovir [Susceptibility]"): "Amdinocillin [Susceptibility] by Serum bactericidal titer", "Cefoperazone [Susceptibility] by Minimum inhibitory concentration (MIC)"
   **Record through:** yes

### Success looks like

- After creating first report, codes dropdown no longer shows "Acyclovir [Susceptibility]"
- Dropdown shows only the 2 remaining unused codes

---

## AC2 — Show all codes when no reports exist yet

### Research map

- Same as AC1

### Prerequisites

- Same as AC1
- Fresh service request with no diagnostic reports created

### Data setup

- Same as AC1 (use a different service request or the same one before creating any reports)

### Steps

1. **Action:** Go to `/facility/{facilityId}/service_requests/{serviceRequestId}` (fresh SR with no reports)
   **Expect:** Service request page loads with "Test Results" section visible
   **Record through:** yes

2. **Action:** Observe the codes dropdown in "Test Results" section
   **Expect:** Dropdown shows all 3 codes from the Activity Definition: "Acyclovir [Susceptibility]", "Amdinocillin [Susceptibility] by Serum bactericidal titer", "Cefoperazone [Susceptibility] by Minimum inhibitory concentration (MIC)"
   **Record through:** yes

### Success looks like

- Codes dropdown shows all 3 codes when no reports have been created yet

---

## AC3 — Create second report without reload

### Research map

- Same as AC1

### Prerequisites

- Same as AC1
- One diagnostic report already created for first code

### Data setup

- Same as AC1 (continue from AC1 where first report was created)

### Steps

1. **Action:** After creating first report in AC1, scroll to "Test Results" section
   **Expect:** Codes dropdown shows 2 remaining codes, "Create Report" button is visible
   **Record through:** yes

2. **Action:** Select the second code "Amdinocillin [Susceptibility] by Serum bactericidal titer" from dropdown
   **Expect:** Dropdown shows selected code
   **Record through:** yes

3. **Action:** Click "Create Report" button
   **Expect:** Toast notification "Diagnostic report created successfully" appears; new report section appears immediately below the first report
   **Record through:** yes

4. **Action:** Observe the page (do NOT reload)
   **Expect:** Both reports are visible on the page without reloading
   **Record through:** yes

### Success looks like

- Second report appears immediately below first report
- Page shows both reports without requiring a reload
- URL shows `/facility/{facilityId}/service_requests/{serviceRequestId}` (no navigation occurred)

---

## AC4 — Hide "Create Report" button when all codes used

### Research map

- Same as AC1

### Prerequisites

- Same as AC1
- Service request with 3 diagnostic report codes in its AD

### Data setup

- Same as AC1

### Steps

1. **Action:** Continue from AC3 (2 reports created), select the third code "Cefoperazone [Susceptibility] by Minimum inhibitory concentration (MIC)" from dropdown
   **Expect:** Dropdown shows selected code
   **Record through:** yes

2. **Action:** Click "Create Report" button
   **Expect:** Toast notification "Diagnostic report created successfully" appears; third report section appears
   **Record through:** yes

3. **Action:** Scroll to "Test Results" section and observe the codes dropdown and "Create Report" button
   **Expect:** Codes dropdown is no longer visible (or empty), "Create Report" button is hidden or disabled
   **Record through:** yes

### Success looks like

- After creating N reports for N codes, the "Create Report" button and codes dropdown are hidden
- Page shows all 3 created reports

---

## AC5 — Persist available codes after page reload

### Research map

- Same as AC1

### Prerequisites

- Same as AC1
- 2 reports already created for codes A and B out of 3 codes

### Data setup

- Continue from AC3 (2 reports created for first 2 codes)

### Steps

1. **Action:** With 2 reports created, reload the page (press F5 or navigate to the same URL)
   **Expect:** Page reloads and shows the service request with 2 existing reports
   **Record through:** yes

2. **Action:** Scroll to "Test Results" section and observe the codes dropdown
   **Expect:** Dropdown shows only the remaining code "Cefoperazone [Susceptibility] by Minimum inhibitory concentration (MIC)" (code C)
   **Record through:** yes

### Success looks like

- After reload, codes dropdown correctly shows only the remaining unused code
- The 2 previously created reports are still visible

---

## AC6 — Allow report creation when AD has no codes

### Research map

- Same as AC1

### Prerequisites

- Backend running on port 9000
- Fixture facility, patient, and encounter exist
- User authenticated as admin

### Data setup

- UI recipe:
  1. Go to `/facility/{facilityId}/settings/activity_definitions/categories/f-{facilityId}-lab-tests-activity-definition/new`
  2. Create Activity Definition with:
     - Title: `No-Code AD ${Date.now()}`
     - Status: Active
     - Classification: Laboratory
     - Kind: Service Request
     - Code: Select first code from valueset
     - Do NOT add any diagnostic report codes
  3. Save; confirm the new AD appears in the list
  4. Go to `/facility/{facilityId}/patient/{patientId}/encounter/{encounterId}/service_requests`
  5. Click "Create Service Request"
  6. Select the newly created AD from the activity definition picker
  7. Select priority: Routine
  8. Submit; confirm success toast
- Verify: Open the service request URL

### Steps

1. **Action:** Go to `/facility/{facilityId}/service_requests/{serviceRequestId}` (SR with AD that has no diagnostic report codes)
   **Expect:** Service request page loads with "Test Results" section visible
   **Record through:** yes

2. **Action:** Observe the "Test Results" section
   **Expect:** No codes dropdown is visible (AD has no codes defined), "Create Report" button is visible
   **Record through:** yes

3. **Action:** Click "Create Report" button
   **Expect:** Toast notification "Diagnostic report created successfully" appears; new report section appears
   **Record through:** yes

### Success looks like

- Report is created successfully without requiring a code selection
- No codes dropdown is shown when AD has no diagnostic report codes

---

## AC7 — Allow creating additional reports if final report does not exist

### Research map

- Same as AC1

### Prerequisites

- Same as AC1
- One diagnostic report in preliminary status

### Data setup

- Same as AC1 (create first report which will be in preliminary status by default)

### Steps

1. **Action:** Continue from AC1 (1 report created in preliminary status), observe the "Test Results" section
   **Expect:** Codes dropdown is visible showing 2 remaining codes, "Create Report" button is visible
   **Record through:** yes

2. **Action:** Select the second code from dropdown and click "Create Report"
   **Expect:** Toast notification appears; second report is created
   **Record through:** yes

### Success looks like

- Form allows creating additional reports as long as no final report exists
- Multiple reports in preliminary/registered status can coexist

---

## Test plan / notes

### Playwright E2E Coverage

- Add E2E test in `tests/facility/patient/encounter/serviceRequests/multipleReports.spec.ts`
- Test should cover:
  1. Creating an AD with 3 diagnostic report codes
  2. Creating a service request from that AD
  3. Creating 3 diagnostic reports sequentially
  4. Verifying codes dropdown filters correctly after each report
  5. Verifying form hides after all codes used
  6. Verifying page reload preserves state correctly

### API Testing

- Backend already supports multiple diagnostic reports per SR
- Frontend changes do not require backend API changes
- Verify that POST `/api/v1/patient/{patient_external_id}/diagnostic_report/` accepts multiple reports with different codes for the same service request

### CI Requirements

- All existing Playwright tests must pass
- ESLint and TypeScript checks must pass
- Build must succeed without errors

### Edge Cases to Consider

- SR with AD that has no diagnostic report codes defined (AC6)
- SR with AD that has 1 diagnostic report code
- SR where all reports have been finalized
- Concurrent report creation (potential race condition)
- Very long code display names in dropdown

### Performance Considerations

- Filtering available codes is done client-side (efficient)
- No additional API calls required beyond existing report creation
- Page does not reload between report creations (better UX)
