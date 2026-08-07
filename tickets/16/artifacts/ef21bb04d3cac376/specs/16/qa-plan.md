# QA Plan: Support for creating multiple diagnostic reports for SR

## AC1 — From an SR whose AD has N diagnostic report codes, the user can create up to N diagnostic reports, one per code

### Research map

- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/service_requests/:serviceRequestId`
- components:
  - `src/pages/Facility/services/serviceRequests/ServiceRequestShow.tsx`
  - `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx`
- i18n labels:
  - "Select Diagnostic Report Type"
  - "Create Report"
  - "Collect Specimen"
  - "All codes used"
  - "Test results saved successfully"
  - "Diagnostic report created successfully"
- auth/role: `tests/.auth/user.json` (admin user)
- permissions: facility-scoped (requires active facility context)
- fixtures needed: facility, patient, encounter, Activity Definition with multiple diagnostic_report_codes

### Prerequisites

- Backend running on port 9000
- Frontend built (`npm run build`) and preview server running on port 4000
- User logged in with `tests/.auth/user.json` (admin credentials)
- Active facility context

### Data setup

**Fixtures assessment:**

- Load-fixtures provides: facility (via `getFacilityId()`), patient (via `getPatientId()`), encounter (via `getEncounterId()`)
- Missing: Activity Definitions with multiple `diagnostic_report_codes` (most fixture ADs have 0 or 1 code)
- Missing: Service Requests using multi-code Activity Definitions

**UI recipe:**

1. Log in as admin user (username: `admin`, password: `admin`)
2. Navigate to `/facility/{facilityId}/settings/activity_definitions` (get facilityId from fixture meta at `tests/.auth/facilityMeta.json`)
3. Click "Create Activity Definition" button
4. Fill in the form:
   - Title: `Multi-Code Diagnostic Test QA-16-{timestamp}` (use timestamp to avoid collisions)
   - Slug: `multi-code-diagnostic-qa-16-{timestamp}`
   - Status: Select "Active"
   - Description: `Activity Definition for testing multiple diagnostic report codes`
   - Classification: Select "Laboratory"
   - Kind: "Service Request" (default)
   - Code: Search and select any LOINC code (e.g., "Blood glucose")
5. Scroll to "Diagnostic Report Codes" section
6. Click "Add Diagnostic Report Code"
7. Search for and add first code: "CBC panel" (or "Complete blood count")
8. Click "Add Diagnostic Report Code" again
9. Search for and add second code: "Lipid panel"
10. Click "Add Diagnostic Report Code" again
11. Search for and add third code: "Metabolic panel"
12. Click "Save Activity Definition"
13. Confirm the new Activity Definition appears in the list

**API seed alternative (if UI create fails or for faster setup):**

```bash
# Get auth token and API URL from tests/.auth/user.json
# Get facilityId from tests/.auth/facilityMeta.json

curl -X POST "http://localhost:9000/api/v1/facility/{facilityId}/activity_definition/" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Multi-Code Diagnostic Test QA-16-'$(date +%s)'",
    "slug_value": "multi-code-diagnostic-qa-16-'$(date +%s)'",
    "status": "active",
    "description": "Activity Definition for testing multiple diagnostic report codes",
    "classification": "laboratory",
    "kind": "service_request",
    "code": {
      "system": "http://loinc.org",
      "code": "2345-7",
      "display": "Glucose [Mass/volume] in Serum or Plasma"
    },
    "diagnostic_report_codes": [
      {
        "system": "http://loinc.org",
        "code": "58410-2",
        "display": "CBC panel - Blood by Automated count"
      },
      {
        "system": "http://loinc.org",
        "code": "24331-1",
        "display": "Lipid panel - Serum or Plasma"
      },
      {
        "system": "http://loinc.org",
        "code": "24323-8",
        "display": "Comprehensive metabolic 2000 panel - Serum or Plasma"
      }
    ],
    "body_site": null,
    "derived_from_uri": null,
    "usage": "",
    "facility": "{facilityId}",
    "specimen_requirements": [],
    "charge_item_definitions": [],
    "observation_result_requirements": [],
    "locations": [],
    "category": "{categoryId}",
    "healthcare_service": null
  }'
