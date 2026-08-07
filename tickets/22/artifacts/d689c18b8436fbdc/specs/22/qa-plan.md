# QA Plan: Support for creating multiple diagnostic reports for SR

## AC1 — Codes dropdown shows all available codes when no reports exist

### Research map

- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/patient/:patientId/encounter/:encounterId/service_requests`
- components: `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx` (lines 145-152: availableCodes calculation, 1270-1298: codes dropdown)
- i18n labels: "Select Diagnostic Report Type", "Create Report"
- auth/role: `tests/.auth/user.json` (admin/admin)
- permissions / facility-scoped: yes (facility context required)
- fixtures needed: facility, patient, encounter from load-fixtures; Activity Definition with 2+ diagnostic report codes; Service Request created from that AD

### Prerequisites

- Backend running on port 9000
- load-fixtures executed (provides facility, patient, encounter)
- Facility context active

### Data setup

- Prefer fixtures: load-fixtures provides facility (from `getFacilityId()`), patient (from `getPatientId()`), encounter (from `getEncounterId()`). No Activity Definition with multiple diagnostic report codes exists in fixtures.
- Provenance: LOINC codes from `tests/admin/valueset/valuesetConstants.ts` (lines 27-38): "2339-0" (Glucose), "718-7" (Hemoglobin), "789-8" (Erythrocytes). Activity Definition structure from `src/types/emr/activityDefinition/activityDefinition.ts` (line 49: diagnostic_report_codes array). Specimen requirement from test helper `tests/facility/settings/activityDefinition/activityDefinition.ts`.
- UI recipe:
  1. Go to `/facility/{facilityId}/settings/activity_definitions` where `{facilityId}` is from load-fixtures (stored in `tests/support/facilityId.ts`)
  2. Click "Create" button
  3. Fill title: `qa-ad-22-multi-${Date.now()}`
  4. Fill slug: `qa-ad-22-multi-${Date.now()}`
  5. Select status: "Active"
  6. Select classification: "Laboratory"
  7. Add specimen requirement: Click "Add Specimen", search for and select "Venous blood specimen" (SNOMED 122555007)
  8. Add first diagnostic report code: Click combobox labeled "Search for Diagnostic Report Codes", type "Glucose", select "Glucose [Mass/volume] in Blood (2339-0)" from LOINC valueset
  9. Add second diagnostic report code: Click "Add another code" button (appears after first code is selected), use the new code picker that appears, type "Hemoglobin", select "Hemoglobin [Mass/volume] in Blood (718-7)" from LOINC valueset
  10. Add third diagnostic report code: Click "Add another code" button again, use the third code picker, type "Erythrocytes", select "Erythrocytes [#/volume] in Blood (789-8)" from LOINC valueset
  11. Click "Create" button
  12. Verify the new Activity Definition appears in the list with title visible
- Entity chain: Activity Definition → verify list → Service Request → verify detail view shows diagnostic report section
- API seed alternative (if UI add-multiple-codes flow is blocked):
  - POST `/api/v1/facility/{facilityId}/activity_definition/`
    (path from `src/types/emr/activityDefinition/activityDefinitionApi.ts` line 10)
  - Auth: `getApiUrl()` + `getApiHeaders()` from `tests/helper/utils.ts` + credential from `tests/setup/auth.setup.ts` (admin/admin)
  - Body (adapted from Activity Definition type structure):
    ```json
    {
      "title": "qa-ad-22-multi-{timestamp}",
      "slug": "qa-ad-22-multi-{timestamp}",
      "status": "active",
      "classification": "laboratory",
      "specimen_requirements": [
        {
          "type_collected": {
            "code": "122555007",
            "display": "Venous blood specimen",
            "system": "http://snomed.info/sct"
          }
        }
      ],
      "diagnostic_report_codes": [
        {
          "code": "2339-0",
          "display": "Glucose [Mass/volume] in Blood",
          "system": "http://loinc.org"
        },
        {
          "code": "718-7",
          "display": "Hemoglobin [Mass/volume] in Blood",
          "system": "http://loinc.org"
        },
        {
          "code": "789-8",
          "display": "Erythrocytes [#/volume] in Blood",
          "system": "http://loinc.org"
        }
      ]
    }
    ```
- Create Service Request from the Activity Definition:
  1. Go to `/facility/{facilityId}/patient/{patientId}/encounter/{encounterId}/service_requests`
  2. Click "Create Service Request" button
  3. In the Activity Definition picker, navigate categories: "Lab Tests"
  4. Search for and select the Activity Definition created above (by title)
  5. Expand the Service Request card
  6. Select Priority: "Routine"
  7. Click "Submit" button
  8. Verify toast: "Questionnaire submitted successfully"
  9. Navigate to "Service Requests" tab
  10. Click "See Details" on the newly created Service Request row
- Verify: Before scoring AC1, confirm the Service Request detail view shows the "Select Diagnostic Report Type" dropdown (specimen collection may be required first — see Steps below)

### Steps

1. **Action:** On the Service Request detail view, if a "Collect Specimen" button is visible, click it. Fill specimen collection form (Value: "1", Notes: "Test specimen"), click "Collect" button. Verify toast "Specimen collected".
   **Expect:** The diagnostic report creation section appears below the specimen section.
   **Record through:** yes

2. **Action:** Locate the combobox labeled "Select Diagnostic Report Type".
   **Expect:** The combobox is visible and enabled.
   **Record through:** yes

3. **Action:** Click the "Select Diagnostic Report Type" combobox.
   **Expect:** A dropdown menu opens showing all three diagnostic report codes: "Glucose [Mass/volume] in Blood (2339-0)", "Hemoglobin [Mass/volume] in Blood (718-7)", and "Erythrocytes [#/volume] in Blood (789-8)".
   **Record through:** yes

### Success looks like

- The codes dropdown displays all 3 LOINC codes from the Activity Definition when no diagnostic reports exist yet
- All codes are selectable

---

## AC2 — First diagnostic report is created and displayed

### Research map

- (same as AC1)

### Prerequisites

- (same as AC1, continuing from AC1 Steps)

### Data setup

- (same Activity Definition and Service Request from AC1)

### Steps

1. **Action:** In the "Select Diagnostic Report Type" dropdown, select "Glucose [Mass/volume] in Blood (2339-0)".
   **Expect:** The selected code appears in the combobox.
   **Record through:** yes

2. **Action:** Click the "Create Report" button.
   **Expect:** Toast notification "Diagnostic report created successfully" appears. The diagnostic report form expands showing observations section, conclusion field, and file upload section.
   **Record through:** yes

3. **Action:** Scroll to view the diagnostic report header.
   **Expect:** The header shows "Glucose [Mass/volume] in Blood (2339-0)" with status badge "Preliminary".
   **Record through:** yes

### Success looks like

- Diagnostic report is created with the selected code
- Report is displayed with its observations, conclusion, and attachments sections
- Status is "Preliminary"

---

## AC3 — "Create another report" affordance appears after first report

### Research map

- (same as AC1)
- Key component: `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx` lines 1262-1300 (canCreateMoreReports check and "Create another report" section)

### Prerequisites

- (same as AC1, continuing from AC2 Steps)

### Data setup

- (Activity Definition and Service Request from AC1, with first diagnostic report created in AC2)

### Steps

1. **Action:** Scroll down below the diagnostic report form to the end of the page.
   **Expect:** A section with gray background appears containing text "Create another diagnostic report for a different test type" and another "Select Diagnostic Report Type" combobox.
   **Record through:** yes

2. **Action:** Verify the section heading.
   **Expect:** The text "Create another diagnostic report for a different test type" is visible (i18n key: `create_another_diagnostic_report`).
   **Record through:** yes

### Success looks like

- "Create another report" section is visible below the existing diagnostic report
- Section contains a new code selector and creation affordance

---

## AC4 — Codes dropdown shows only unused codes

### Research map

- (same as AC1)
- Logic: `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx` lines 145-152 (usedCodes Set filters out already-created report codes)

### Prerequisites

- (same as AC1, continuing from AC3 Steps)

### Data setup

- (Activity Definition and Service Request from AC1, with first diagnostic report for Glucose created in AC2)

### Steps

1. **Action:** In the "Create another report" section, click the "Select Diagnostic Report Type" combobox.
   **Expect:** The dropdown opens showing only two codes: "Hemoglobin [Mass/volume] in Blood (718-7)" and "Erythrocytes [#/volume] in Blood (789-8)". The Glucose code is NOT present.
   **Record through:** yes

2. **Action:** Select "Hemoglobin [Mass/volume] in Blood (718-7)".
   **Expect:** The code is selected in the combobox.
   **Record through:** yes

3. **Action:** Click the "Create Report" button in the "Create another report" section.
   **Expect:** Toast "Diagnostic report created successfully". A second diagnostic report section appears above the "Create another report" section, showing "Hemoglobin [Mass/volume] in Blood (718-7)" with status "Preliminary".
   **Record through:** yes

4. **Action:** Scroll down to the "Create another report" section. Click the "Select Diagnostic Report Type" combobox again.
   **Expect:** The dropdown now shows only one code: "Erythrocytes [#/volume] in Blood (789-8)". The Glucose and Hemoglobin codes are NOT present.
   **Record through:** yes

### Success looks like

- After creating the first report (Glucose), only Hemoglobin and Erythrocytes appear in the dropdown
- After creating the second report (Hemoglobin), only Erythrocytes appears in the dropdown
- Already-used codes are filtered out

---

## AC5 — "Create report" affordance is hidden when all codes are used

### Research map

- (same as AC1)
- Logic: `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx` line 153 (canCreateMoreReports = availableCodes.length > 0), line 1262 (conditional rendering)

### Prerequisites

- (same as AC1, continuing from AC4 Steps)

### Data setup

- (Activity Definition with 3 diagnostic report codes, Service Request with 2 diagnostic reports already created for Glucose and Hemoglobin)

### Steps

1. **Action:** In the "Create another report" section, select "Erythrocytes [#/volume] in Blood (789-8)" from the dropdown.
   **Expect:** The code is selected.
   **Record through:** yes

2. **Action:** Click the "Create Report" button.
   **Expect:** Toast "Diagnostic report created successfully". A third diagnostic report section appears for "Erythrocytes [#/volume] in Blood (789-8)" with status "Preliminary".
   **Record through:** yes

3. **Action:** Scroll down to where the "Create another report" section was previously located.
   **Expect:** The "Create another report" section is NO LONGER visible. There are now three diagnostic report sections (Glucose, Hemoglobin, Erythrocytes) but no affordance to create more.
   **Record through:** yes

4. **Action:** Scroll through the entire Service Request detail page.
   **Expect:** No "Select Diagnostic Report Type" combobox or "Create Report" button appears anywhere below the three diagnostic reports.
   **Record through:** yes

### Success looks like

- After creating reports for all 3 codes (Glucose, Hemoglobin, Erythrocytes), the "Create another report" section disappears
- No UI affordance to create additional reports is visible

---

## AC6 — Each report displays its own data independently

### Research map

- (same as AC1)
- Multiple reports rendering: `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx` lines 215-218 (activeReportId state), 140-142 (activeReport selection), 1262+ (multiple report cards)

### Prerequisites

- (same as AC1, continuing from AC5 Steps)

### Data setup

- (Service Request with 3 diagnostic reports: Glucose, Hemoglobin, Erythrocytes)

### Steps

1. **Action:** In the Glucose diagnostic report section, find the first observation input field labeled "Result value". Fill it with "95".
   **Expect:** The input shows "95".
   **Record through:** yes

2. **Action:** Scroll to the conclusion textarea in the Glucose report section. Fill it with "Glucose level normal".
   **Expect:** The textarea shows "Glucose level normal".
   **Record through:** yes

3. **Action:** Click the "Save Results" button in the Glucose report section.
   **Expect:** Toast "Test results saved successfully".
   **Record through:** yes

4. **Action:** Scroll to the Hemoglobin diagnostic report section header and click it to expand/collapse if needed.
   **Expect:** The Hemoglobin report expands, showing its own observation fields and conclusion textarea (empty/different from Glucose report).
   **Record through:** yes

5. **Action:** In the Hemoglobin report, fill the first observation "Result value" with "14" and conclusion with "Hemoglobin within range".
   **Expect:** The fields show "14" and "Hemoglobin within range".
   **Record through:** yes

6. **Action:** Click "Save Results" in the Hemoglobin report section.
   **Expect:** Toast "Test results saved successfully".
   **Record through:** yes

7. **Action:** Scroll back to the Glucose report section. Expand it if collapsed.
   **Expect:** Glucose report still shows "95" in result value and "Glucose level normal" in conclusion. The Hemoglobin data does NOT appear here.
   **Record through:** yes

8. **Action:** Scroll back to the Hemoglobin report section. Expand it if collapsed.
   **Expect:** Hemoglobin report still shows "14" in result value and "Hemoglobin within range" in conclusion. The Glucose data does NOT appear here.
   **Record through:** yes

### Success looks like

- Each diagnostic report maintains its own observations, conclusion, and attachments
- Data entered in one report does not affect or appear in another report
- Collapsing/expanding reports does not lose data

---

## AC7 — Changes to one report do not affect others

### Research map

- (same as AC1)
- State management: `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx` lines 105-137 (observations state keyed by definitionId and indexed by observation), 228-265 (upsertObservations mutation per active report)

### Prerequisites

- (same as AC1, continuing from AC6 Steps)

### Data setup

- (Service Request with 3 diagnostic reports: Glucose with "95" and "Glucose level normal", Hemoglobin with "14" and "Hemoglobin within range", Erythrocytes empty)

### Steps

1. **Action:** In the Glucose report section, change the result value from "95" to "110".
   **Expect:** The input shows "110".
   **Record through:** yes

2. **Action:** Click "Save Results" in the Glucose report section.
   **Expect:** Toast "Test results saved successfully".
   **Record through:** yes

3. **Action:** Refresh the page (F5 or browser refresh button).
   **Expect:** Page reloads. The Service Request detail view appears with the three diagnostic reports.
   **Record through:** yes

4. **Action:** Expand the Glucose report section. Check the result value.
   **Expect:** The result value shows "110" (the updated value).
   **Record through:** yes

5. **Action:** Expand the Hemoglobin report section. Check the result value.
   **Expect:** The result value still shows "14" (unchanged from AC6).
   **Record through:** yes

6. **Action:** Expand the Erythrocytes report section. Check the observation fields.
   **Expect:** The observation fields are empty (no data was entered for this report).
   **Record through:** yes

7. **Action:** In the Erythrocytes report, fill the first observation "Result value" with "5.2" and conclusion with "Erythrocyte count normal".
   **Expect:** The fields show "5.2" and "Erythrocyte count normal".
   **Record through:** yes

8. **Action:** Click "Save Results" in the Erythrocytes report section.
   **Expect:** Toast "Test results saved successfully".
   **Record through:** yes

9. **Action:** Scroll back to the Glucose report section. Verify result value and conclusion.
   **Expect:** Glucose report still shows "110" and "Glucose level normal" (unchanged by Erythrocytes save).
   **Record through:** yes

10. **Action:** Scroll back to the Hemoglobin report section. Verify result value and conclusion.
    **Expect:** Hemoglobin report still shows "14" and "Hemoglobin within range" (unchanged by Erythrocytes save).
    **Record through:** yes

### Success looks like

- Editing and saving observations in one diagnostic report does not change the observations in other reports
- Each report's data persists independently across page refreshes
- All three reports maintain their distinct observation values and conclusions

---

## Test plan / notes

### Playwright E2E coverage

- The existing test suite in `tests/facility/patient/encounter/serviceRequests/ServiceRequestCreate.spec.ts` covers single diagnostic report creation (lines 188-276).
- A new test should be added to cover multiple diagnostic report creation:
  1. Create an Activity Definition with 2+ diagnostic report codes (via API seed as the UI helper only supports one code)
  2. Create a Service Request from that Activity Definition
  3. Collect specimen
  4. Create first diagnostic report with code A
  5. Verify "Create another report" section appears
  6. Verify codes dropdown shows only unused codes (B, C)
  7. Create second diagnostic report with code B
  8. Verify codes dropdown now shows only unused code (C)
  9. Create third diagnostic report with code C
  10. Verify "Create another report" section is hidden
  11. Fill observations in each report with distinct values
  12. Save each report
  13. Refresh and verify each report maintains its own data

### CI expectations

- All existing Playwright tests must pass
- No lint errors from `npm run lint`
- Build must complete successfully with `npm run build`
- Type checking must pass with `npx tsc --noEmit`

### Known limitations

- The existing test helper `tests/facility/settings/activityDefinition/activityDefinition.ts:createActivityDefinition` only supports adding one diagnostic report code (lines 238-243). Multi-code Activity Definitions must be created via API seed for E2E tests until the helper is extended.
