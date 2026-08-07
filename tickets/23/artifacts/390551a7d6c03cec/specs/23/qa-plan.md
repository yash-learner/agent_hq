# QA Plan: Support Multiple Diagnostic Reports per Service Request

## ac-1 — All codes available initially

### Research map

- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/service_requests/:serviceRequestId`
- components: `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx`
- i18n labels: "Select diagnostic report type", "Create report"
- auth/role: tests/.auth/user.json (admin)
- permissions: facility-scoped, requires patient and service request
- fixtures needed: facility, patient, encounter, Activity Definition with 3+ diagnostic report codes, Service Request from that AD

### Prerequisites

- Facility context active
- Patient with active encounter exists
- Activity Definition with 3+ diagnostic report codes exists
- Service Request created from that Activity Definition
- Specimens collected (if required)

### Data setup

**Prefer API seed (deep entity chain: AD → SR → verify multi-code display):**

Create a setup script `tests/setup/multipleDiagnosticReports.setup.ts`:

```typescript
import fs from "fs";
import { expect, test } from "@playwright/test";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

interface Code {
  code: string;
  display: string;
  system: string;
}

interface ExpandResponse {
  results: Code[];
}

test.use({ storageState: "tests/.auth/user.json" });

async function requireOk(
  response: Awaited<ReturnType<typeof fetch>>,
  label: string,
) {
  if (!response.ok) {
    throw new Error(
      `${label} failed: ${response.status} ${await response.text()}`,
    );
  }
}

test("seed an SR with multiple diagnostic report codes", async () => {
  const baseUrl = getApiUrl();
  const headers = getApiHeaders();
  const facilityId = getFacilityId();
  const patientId = getPatientId();
  const encounterId = getEncounterId();

  async function expand(
    slug: string,
    searchTerms: string[],
    required: number,
  ): Promise<Code[]> {
    const found = new Map<string, Code>();

    for (const search of searchTerms) {
      const response = await fetch(
        `${baseUrl}/api/v1/valueset/${slug}/expand/`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ search, count: 20 }),
        },
      );

      await requireOk(response, `expand ${slug} for "${search}"`);

      const data = (await response.json()) as ExpandResponse;
      for (const result of data.results) {
        found.set(`${result.system}|${result.code}`, {
          system: result.system,
          code: result.code,
          display: result.display,
        });
      }

      if (found.size >= required) break;
    }

    const values = [...found.values()].slice(0, required);
    expect(
      values,
      `${slug} should provide ${required} valid codes`,
    ).toHaveLength(required);
    return values;
  }

  // Obtain validated codes from CARE's valueset expansion API
  const [procedureCode] = await expand(
    "activity-definition-procedure-code",
    ["laboratory", "test", "procedure"],
    1,
  );

  const diagnosticReportCodes = await expand(
    "system-observation",
    ["blood", "panel", "serum"],
    3,
  );

  const unique = Date.now();
  const title = `QA Multi Diagnostic Reports ${unique}`;
  const slugValue = `qa-multi-diagnostic-${unique}`;

  // Create Activity Definition via POST /api/v1/facility/{facilityId}/activity_definition/
  // (verbatim from src/types/emr/activityDefinition/activityDefinitionApi.ts)
  const activityDefinitionResponse = await fetch(
    `${baseUrl}/api/v1/facility/${facilityId}/activity_definition/`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        slug_value: slugValue,
        title,
        status: "active",
        classification: "laboratory",
        kind: "service_request",
        code: procedureCode,
        diagnostic_report_codes: diagnosticReportCodes,
        specimen_requirements: [],
        charge_item_definitions: [],
        observation_result_requirements: [],
        locations: [],
        category: null,
        healthcare_service: null,
        body_site: null,
        description: "QA seed for multiple diagnostic reports",
        usage: "",
        derived_from_uri: null,
      }),
    },
  );

  await requireOk(activityDefinitionResponse, "create Activity Definition");
  const activityDefinition = await activityDefinitionResponse.json();

  // Apply the AD to create a Service Request
  // (from tests/facility/patient/encounter/serviceRequests/ServiceRequestCreate.spec.ts pattern)
  const serviceRequestResponse = await fetch(
    `${baseUrl}/api/v1/facility/${facilityId}/service_request/apply_activity_definition/`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        encounter: encounterId,
        activity_definition: activityDefinition.slug,
        service_request: {
          priority: "routine",
        },
      }),
    },
  );

  await requireOk(serviceRequestResponse, "create Service Request from AD");
  const serviceRequest = await serviceRequestResponse.json();

  // Save the seed data for QA
  fs.mkdirSync(".agent-hq", { recursive: true });
  fs.writeFileSync(
    ".agent-hq/multiple-diagnostic-seed.json",
    JSON.stringify(
      {
        facilityId,
        patientId,
        encounterId,
        activityDefinitionSlug: activityDefinition.slug,
        serviceRequestId: serviceRequest.id,
        title,
        diagnosticReportCodes,
      },
      null,
      2,
    ),
  );

  console.log("✅ Seeded Activity Definition with 3 diagnostic report codes");
  console.log(JSON.stringify({ serviceRequestId: serviceRequest.id }, null, 2));
});
```

**Run setup:**

```bash
REACT_CARE_API_URL=http://localhost:9000 \
  npx playwright test tests/setup/multipleDiagnosticReports.setup.ts \
  --project=setup --workers=1
