# QA Plan: Support Multiple Diagnostic Reports per Service Request

## AC1 — All codes available initially

### Research map

- routes: `src/Routers/routes/ServiceRequestRoutes.tsx` → `/facility/:facilityId/patient/:patientId/encounter/:encounterId/service_requests/:serviceRequestId`
- components: `src/pages/Facility/services/serviceRequests/ServiceRequestShow.tsx`, `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx`
- i18n labels: "Select Diagnostic Report Type", "Create Report", "Diagnostic Report Created Successfully"
- auth/role: tests/.auth/user.json (admin role)
- permissions: facility-scoped
- fixtures needed: facility, patient, encounter, service request with activity definition containing 3+ diagnostic report codes

### Prerequisites

- Backend running on http://localhost:9000
- Fixtures loaded via `load_fixtures`
- Activity Definition with 3+ diagnostic report codes must exist
- Service Request created from that Activity Definition

### Data setup

- Prefer fixtures: load-fixtures provides facility, patient, encounter but no Activity Definition with multiple diagnostic report codes
- API seed (UI graph is deep — multiple settings pages):
  - POST `/api/v1/facility/{facilityId}/activity_definition/` (from `src/types/emr/activityDefinition/activityDefinitionApi.ts`)
  - Auth: `getApiUrl()` + `getApiHeaders()` from `tests/helper/utils.ts` + `tests/.auth/user.json`
  - Body: Use valueset expansion API to obtain valid codes:
    - POST `/api/v1/valueset/activity-definition-procedure-code/expand/` with `{"search": "laboratory", "count": 20}` to get procedure code
    - POST `/api/v1/valueset/system-observation/expand/` with `{"search": "blood", "count": 20}` to get 3+ diagnostic report codes
  - Minimal create fields: `slug_value` (unique), `title`, `status: "active"`, `classification: "laboratory"`, `kind: "service_request"`, `code` (procedure), `diagnostic_report_codes` (array of 3+ codes)
  - Then POST `/api/v1/facility/{facilityId}/service_request/apply_activity_definition/` with:
    - `encounter`: encounterId
    - `activity_definition`: activityDefinitionSlug
    - `service_request: { priority: "routine" }`
- Verify: open Service Request detail URL and confirm dropdown is visible with 3+ codes before scoring

### Steps

1. **Action:** Open the seeded Service Request detail page at `/facility/{facilityId}/patient/{patientId}/encounter/{encounterId}/service_requests/{serviceRequestId}`
   **Expect:** Page loads showing Service Request details with diagnostic report creation form visible
   **Record through:** yes

2. **Action:** Locate the "Select Diagnostic Report Type" dropdown in the diagnostic report creation section
   **Expect:** Dropdown is present and enabled (after specimens are collected if required by AD)
   **Record through:** yes

3. **Action:** Click the dropdown to open it
   **Expect:** All 3 diagnostic report codes from the Activity Definition are listed as options (format: "Display Name (CODE)")
   **Record through:** yes

### Success looks like

- Dropdown shows exactly 3 diagnostic report codes matching those in the Activity Definition
- Each code displays with format: "Display Name (CODE)"
- All codes are selectable

---

## AC2 — Code removed after creation

### Research map

- Same as AC1

### Prerequisites

- Continuation from AC1 (Service Request with 3 unused codes, dropdown open)
- At least one specimen collected (if required by Activity Definition)

### Data setup

- Use Service Request from AC1 setup
- If specimen collection is required:
  - Navigate to specimen section in Service Request page
  - Create specimen via UI or API POST `/api/v1/facility/{facilityId}/specimen/` with fields: `encounter`, `specimen_definition`, `status: "collected"`

### Steps

1. **Action:** Select the first code from the dropdown (e.g., first code alphabetically or by position)
   **Expect:** Selected code appears in the dropdown field
   **Record through:** yes

2. **Action:** Click "Create Report" button
   **Expect:** Toast notification "Diagnostic Report Created Successfully" appears; form remains visible
   **Record through:** yes

3. **Action:** Wait 2 seconds for cache invalidation, then click the dropdown again
   **Expect:** Dropdown opens showing only 2 remaining codes (the code used in step 1 is no longer present)
   **Record through:** yes

### Success looks like

- First report created successfully (toast confirmation)
- Dropdown immediately updates to show 2 remaining codes
- Previously selected code no longer appears in dropdown
- No page reload required

---

## AC3 — No reload required for subsequent reports

### Research map

- Same as AC1

### Prerequisites

- Continuation from AC2 (Service Request with 1 report created, 2 unused codes)

### Data setup

- Use Service Request from AC2 (already has 1 diagnostic report)

### Steps

1. **Action:** Without reloading the page, open the diagnostic report codes dropdown
   **Expect:** Dropdown shows 2 remaining codes (from AC2 verification)
   **Record through:** yes

