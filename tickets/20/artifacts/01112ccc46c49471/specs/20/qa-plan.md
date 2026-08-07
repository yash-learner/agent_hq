# QA Plan — Ticket 20: Multiple Diagnostic Reports per Service Request

This plan verifies that multiple diagnostic reports can be created for a Service Request when the Activity Definition defines multiple diagnostic report codes, with the frontend correctly filtering used codes after each report creation.

## Criterion 1 — All AD codes appear in dropdown initially

### Research map

- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/service_requests/:serviceRequestId`
- components: `src/pages/Facility/services/serviceRequests/ServiceRequestShow.tsx` (lines 612-626), `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx` (lines 1243-1289)
- i18n labels: "Select Diagnostic Report Type" (`select_diagnostic_report_type`)
- auth/role: `tests/.auth/user.json` (admin user with full permissions)
- permissions: facility-scoped (yes)
- fixtures needed: facility, patient, encounter, Service Request with Activity Definition containing 3+ diagnostic report codes

### Prerequisites

- Backend running on http://localhost:9000
- Authenticated as admin user (from fixtures: username `admin`, password `admin`)
- Facility context active (facilityId from `tests/.auth/facilityMeta.json`)
- Patient and encounter exist (from fixtures: patientId, encounterId from support files)

### Data setup

- Prefer fixtures: `load_fixtures` provides facility, patient, encounter but no Activity Definition with multiple diagnostic report codes or Service Request using such an AD.
- API seed (required — UI graph is deep: AD creation requires facility settings navigation, code picker interactions, then SR creation from encounter):
  - Auth: `getApiUrl()` + `getApiHeaders()` from `tests/helper/utils.ts` + `tests/.auth/user.json`
  - Step 1: Obtain valid codes via valueset expansion (never hardcode LOINC codes):
    ```
    POST {baseUrl}/api/v1/valueset/activity-definition-procedure-code/expand/
    Body: {"search": "laboratory", "count": 20}
    (from verbatim path in backend valueset API)
    → Extract 1 procedure code for AD.code

    POST {baseUrl}/api/v1/valueset/system-observation/expand/
    Body: {"search": "blood", "count": 20}
    (repeat with "panel", "serum" if needed for 3 codes)
    → Extract 3 diagnostic report codes for AD.diagnostic_report_codes
    ```
  - Step 2: Create Activity Definition:
    ```
    POST /api/v1/facility/{facilityId}/activity_definition/
    (verbatim from src/types/emr/activityDefinition/activityDefinitionApi.ts)
    Body: {
      "slug_value": "qa-multi-diagnostic-{timestamp}",
      "title": "QA Multi Diagnostic Reports {timestamp}",
      "status": "active",
      "classification": "laboratory",
      "kind": "service_request",
      "code": {<procedure code from step 1>},
      "diagnostic_report_codes": [{<3 codes from step 1>}],
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
    → Save activityDefinitionSlug from response
    ```
  - Step 3: Create Service Request from AD:
    ```
    POST /api/v1/facility/{facilityId}/service_request/apply_activity_definition/
    (verbatim from src/types/emr/serviceRequest/serviceRequestApi.ts)
    Body: {
      "encounter": "{encounterId}",
      "activity_definition": "{activityDefinitionSlug}",
      "service_request": {
        "priority": "routine"
      }
    }
    → Save serviceRequestId from response
    ```
  - Verify setup: Open `/facility/{facilityId}/service_requests/{serviceRequestId}` and confirm the page loads and shows the SR details before scoring the criterion.

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/service_requests/{serviceRequestId}` using the serviceRequestId from data setup.
   **Expect:** Service Request details page loads. The diagnostic report creation section is visible with a dropdown labeled "Select Diagnostic Report Type".
   **Record through:** yes

2. **Action:** Click the diagnostic report type dropdown.
   **Expect:** Dropdown opens and shows all 3 diagnostic report codes from the Activity Definition (each as `{display} ({code})`).
   **Record through:** yes

### Success looks like

- Dropdown displays 3 selectable options matching the diagnostic report codes defined in the Activity Definition.
- No reports exist yet for this SR.

---

## Criterion 2 — Code removed from dropdown after first report creation

### Research map

- routes: same as Criterion 1
- components: same as Criterion 1, plus mutation handling in `DiagnosticReportForm.tsx`
- i18n labels: "Select Diagnostic Report Type", "Create New Report" button
- auth/role: `tests/.auth/user.json`
- permissions: facility-scoped (yes)
- fixtures needed: same SR from Criterion 1 with no reports yet

### Prerequisites

- Continuation from Criterion 1 (same SR, no page reload)
- SR has Activity Definition with 3 diagnostic report codes
- No reports created yet

### Data setup

- Reuse the SR created in Criterion 1's data setup. No additional data needed.

### Steps

1. **Action:** From the diagnostic report type dropdown, select the first diagnostic report code.
   **Expect:** Dropdown closes and shows the selected code as the value.
   **Record through:** yes

2. **Action:** Click the "Create New Report" button.
   **Expect:** Success toast appears: "Diagnostic report created successfully" (`diagnostic_report_created_successfully`). The form remains visible without page reload.
   **Record through:** yes

3. **Action:** Click the diagnostic report type dropdown again (without reloading the page).
   **Expect:** Dropdown opens and shows only 2 remaining codes. The code used in step 1 is no longer present.
   **Record through:** yes

### Success looks like

- After creating the first report, the dropdown updates to show 2 remaining codes (without page reload).
- The used code is filtered out immediately.

---

## Criterion 3 — Second report creation updates dropdown again

### Research map

- routes: same as Criterion 1
- components: same as Criterion 1
- i18n labels: same as Criterion 2
- auth/role: `tests/.auth/user.json`
- permissions: facility-scoped (yes)
- fixtures needed: same SR from Criterion 2 with 1 report created

### Prerequisites

- Continuation from Criterion 2 (same SR, 1 report created, no page reload)
- Dropdown shows 2 remaining codes

### Data setup

- Reuse the SR from Criterion 2. No additional data needed.

### Steps

1. **Action:** From the diagnostic report type dropdown, select one of the 2 remaining codes.
   **Expect:** Dropdown closes and shows the selected code.
   **Record through:** yes

2. **Action:** Click the "Create New Report" button.
   **Expect:** Success toast appears: "Diagnostic report created successfully". The form remains visible without page reload.
   **Record through:** yes

3. **Action:** Click the diagnostic report type dropdown again (without reloading the page).
   **Expect:** Dropdown opens and shows only 1 remaining code. The 2 previously used codes are not present.
   **Record through:** yes

### Success looks like

- After creating the second report, the dropdown updates to show 1 remaining code (without page reload).
- The two used codes are both filtered out.

---

## Criterion 4 — No form displayed when all codes are used

### Research map

- routes: same as Criterion 1
- components: `ServiceRequestShow.tsx` (lines 612-626, form rendering condition with `hasUnusedCodes`)
- i18n labels: none (form is hidden)
- auth/role: `tests/.auth/user.json`
- permissions: facility-scoped (yes)
- fixtures needed: same SR from Criterion 3 with 2 reports created

### Prerequisites

- Continuation from Criterion 3 (same SR, 2 reports created, no page reload)
- Dropdown shows 1 remaining code

### Data setup

- Reuse the SR from Criterion 3. No additional data needed.

### Steps

1. **Action:** From the diagnostic report type dropdown, select the last remaining code.
   **Expect:** Dropdown closes and shows the selected code.
   **Record through:** yes

2. **Action:** Click the "Create New Report" button.
   **Expect:** Success toast appears: "Diagnostic report created successfully". The diagnostic report creation section (card with dropdown and button) disappears from the page.
   **Record through:** yes

3. **Action:** Inspect the page content.
   **Expect:** The diagnostic report creation form is no longer visible. The page shows the created reports in the review section, but no dropdown or "Create New Report" button is present.
   **Record through:** yes

### Success looks like

- After creating the third and final report, the creation form is hidden automatically (without page reload).
- No additional reports can be created because all AD codes are used.

---

## Criterion 5 — State persists after page reload

### Research map

- routes: same as Criterion 1
- components: same as Criterion 4
- i18n labels: none (form remains hidden)
- auth/role: `tests/.auth/user.json`
- permissions: facility-scoped (yes)
- fixtures needed: same SR from Criterion 4 with all 3 codes used

### Prerequisites

- Continuation from Criterion 4 (same SR, all 3 reports created)
- Form is hidden because all codes are used

### Data setup

- Reuse the SR from Criterion 4 with all reports created. No additional data needed.

### Steps

1. **Action:** Reload the page (F5 or browser refresh at `/facility/{facilityId}/service_requests/{serviceRequestId}`).
   **Expect:** Page reloads and displays the SR details. The diagnostic report creation form is still not visible.
   **Record through:** yes

2. **Action:** Inspect the page content.
   **Expect:** The diagnostic reports review section shows all 3 created reports (each with a different code from the AD). The creation form remains hidden.
   **Record through:** yes

### Success looks like

- After reload, the form stays hidden because the backend correctly returns all 3 reports and the frontend recalculates `hasUnusedCodes` as false.
- State (all codes used) persists across reload.

---

## Criterion 6 — Each report has a distinct code

### Research map

- routes: same as Criterion 1
- components: `DiagnosticReportReview.tsx` (displays created reports)
- i18n labels: "Diagnostic Report" (report display)
- auth/role: `tests/.auth/user.json`
- permissions: facility-scoped (yes)
- fixtures needed: same SR from Criterion 5 with all 3 reports

### Prerequisites

- Continuation from Criterion 5 (same SR, all 3 reports created, page reloaded)
- Reports are displayed in the review section

### Data setup

- Reuse the SR from Criterion 5. No additional data needed.

### Steps

1. **Action:** Inspect the diagnostic reports review section on the SR detail page.
   **Expect:** 3 diagnostic reports are listed. Each report displays a code that matches one of the 3 diagnostic report codes from the Activity Definition. No two reports share the same code.
   **Record through:** yes

### Success looks like

- Each of the 3 reports has a distinct code from the AD's `diagnostic_report_codes` list.
- No duplicate codes exist across the reports.

---

## Criterion 7 — Partial usage shows only remaining codes after reload

### Research map

- routes: same as Criterion 1
- components: same as Criterion 1
- i18n labels: same as Criterion 1
- auth/role: `tests/.auth/user.json`
- permissions: facility-scoped (yes)
- fixtures needed: new SR with AD containing 3 codes, 1 report created

### Prerequisites

- Backend running on http://localhost:9000
- Authenticated as admin user
- Facility, patient, encounter exist (from fixtures)

### Data setup

- API seed (required — same process as Criterion 1):
  - Follow the same 3-step process from Criterion 1 to create a new Activity Definition (with unique timestamp slug) and Service Request.
  - After SR creation, create 1 diagnostic report via API:
    ```
    POST /api/v1/facility/{facilityId}/diagnostic_report/
    Body: {
      "service_request": "{serviceRequestId}",
      "code": {<one of the 3 diagnostic report codes>},
      "status": "preliminary",
      ...other required fields
    }
    ```
  - Verify setup: Open the SR detail page and confirm it loads before scoring.

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/service_requests/{serviceRequestId}` (the newly created SR with 1 report already created).
   **Expect:** Page loads. The diagnostic report creation section is visible with the dropdown showing 2 remaining codes (the 2 codes not yet used).
   **Record through:** yes

2. **Action:** Click the diagnostic report type dropdown.
   **Expect:** Dropdown opens and shows only 2 codes. The code used for the existing report is not present.
   **Record through:** yes

3. **Action:** Reload the page (F5 or browser refresh).
   **Expect:** Page reloads and the diagnostic report creation section is still visible. The dropdown still shows 2 remaining codes.
   **Record through:** yes

### Success looks like

- After reload with partial usage (1 of 3 reports), the dropdown correctly shows only the 2 unused codes.
- The used code is filtered out both before and after reload.

---

## Test plan / notes

The Playwright E2E suite should include tests that:

- Verify `hasUnusedCodes` calculation logic in `ServiceRequestShow.tsx` (lines 271-281).
- Test the form rendering condition (line 612) to ensure it shows/hides based on `hasUnusedCodes`.
- Verify the dropdown filtering logic in `DiagnosticReportForm.tsx` (lines 1245-1254) correctly excludes used codes.
- Test report creation mutations and query invalidation to ensure the dropdown updates without page reload.
- Verify the backend returns all created reports in the SR detail response so the frontend can recalculate used codes on load/reload.

CI must pass all linting and build checks. The implementation does not add new dependencies or configuration changes.