```

**Verify seed success:** Open the SR URL and confirm the dropdown shows 3 codes before scoring.

**UI fallback (if API seed fails for non-permission reasons):**

1. Go to `/facility/{facilityId}/settings/activity_definitions/categories/f-{facilityId}-lab-tests-activity-definition/new`
2. Fill form:
   - Title: `QA Multi Diagnostic ${Date.now()}`
   - Status: Active
   - Classification: Laboratory
   - Kind: Service Request
   - Code: search "laboratory" and select first valid procedure code
   - Diagnostic Report Codes: search "blood" and select 3 different codes (e.g., "Complete Blood Count", "Blood Glucose", "Hemoglobin")
3. Submit and confirm success toast
4. Open `/facility/{facilityId}/patient/{patientId}/encounter/{encounterId}/service_requests`
5. Create Service Request → select the new Activity Definition → select "Routine" priority → Submit
6. Confirm success toast and note the SR ID from the URL

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/service_requests/{serviceRequestId}` (from seed output)
   **Expect:** Service Request detail page loads, diagnostic report section shows "No test results recorded" message
   **Record through:** yes

2. **Action:** Locate the diagnostic report code dropdown (labeled "Select diagnostic report type")
   **Expect:** Dropdown is visible and enabled (assuming specimens are collected)
   **Record through:** yes

3. **Action:** Click the dropdown to open it
   **Expect:** All 3 diagnostic report codes from the Activity Definition are listed as options with format "Display Name (CODE)"
   **Record through:** yes

4. **Action:** Close the dropdown without selecting (click outside or press Escape)
   **Expect:** Dropdown closes, no selection made, "Create Report" button remains disabled
   **Record through:** yes

### Success looks like

- Dropdown shows exactly 3 codes matching the Activity Definition's diagnostic report codes
- All codes are selectable
- No reports exist yet, so all codes are available

---

## ac-2 — Only unused codes after one report

### Research map

- Same as ac-1
- State management: `unusedReportCodes` filter logic in DiagnosticReportForm.tsx

### Prerequisites

- Same seed data as ac-1 (SR with 3 diagnostic report codes)

### Data setup

- Use the same seed from ac-1 (SR with 3 codes, no reports yet)

### Steps

1. **Action:** From ac-1 state, open the diagnostic report code dropdown
   **Expect:** All 3 codes visible
   **Record through:** yes

2. **Action:** Select the first code from the dropdown
   **Expect:** Code is selected, "Create Report" button becomes enabled
   **Record through:** yes

3. **Action:** Click "Create Report" button
   **Expect:** Success toast "Diagnostic report created successfully", form expands to show observation entry fields
   **Record through:** yes

4. **Action:** Scroll down to the bottom of the diagnostic report section (after the observation fields)
   **Expect:** A new section appears with message "Create an additional diagnostic report for another test type" and a dropdown + "Create Report" button
   **Record through:** yes

5. **Action:** Click the dropdown in the additional report section
   **Expect:** Only 2 codes are shown (the 2 unused codes), the code used in step 2 is NOT present
   **Record through:** yes