2. **Action:** Select the second code from the dropdown
   **Expect:** Selected code appears in the dropdown field
   **Record through:** yes

3. **Action:** Click "Create Report" button
   **Expect:** Toast notification appears; form remains visible
   **Record through:** yes

4. **Action:** Wait 2 seconds, then click the dropdown again
   **Expect:** Dropdown opens showing only 1 remaining code
   **Record through:** yes

### Success looks like

- Second report created without page reload
- Dropdown updates to show 1 remaining code
- Smooth workflow with immediate cache updates

---

## AC4 — Form hidden when all codes used

### Research map

- Same as AC1

### Prerequisites

- Continuation from AC3 (Service Request with 2 reports created, 1 unused code)

### Data setup

- Use Service Request from AC3 (already has 2 diagnostic reports, 1 code remaining)

### Steps

1. **Action:** Open the diagnostic report codes dropdown
   **Expect:** Dropdown shows exactly 1 code
   **Record through:** yes

2. **Action:** Select the third and final code from the dropdown
   **Expect:** Selected code appears in the dropdown field
   **Record through:** yes

3. **Action:** Click "Create Report" button
   **Expect:** Toast notification appears; diagnostic report creation form disappears from the page
   **Record through:** yes

4. **Action:** Scroll through the Service Request page
   **Expect:** No diagnostic report creation form is visible; only existing reports are shown
   **Record through:** yes

### Success looks like

- Third report created successfully
- Diagnostic report creation form completely hidden
- Service Request page shows only the 3 existing diagnostic reports
- No dropdown or "Create Report" button visible

---

## AC5 — Persistence across reload

### Research map

- Same as AC1

### Prerequisites

- Continuation from AC4 (Service Request with all 3 codes used, form hidden)

### Data setup

- Use Service Request from AC4 (already has 3 diagnostic reports using all AD codes)

### Steps

1. **Action:** Refresh the Service Request detail page (F5 or browser refresh)
   **Expect:** Page reloads; Service Request details appear
   **Record through:** yes

2. **Action:** Scroll through the entire Service Request page looking for the diagnostic report creation form
   **Expect:** No diagnostic report creation form is visible; form remains hidden
   **Record through:** yes

3. **Action:** Verify that all 3 diagnostic reports are listed in the page
   **Expect:** All 3 created diagnostic reports are visible with their respective codes
   **Record through:** yes

### Success looks like

- Form remains hidden after page reload
- All 3 diagnostic reports persist and are visible
- No dropdown or "Create Report" button appears
- State persists correctly from backend data

---

## AC6 — N reports for N codes (distinct codes)

### Research map

- Same as AC1

### Prerequisites

- Service Request from AC5 (has all 3 reports created)

### Data setup

- Use Service Request from AC5 setup

### Steps

1. **Action:** Examine each of the 3 diagnostic reports on the page
   **Expect:** Each report displays a different diagnostic report code
   **Record through:** yes

2. **Action:** Verify that each report's code matches one of the 3 codes originally defined in the Activity Definition
   **Expect:** All 3 reports show distinct codes from the AD's diagnostic_report_codes
   **Record through:** yes

### Success looks like

- 3 diagnostic reports exist
- Each report has a unique code (no duplicates)
- All codes match the Activity Definition's diagnostic_report_codes

---

## AC7 — Only unused codes after reload with partial usage

### Research map

- Same as AC1

### Prerequisites

- New Service Request with 3+ diagnostic report codes (reuse seed setup from AC1)
- Create only 1 diagnostic report (not all codes used)

### Data setup

- Create new Service Request using same API seed approach from AC1
- OR reuse existing Service Request if available and create only 1 report via UI

### Steps

1. **Action:** Create a Service Request with 3 diagnostic report codes and create 1 diagnostic report using the first code (repeat AC1 setup and AC2 steps 1-2)
   **Expect:** 1 report created successfully
   **Record through:** no (setup only)

2. **Action:** Reload the Service Request detail page (F5)
   **Expect:** Page reloads; diagnostic report creation form is visible
   **Record through:** yes

3. **Action:** Open the diagnostic report codes dropdown
   **Expect:** Dropdown shows only 2 remaining codes (the 2 codes not used in the existing report)
   **Record through:** yes

4. **Action:** Verify that the code used in the existing report is not present in the dropdown
   **Expect:** Used code is absent; only 2 unused codes are available
   **Record through:** yes

### Success looks like

- After reload, form remains visible (not all codes used)
- Dropdown shows only unused codes (2 out of 3)
- Used code filtered out correctly
- State persists from backend across page refresh

---

## Test plan / notes

- Playwright E2E test suite should cover the complete flow: seed → create 3 reports → verify form hides → reload → verify state persists
- CI must pass with no lint or type errors
- Manual testing: verify no console errors during diagnostic report creation workflow
- Edge case testing: verify behavior when Activity Definition has no diagnostic_report_codes defined (form should still allow report creation, no dropdown)
