# QA Plan: Support for creating multiple diagnostic reports for SR

## AC #1 — Show all diagnostic report codes in dropdown when no reports exist

### Research map

- routes: src/Routers/routes/PatientRoutes.tsx → /facility/:facilityId/patient/:patientId/encounter/:encounterId/service_requests
- components: src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx
- i18n labels: "select_diagnostic_report_type", "create_report", "test_results_entry"
- auth/role: tests/.auth/user.json (admin user)
- permissions: facility-scoped (requires access to facility and patient)
- fixtures needed: facility, patient, encounter, activity definition with multiple diagnostic report codes, service request

### Prerequisites

- User logged in with admin credentials (tests/.auth/user.json)
- Backend running on port 9000 with load_fixtures applied
- Frontend production build running

### Data setup

- Prefer fixtures: load_fixtures provides facility (facilityId from tests/support/facilityId.ts), patient (patientId from tests/support/patientId.ts), and encounter (encounterId from tests/support/encounterId.ts). However, no Activity Definition with multiple diagnostic report codes exists.
- UI recipe to create Activity Definition with multiple codes:
  1. Go to `/facility/{facilityId}/settings/activity_definitions`
  2. Click "Create Activity Definition" button
  3. Fill fields:
     - Title: `qa-multi-diag-report-${Date.now()}`
     - Status: Active
     - Classification: Laboratory
     - Kind: Service Request
     - Code: code "CBC", display "Complete Blood Count", system "http://loinc.org"
  4. In "Diagnostic Report Codes" section, add 3 codes:
     - Code 1: code "58410-2", display "Complete blood count", system "http://loinc.org"
     - Code 2: code "57021-8", display "CBC W Auto Differential panel", system "http://loinc.org"
     - Code 3: code "57023-4", display "Auto Differential panel", system "http://loinc.org"
  5. Save; confirm the Activity Definition appears in the list
- API seed alternative (if UI deep):
  - POST `/api/v1/facility/{facilityId}/activity_definition/`
    (verbatim from `src/types/emr/activityDefinition/activityDefinitionApi.ts`)
  - Auth: `getApiUrl()` + `getApiHeaders()` + `tests/.auth/user.json`
  - Body: minimal create fields:
    ```json
    {
      "slug_value": "qa-multi-diag-${Date.now()}",
      "title": "QA Multi Diagnostic Report Test",
      "status": "active",
      "classification": "laboratory",
      "kind": "service_request",
      "code": {
        "code": "CBC",
        "display": "Complete Blood Count",
        "system": "http://loinc.org"
      },
      "diagnostic_report_codes": [
        {
          "code": "58410-2",
          "display": "Complete blood count",
          "system": "http://loinc.org"
        },
        {
          "code": "57021-8",
          "display": "CBC W Auto Differential panel",
          "system": "http://loinc.org"
        },
        {
          "code": "57023-4",
          "display": "Auto Differential panel",
          "system": "http://loinc.org"
        }
      ],
      "facility": "{facilityId}",
      "specimen_requirements": [],
      "charge_item_definitions": [],
      "observation_result_requirements": [],
      "locations": [],
      "category": "",
      "healthcare_service": null,
      "body_site": null,
      "description": "",
      "usage": "",
      "derived_from_uri": null
    }
    ```
- Create Service Request using the Activity Definition:
  1. Go to `/facility/{facilityId}/patient/{patientId}/encounter/{encounterId}/updates`
  2. Click "Service Requests" tab
  3. Click "Create Service Request" button
  4. Select the Activity Definition created above from dropdown
  5. Select Priority (e.g., "Routine")
  6. Click "Create"
  7. Note the Service Request ID from the URL or UI