### Success looks like

- Dropdown shows exactly 2 codes (original 3 minus the one used)
- The used code is filtered out
- Remaining codes are still selectable

---

## ac-3 — Create report without reload, code disappears

### Research map

- Same as ac-2
- State update: `setSelectedReportCode(null)` after report creation
- Query invalidation: `queryClient.invalidateQueries` for live update

### Prerequisites

- Continuation from ac-2 (1 report created, 2 unused codes remain)

### Data setup

- Continue from ac-2 state (no additional setup)

### Steps

1. **Action:** From ac-2 state (dropdown showing 2 unused codes), select one of the remaining codes
   **Expect:** Code is selected, "Create Report" button in the additional section becomes enabled
   **Record through:** yes

2. **Action:** Click "Create Report" button in the additional section
   **Expect:** Success toast "Diagnostic report created successfully"
   **Record through:** yes

3. **Action:** Scroll to the additional report section (do NOT reload the page)
   **Expect:** Dropdown is cleared (no selection), and when opened shows only 1 code (the last unused code)
   **Record through:** yes

4. **Action:** Verify the code that was just used in step 1 is no longer in the dropdown
   **Expect:** Only 1 code remains, the code from step 1 is filtered out
   **Record through:** yes

### Success looks like

- Report creation updates dropdown immediately without page reload
- Used code disappears from dropdown instantly
- Form remains interactive for creating the next report

---

## ac-4 — No dropdown when all codes used

### Research map

- Same as ac-3
- Condition: `hasUnusedCodes` check hides creation form

### Prerequisites

- Continuation from ac-3 (2 reports created, 1 unused code remains)

### Data setup

- Continue from ac-3 state (no additional setup)

### Steps

1. **Action:** From ac-3 state (1 unused code remains), open the dropdown in the additional report section
   **Expect:** Exactly 1 code is shown
   **Record through:** yes

2. **Action:** Select the last remaining code and click "Create Report"
   **Expect:** Success toast "Diagnostic report created successfully"
   **Record through:** yes

3. **Action:** Scroll down to where the additional report section was located
   **Expect:** The "Create an additional diagnostic report" section is NO LONGER visible (completely hidden)
   **Record through:** yes

4. **Action:** Check for any "Create Report" buttons or diagnostic code dropdowns on the page
   **Expect:** No creation controls are visible (3 report cards shown, no creation section)
   **Record through:** yes

### Success looks like

- Additional report creation section disappears after all codes are used
- No way to create more reports when all AD codes are exhausted
- Page shows only the 3 existing reports

---

## ac-5 — Second code remains available

### Research map

- Same as ac-2
- Validation: correct filtering logic for Set-based used code tracking

### Prerequisites

- Fresh seed (SR with 3 codes, no reports)

### Data setup

- Use the same API seed as ac-1 (fresh SR with 3 diagnostic codes)
- If the seed from ac-1 was already used for ac-1 through ac-4, run the setup script again to create a new SR with 3 codes

### Steps

1. **Action:** Navigate to the freshly seeded SR page `/facility/{facilityId}/service_requests/{serviceRequestId}`
   **Expect:** No reports exist, dropdown shows 3 codes
   **Record through:** yes

2. **Action:** Open dropdown, select the second code (middle option), and click "Create Report"
   **Expect:** Success toast, report created for that code
   **Record through:** yes

3. **Action:** Scroll to additional report section, open the dropdown
   **Expect:** Exactly 2 codes remain (first and third codes from the original list)
   **Record through:** yes

4. **Action:** Verify the second code (used in step 2) is NOT present in the dropdown
   **Expect:** Only the first and third codes are shown
   **Record through:** yes

5. **Action:** Select one of the remaining codes and create another report
   **Expect:** Success toast, report created
   **Record through:** yes

6. **Action:** Check the additional report section dropdown again
   **Expect:** Only 1 code remains (the one not yet used)
   **Record through:** yes

### Success looks like

- Creating a report for any code (not just the first) filters correctly
- Other codes remain available in correct order
- Multiple reports can be created in any order of codes

---

## ac-6 — State persists after reload

### Research map

- Same as ac-4
- Data persistence: reports fetched from backend on page load

### Prerequisites

