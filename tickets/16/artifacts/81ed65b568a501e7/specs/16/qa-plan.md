# QA Plan: Support for creating multiple diagnostic reports for SR

## AC1 — Create first report with remaining codes available

### Research map

- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/service_requests/:serviceRequestId`
- components: `src/pages/Facility/services/serviceRequests/ServiceRequestShow.tsx`, `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx`
- i18n labels: "create_report", "select_diagnostic_report_type"
- auth/role: tests/.auth/user.json (admin)
- permissions: facility-scoped, requires service request access
- fixtures needed: facility, patient, encounter, service request with activity definition having 3+ diagnostic report codes, collected specimens

### Prerequisites

- Facility context active
- Service Request exists with Activity Definition defining 3 diagnostic report codes
- At least one specimen collected (status: available)
- No diagnostic reports created yet

### Steps

1. **Action:** Navigate to the Service Request detail page at `/facility/{facilityId}/service_requests/{serviceRequestId}`
   **Expect:** Page loads showing the Service Request with "Test Results Entry" section
   **Record through:** yes

2. **Action:** In the "Test Results Entry" section, click the diagnostic report type dropdown
   **Expect:** Dropdown shows all 3 diagnostic report codes defined in the Activity Definition
   **Record through:** yes

3. **Action:** Select the first diagnostic report code from the dropdown
   **Expect:** The dropdown shows the selected code
   **Record through:** yes

4. **Action:** Click "Create Report" button
   **Expect:** Success toast "Diagnostic report created successfully" appears, report section expands showing observation entry fields
   **Record through:** yes

5. **Action:** Scroll to the "Test Results Entry" section (below the newly created report section)
   **Expect:** The dropdown now shows only 2 remaining codes (the first code is no longer in the list), and the dropdown placeholder says "Select diagnostic report type"
   **Record through:** yes

### Success looks like

- After creating the first report, the dropdown offers only the 2 remaining unused codes
- The used code is removed from the dropdown
- No page reload required between viewing the dropdown before and after report creation

## AC2 — Already-used codes are removed from dropdown

### Research map

- Same as AC1

### Prerequisites

- Same as AC1, but with 1 diagnostic report already created for one of the codes

### Steps

1. **Action:** Navigate to Service Request detail page with 1 existing diagnostic report
   **Expect:** Page shows the existing report in expanded or collapsed state
   **Record through:** yes

2. **Action:** Scroll to the "Test Results Entry" section and click the diagnostic report type dropdown
   **Expect:** Dropdown shows only 2 codes (the code used for the existing report is not shown)
   **Record through:** yes

### Success looks like

- The dropdown does not include the code already used by the existing diagnostic report
- Only unused codes are selectable

## AC3 — Multiple reports show all unused codes

### Research map

- Same as AC1

### Prerequisites

- Service Request with Activity Definition defining 3 diagnostic report codes
- 2 diagnostic reports already created (using 2 of the 3 codes)
- At least one specimen collected

### Steps

1. **Action:** Navigate to Service Request detail page
   **Expect:** Page shows 2 existing diagnostic reports
   **Record through:** yes

2. **Action:** In the "Test Results Entry" section, click the diagnostic report type dropdown
   **Expect:** Dropdown shows only 1 unused code (the third code not yet used)
   **Record through:** yes

### Success looks like

- When 2 out of 3 diagnostic report codes have been used, the dropdown shows only the 1 remaining unused code

## AC4 — All codes used disables creation

### Research map

- Same as AC1
- i18n labels: "all_codes_used"

### Prerequisites

- Service Request with Activity Definition defining 3 diagnostic report codes
- 3 diagnostic reports already created (all codes used)
- At least one specimen collected

### Steps

1. **Action:** Navigate to Service Request detail page
   **Expect:** Page shows 3 existing diagnostic reports
   **Record through:** yes

2. **Action:** In the "Test Results Entry" section, observe the diagnostic report type dropdown and Create Report button
   **Expect:** Dropdown is disabled and shows placeholder "All codes used", Create Report button is disabled
   **Record through:** yes

3. **Action:** Try to click the Create Report button
   **Expect:** Button remains disabled and nothing happens
   **Record through:** yes

### Success looks like

- When all diagnostic report codes have been used, the dropdown is disabled with "All codes used" placeholder
- The Create Report button is disabled
- No way to create additional reports

## AC5 — Navigate away and return shows correct state

### Research map

- Same as AC1

### Prerequisites

- Service Request with Activity Definition defining 3 diagnostic report codes
- 2 diagnostic reports created using 2 of the codes
- At least one specimen collected

### Steps

1. **Action:** Navigate to Service Request detail page
   **Expect:** Page shows 2 existing diagnostic reports and dropdown with 1 remaining code
   **Record through:** yes

2. **Action:** Navigate to the patient's overview page or encounter page (navigate away from the service request)
   **Expect:** Successfully navigates to a different page
   **Record through:** yes

3. **Action:** Navigate back to the Service Request detail page using browser back button or by clicking the service request link
   **Expect:** Page shows the same 2 diagnostic reports and dropdown shows the 1 remaining unused code (no change in state)
   **Record through:** yes

### Success looks like

- After navigating away and returning, all created reports are still visible
- The dropdown correctly shows only the remaining unused codes
- State persists across page navigation

## AC6 — Service Request without diagnostic report codes unchanged

### Research map

- Same as AC1

### Prerequisites

- Service Request with Activity Definition that has NO diagnostic_report_codes defined (empty array or null)
- At least one specimen collected

### Steps

1. **Action:** Navigate to Service Request detail page
   **Expect:** Page loads showing the Service Request
   **Record through:** yes

2. **Action:** In the "Test Results Entry" section, observe the UI
   **Expect:** No diagnostic report type dropdown is shown, only the "Create Report" button is visible
   **Record through:** yes

3. **Action:** Click "Create Report" button
   **Expect:** Success toast appears, single report is created without requiring code selection
   **Record through:** yes

### Success looks like

- For Service Requests without diagnostic report codes defined, the behavior is unchanged from before
- No dropdown shown, single report creation works as before

## AC7 — Sequential creation without reload

### Research map

- Same as AC1

### Prerequisites

- Service Request with Activity Definition defining 3 diagnostic report codes
- No diagnostic reports created yet
- At least one specimen collected

### Steps

1. **Action:** Navigate to Service Request detail page
   **Expect:** Page shows empty state for diagnostic reports
   **Record through:** yes

2. **Action:** Select the first code from the dropdown and click "Create Report"
   **Expect:** First report is created, success toast appears
   **Record through:** yes

3. **Action:** Without reloading the page, select the second code from the dropdown (which now shows only 2 remaining codes)
   **Expect:** Dropdown shows 2 codes, second code can be selected
   **Record through:** yes

4. **Action:** Click "Create Report" again
   **Expect:** Second report is created, success toast appears
   **Record through:** yes

5. **Action:** Without reloading the page, select the third code from the dropdown (which now shows only 1 remaining code)
   **Expect:** Dropdown shows 1 code, third code can be selected
   **Record through:** yes

6. **Action:** Click "Create Report" again
   **Expect:** Third report is created, success toast appears, dropdown now shows "All codes used" and is disabled
   **Record through:** yes

### Success looks like

- All 3 reports can be created sequentially without any page reload
- After each creation, the dropdown immediately updates to show only remaining codes
- After all codes are used, the dropdown is disabled

## Test plan / notes

### Playwright E2E tests

- Add test coverage for creating multiple diagnostic reports with different codes
- Test that the dropdown filters out used codes
- Test that all codes used disables the create button
- Test navigation persistence of state

### CI expectations

- All existing tests should pass
- TypeScript compilation should succeed (existing unrelated errors are pre-existing)
- No new ESLint warnings introduced