```

**Path reference** (from `src/types/emr/activityDefinition/activityDefinitionApi.ts`):

- Create: `POST /api/v1/facility/{facilityId}/activity_definition/`
- List: `GET /api/v1/facility/{facilityId}/activity_definition/`

**Note on category:** The category field requires a valid ResourceCategory ID. To get available categories:

```bash
curl "http://localhost:9000/api/v1/facility/{facilityId}/resource_category/" \
  -H "Authorization: Bearer {token}"
```

Pick the ID of "Lab Tests" or similar category.

**Create Service Request using the multi-code Activity Definition:**

1. Navigate to patient encounter: `/facility/{facilityId}/patient/{patientId}/encounter/{encounterId}/service_requests`
2. Click "Create Service Request"
3. In the Activity Definition picker, navigate to "Lab Tests" category
4. Search for the newly created Activity Definition by title (e.g., "Multi-Code Diagnostic Test")
5. Select it from the results
6. Expand the service request card
7. Select Priority: "Routine"
8. Click "Submit"
9. Wait for "Questionnaire submitted successfully" toast
10. Click "Service Requests" tab to view the list
11. Click "See Details" on the newly created service request row
12. Verify you land on the Service Request detail page showing the Activity Definition name

**Verify data setup:**

- Service Request detail page is loaded
- Activity Definition name is visible in the header
- "Diagnostic Reports" section exists (may be collapsed)
- "Collect Specimen" button is visible (specimen collection is required before creating reports)

### Steps

1. **Action:** On the Service Request detail page, click the "Collect Specimen" button
   **Expect:** Specimen collection modal/form appears with QR code and sample identification form
   **Record through:** yes

2. **Action:** Fill in the specimen value field with "1" and notes field with "Test specimen for QA", then click "Collect ⇧ + ENTER" button
   **Expect:** Toast appears: "Specimen collected successfully" or similar message. The specimen section updates to show "Collected" or "Available" status
   **Record through:** yes

3. **Action:** Scroll to the "Diagnostic Reports" section. Click the "Select Diagnostic Report Type" dropdown
   **Expect:** Dropdown opens showing all 3 diagnostic report codes from the Activity Definition (CBC panel, Lipid panel, Metabolic panel)
   **Record through:** yes

4. **Action:** Select the first code (CBC panel) from the dropdown
   **Expect:** The dropdown value changes to show "CBC panel - Blood by Automated count" or similar display text
   **Record through:** yes

5. **Action:** Click the "Create Report" button
   **Expect:**
   - Toast appears: "Diagnostic report created successfully"
   - A new diagnostic report card appears in the Diagnostic Reports section
   - The report card shows the selected code (CBC panel)
   - The report card expands to show observation entry form
     **Record through:** yes

6. **Action:** Scroll back to the top of the Diagnostic Reports section. Click the "Select Diagnostic Report Type" dropdown again
   **Expect:**
   - Dropdown opens showing only 2 remaining codes (Lipid panel, Metabolic panel)
   - The previously used code (CBC panel) is NOT in the dropdown list
     **Record through:** yes

7. **Action:** Select the second code (Lipid panel) from the dropdown and click "Create Report"
   **Expect:**
   - Toast appears: "Diagnostic report created successfully"
   - A second diagnostic report card appears
   - The new report card shows "Lipid panel"
     **Record through:** yes

8. **Action:** Click the "Select Diagnostic Report Type" dropdown a third time
   **Expect:**
   - Dropdown opens showing only 1 remaining code (Metabolic panel)
   - Previously used codes (CBC panel, Lipid panel) are NOT in the list
     **Record through:** yes

9. **Action:** Select the third code (Metabolic panel) and click "Create Report"
   **Expect:**
   - Toast appears: "Diagnostic report created successfully"
   - A third diagnostic report card appears
   - All three reports are now visible in the Diagnostic Reports section
     **Record through:** yes

10. **Action:** Check the "Select Diagnostic Report Type" dropdown state
    **Expect:**
    - Dropdown shows placeholder text "All codes used" instead of "Select Diagnostic Report Type"
    - Dropdown is disabled (grayed out, not clickable)
    - "Create Report" button is disabled
      **Record through:** yes

### Success looks like

- Three diagnostic report cards are visible, one for each code (CBC panel, Lipid panel, Metabolic panel)
- The diagnostic report type dropdown shows "All codes used" and is disabled
- The "Create Report" button is disabled
- URL remains at `/facility/{facilityId}/service_requests/{serviceRequestId}`
- No error messages or console errors

---

## AC2 — The codes dropdown offers a remaining (not-yet-used) code for each new report

### Research map

Same as AC1 (covered in combined testing above)

### Prerequisites

Same as AC1 (covered in combined testing above)

### Data setup

Same as AC1 (covered in combined testing above)

### Steps

**Covered in AC1 steps 6, 8** — After each report creation, the dropdown filters out used codes and shows only remaining codes.

### Success looks like

- After creating first report: dropdown shows 2 remaining codes
- After creating second report: dropdown shows 1 remaining code
- Used codes never reappear in the dropdown

---

## AC3 — Reports can be created one after another without a reload

### Research map

Same as AC1 (covered in combined testing above)

### Prerequisites

Same as AC1 (covered in combined testing above)

### Data setup

Same as AC1 (covered in combined testing above)

### Steps

**Covered in AC1 steps 5, 7, 9** — Creating three reports sequentially without page reload or navigation away from the Service Request detail page.

### Success looks like

- All three reports are created in a single page session
- No manual page refresh required between report creations
- The UI updates immediately after each "Create Report" action
- React Query automatically refetches the diagnostic reports list

---

## AC4 — Already-used codes are no longer offered

### Research map

Same as AC1 (covered in combined testing above)

### Prerequisites

Same as AC1 (covered in combined testing above)

### Data setup

Same as AC1 (covered in combined testing above)

### Steps

**Covered in AC1 steps 6, 8, 10** — Each time the dropdown is opened, previously used codes are filtered out and not displayed.

### Success looks like

- CBC panel is not shown after first report creation
- CBC panel and Lipid panel are not shown after second report creation
- Dropdown shows "All codes used" after third report creation

---

## Test plan / notes

### Playwright E2E coverage expectations

- Add E2E test file: `tests/facility/patient/encounter/serviceRequests/DiagnosticReportMultiCode.spec.ts`
- Test should:
  1. Create an Activity Definition with 3 diagnostic_report_codes via API
  2. Create a Service Request using that Activity Definition
  3. Collect specimen
  4. Create first diagnostic report and verify dropdown shows 2 remaining codes
  5. Create second diagnostic report and verify dropdown shows 1 remaining code
  6. Create third diagnostic report and verify dropdown shows "All codes used"
  7. Verify dropdown is disabled
  8. Verify "Create Report" button is disabled
- Use `faker` for generating unique slugs and titles to avoid fixture collisions
- Use `getApiUrl()` and `getApiHeaders()` from `tests/helper/utils.ts` for API seeding
- Follow pattern from `tests/facility/patient/encounter/serviceRequests/ServiceRequestCreate.spec.ts`

### CI expectations

- All existing tests must pass
- Lint and format checks must pass
- Type checking must pass
- No console errors or warnings related to diagnostic report code filtering

### Edge cases to consider (not in live QA plan)

- Service Requests with 0 diagnostic_report_codes (should show "no test results recorded" message)
- Service Requests with 1 diagnostic_report_code (should work as before, no regression)
- Navigation away and back to Service Request detail page (state should persist via React Query cache and refetch)
- Multiple users creating reports simultaneously on same SR (optimistic UI updates may cause brief inconsistency until refetch)