- Continuation from ac-4 (all 3 reports created) OR fresh seed with 3 codes and manually create 2 reports

### Data setup

- If continuing from ac-4, use that state (3 reports already created)
- If fresh, use the API seed and manually create 2 reports (leaving 1 code unused)

### Steps

1. **Action:** From a state with 2 reports created and 1 unused code, note the remaining code name
   **Expect:** Additional report section shows 1 unused code
   **Record through:** yes

2. **Action:** Reload the page (F5 or Ctrl+R)
   **Expect:** Page reloads, same SR detail page loads
   **Record through:** yes

3. **Action:** Scroll to the additional report section and check the dropdown
   **Expect:** The same 1 unused code is still shown (same code as before reload)
   **Record through:** yes

4. **Action:** Create a report for that last code
   **Expect:** Success toast, report created
   **Record through:** yes

5. **Action:** Reload the page again
   **Expect:** Page loads, all 3 reports are shown, no additional report section is visible
   **Record through:** yes

### Success looks like

- Unused code state persists across page reloads
- Backend correctly tracks which codes have been used
- UI reflects server state on reload

---

## ac-7 — No-code AD behavior unchanged

### Research map

- Same as ac-1
- Fallback logic: when `diagnostic_report_codes` is empty or undefined

### Prerequisites

- Activity Definition with NO diagnostic report codes defined
- Service Request created from that AD

### Data setup

**Prefer fixtures:** Load-fixtures provides standard Activity Definitions. Check if any have zero diagnostic report codes:

- "Urinalysis", "Lipid Panel", "Fasting Blood Glucose" (from `tests/facility/patient/encounter/serviceRequests/serviceRequest.ts`)

**If no fixture exists, UI create:**

1. Go to `/facility/{facilityId}/settings/activity_definitions/categories/f-{facilityId}-lab-tests-activity-definition/new`
2. Fill form:
   - Title: `QA No Codes AD ${Date.now()}`
   - Status: Active
   - Classification: Laboratory
   - Kind: Service Request
   - Code: search "laboratory" and select a procedure code
   - Diagnostic Report Codes: **leave empty, do not add any codes**
3. Submit and confirm success
4. Create a Service Request from this AD:
   - Go to `/facility/{facilityId}/patient/{patientId}/encounter/{encounterId}/service_requests`
   - Create Service Request → select the new AD → Routine → Submit

### Steps

1. **Action:** Navigate to the SR page `/facility/{facilityId}/service_requests/{serviceRequestId}` (AD has no diagnostic report codes)
   **Expect:** Diagnostic report section shows "No test results recorded" message
   **Record through:** yes

2. **Action:** Check for diagnostic report code dropdown
   **Expect:** No dropdown is visible (since AD has no codes defined)
   **Record through:** yes

3. **Action:** Check for "Create Report" button
   **Expect:** "Create Report" button IS visible and enabled (no code selection required)
   **Record through:** yes

4. **Action:** Click "Create Report" button
   **Expect:** Success toast "Diagnostic report created successfully", report form expands
   **Record through:** yes

5. **Action:** Check for additional report creation section
   **Expect:** No additional report section appears (cannot create multiple reports when AD has no codes)
   **Record through:** yes

6. **Action:** Try to create another report
   **Expect:** No controls to create another report (behaves like the old single-report flow)
   **Record through:** yes

### Success looks like

- AD with no diagnostic codes behaves exactly as before (single report creation)
- No dropdown shown when AD has no codes
- No additional report creation section appears
- Existing single-report workflow is unaffected

---

## Test plan / notes

**Playwright E2E Coverage:**

- Add test file `tests/facility/patient/encounter/serviceRequests/multipleDiagnosticReports.spec.ts` covering:
  - Create 3 reports sequentially for an SR with 3 codes
  - Verify dropdown filtering after each creation
  - Verify no creation controls after all codes used
  - Verify reload persistence
  - Verify no-code AD fallback behavior

**CI Expectations:**

- `npm run lint` must pass (no new lint errors)
- `npm run format` must pass (code formatted)
- TypeScript compilation must succeed
- Existing Playwright tests must not regress

**Manual verification recommended for:**

- Screen reader announces dropdown changes after report creation
- Keyboard navigation works for dropdown + button in additional section
- Mobile responsive layout for additional report section