- Verify: Navigate to the Service Request detail page; confirm "Test Results Entry" section is visible and expandable

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/patient/{patientId}/encounter/{encounterId}/service_requests` and locate the created Service Request. Click to expand the Service Request details, then expand the "Test Results Entry" section.
   **Expect:** The "Test Results Entry" section shows a message "No test results recorded" (or similar), a dropdown labeled "Select Diagnostic Report Type", and a "Create Report" button.
   **Record through:** yes
   **Still after:** optional

2. **Action:** Click the "Select Diagnostic Report Type" dropdown.
   **Expect:** The dropdown shows all 3 diagnostic report codes defined in the Activity Definition:
   - "Complete blood count (58410-2)"
   - "CBC W Auto Differential panel (57021-8)"
   - "Auto Differential panel (57023-4)"
     **Record through:** yes
     **Still after:** optional

### Success looks like

- Dropdown displays all 3 codes with no filtering applied
- All codes are selectable
- "Create Report" button is enabled when a code is selected

---

## AC #2 — Dropdown updates to show only remaining codes after first report created

### Research map

- Same as AC #1

### Prerequisites

- Same as AC #1, with the created Service Request from AC #1

### Data setup

- Use the Service Request and Activity Definition created in AC #1
- No additional data setup needed

### Steps

1. **Action:** From the Service Request detail page (with "Test Results Entry" section expanded), select the first diagnostic report code (e.g., "Complete blood count (58410-2)") from the dropdown.
   **Expect:** The selected code is shown in the dropdown.
   **Record through:** yes
   **Still after:** optional

2. **Action:** Click the "Create Report" button.
   **Expect:** A toast notification appears saying "Diagnostic report created successfully". The page updates to show the observation entry form for the newly created diagnostic report.
   **Record through:** yes
   **Still after:** optional

3. **Action:** Scroll down to the bottom of the "Test Results Entry" section (below the observation form).
   **Expect:** A new section appears labeled "Create additional diagnostic report for remaining codes" with a dropdown and "Create Report" button.
   **Record through:** yes
   **Still after:** optional

4. **Action:** Click the dropdown in the "Create additional diagnostic report" section.
   **Expect:** The dropdown now shows only the 2 remaining unused codes:
   - "CBC W Auto Differential panel (57021-8)"
   - "Auto Differential panel (57023-4)"
     The code "Complete blood count (58410-2)" is NOT in the list.
     **Record through:** yes
     **Still after:** optional

### Success looks like

- The used code is filtered out from the dropdown
- Only the 2 unused codes are available for selection
- The "Create Report" button in the new section is enabled when a remaining code is selected

---

## AC #3 — Create button disabled when all codes used

### Research map

- Same as AC #1

### Prerequisites

- Same as AC #1, continuing from AC #2 (1 of 3 reports created)

### Data setup

- Use the Service Request from AC #2 (already has 1 diagnostic report created)

### Steps

1. **Action:** From the "Create additional diagnostic report" section, select the second code (e.g., "CBC W Auto Differential panel (57021-8)") from the dropdown and click "Create Report".
   **Expect:** Toast notification "Diagnostic report created successfully" appears. The observation form is now shown for the second report.
   **Record through:** yes
   **Still after:** optional

2. **Action:** Scroll down to check if the "Create additional diagnostic report" section is still visible.
   **Expect:** The section is visible with the dropdown showing only 1 remaining code: "Auto Differential panel (57023-4)".
   **Record through:** yes
   **Still after:** optional

3. **Action:** Select the last remaining code ("Auto Differential panel (57023-4)") and click "Create Report".
   **Expect:** Toast notification appears. The third report's observation form is shown.
   **Record through:** yes
   **Still after:** optional

4. **Action:** Scroll down to check for the "Create additional diagnostic report" section.
   **Expect:** The "Create additional diagnostic report" section is NOT visible (or the "Create Report" button is disabled and the dropdown is empty/shows no options).
   **Record through:** yes
   **Still after:** optional

### Success looks like

- After creating all 3 reports (one for each code), the create form disappears or is disabled
- No option to create a 4th report is available
- The UI clearly indicates all codes have been used

---

## AC #4 & #7 — All created reports are visible with observations and conclusions

### Research map

- Same as AC #1

### Prerequisites

- Same as AC #1, continuing from AC #3 (all 3 reports created)

### Data setup

- Use the Service Request from AC #3 (already has 3 diagnostic reports created)
- Optionally add observations and conclusions to the reports via UI or API

### Steps

1. **Action:** On the Service Request detail page, expand the "Test Results Entry" section (if collapsed).
   **Expect:** Multiple diagnostic report cards are visible, each showing:
   - The report code and display name (e.g., "Complete blood count (58410-2)")
   - The report status badge (e.g., "Preliminary")
   - If conclusions/observations exist, a summary or count
     **Record through:** yes
     **Still after:** optional

2. **Action:** Count the number of diagnostic report cards visible in the "Test Results Entry" section.
   **Expect:** There are 3 separate cards/sections visible, one for each created report:
   - Report 1: "Complete blood count (58410-2)"
   - Report 2: "CBC W Auto Differential panel (57021-8)"
   - Report 3: "Auto Differential panel (57023-4)"
     **Record through:** yes
     **Still after:** optional

3. **Action:** If observations were added to any of the reports, verify they are displayed under the respective report card.
   **Expect:** Each report shows its own observations independently; observations from one report do not appear under another report.
   **Record through:** yes
   **Still after:** optional

4. **Action:** If conclusions were added to any of the reports, verify they are displayed under the respective report card.
   **Expect:** Each report shows its own conclusion independently.
   **Record through:** yes
   **Still after:** optional

### Success looks like

- All 3 diagnostic reports are visible in the UI
- Each report is displayed as a separate card or section
- Observations and conclusions are correctly associated with their respective reports
- No reports are hidden or missing

---

## AC #5 — Behavior unchanged when no diagnostic report codes defined

### Research map

- Same as AC #1

### Prerequisites

- User logged in with admin credentials (tests/.auth/user.json)
- Backend running with fixtures

### Data setup

- Create an Activity Definition WITHOUT diagnostic report codes:
  1. Go to `/facility/{facilityId}/settings/activity_definitions`
  2. Click "Create Activity Definition"
  3. Fill fields:
     - Title: `qa-no-diag-codes-${Date.now()}`
     - Status: Active
     - Classification: Laboratory
     - Kind: Service Request
     - Code: code "GENERIC", display "Generic Test", system "http://loinc.org"
  4. Leave "Diagnostic Report Codes" section empty (do not add any codes)
  5. Save
- Create a Service Request using this Activity Definition:
  1. Go to encounter → Service Requests tab → Create Service Request
  2. Select the new Activity Definition (no codes)
  3. Create the Service Request
- Verify: Navigate to the Service Request detail page

### Steps

1. **Action:** Expand the "Test Results Entry" section.
   **Expect:** The section shows "No test results recorded" and a "Create Report" button. No dropdown for "Select Diagnostic Report Type" is visible (since no codes are defined).
   **Record through:** yes
   **Still after:** optional

2. **Action:** Click "Create Report" button.
   **Expect:** Toast notification "Diagnostic report created successfully" appears. The observation entry form is shown (if observation definitions exist on the Activity Definition).
   **Record through:** yes
   **Still after:** optional

3. **Action:** Check if the "Create additional diagnostic report" section appears after the first report is created.
   **Expect:** The section does NOT appear (since no codes are defined, only 1 report can be created — the current behavior).
   **Record through:** yes
   **Still after:** optional

### Success looks like

- Behavior is unchanged from the original implementation when no diagnostic report codes are defined
- Only 1 report can be created
- No dropdown or additional create form is shown

---

## AC #6 — Remaining codes persist after page refresh

### Research map

- Same as AC #1

### Prerequisites

- Same as AC #1, with a Service Request that has 2 of 3 reports created (from AC #2)

### Data setup

- Use the Service Request from AC #2 (2 reports created, 1 code remaining)

### Steps

1. **Action:** On the Service Request detail page (with 2 reports created and 1 code remaining), note the remaining code in the "Create additional diagnostic report" dropdown (e.g., "Auto Differential panel (57023-4)").
   **Expect:** The dropdown shows only 1 remaining code.
   **Record through:** yes
   **Still after:** optional

2. **Action:** Refresh the browser page (F5 or Ctrl+R).
   **Expect:** The page reloads. After the page loads, the "Test Results Entry" section shows the 2 existing reports, and the "Create additional diagnostic report" section is still visible.
   **Record through:** yes
   **Still after:** optional

3. **Action:** Click the dropdown in the "Create additional diagnostic report" section.
   **Expect:** The dropdown still shows only the 1 remaining unused code ("Auto Differential panel (57023-4)"). The 2 used codes are NOT in the list.
   **Record through:** yes
   **Still after:** optional

### Success looks like

- After page refresh, the state is correctly preserved
- Used codes remain filtered out
- Only the unused code is shown in the dropdown
- No regression in filtering logic

---

## Test plan / notes

- Playwright E2E tests should cover:
  - Creating an Activity Definition with multiple diagnostic report codes
  - Creating a Service Request with that Activity Definition
  - Creating multiple diagnostic reports sequentially
  - Verifying dropdown filtering after each report creation
  - Verifying all reports are displayed in the UI
  - Verifying the create button is disabled when all codes are used
  - Testing the edge case of no diagnostic report codes (AC #5)
  - Testing page refresh persistence (AC #6)
- CI must pass (lint, type-check, build)
- Manual browser testing on Chrome/Firefox/Safari recommended for complex UI interactions
- Test with different numbers of diagnostic report codes (1, 2, 5) to ensure scalability
