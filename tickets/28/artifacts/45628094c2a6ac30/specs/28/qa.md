# QA Report: Multiple Diagnostic Reports per Service Request (Ticket 28)

## Summary

**Status: Partial - Not Exercised**

All acceptance criteria remain `not-exercised` due to navigation and data setup blockers encountered during the QA session. The session reached the 45-minute time cap while attempting to set up the prerequisite test data (Activity Definition with 3 diagnostic report codes + Service Request).

**Key Finding:** Successfully created an Activity Definition with 3 diagnostic report codes via UI (exists in fixtures from earlier attempt). Service Request creation via UI succeeded but did not navigate to the SR detail page as expected, blocking verification of the diagnostic report creation flow.

## Live-Flow Attempts

### AC1: Create up to N diagnostic reports for N codes

**Verdict:** `not-exercised`  
**Blocker Category:** `navigation-mismatch`  
**Evidence:** [AC1 attempt](specs/28/videos/ac1-multi-reports.webm)  
**Plan Steps Run:** Data setup steps 1-2 (Activity Definition exists, Service Request creation attempted via UI)

**What was attempted:**

1. **Auth Shell Verification:** ✓ Passed — Sidebar visible, no login form, facility context confirmed
2. **Activity Definition:** ✓ Found existing AD "Multi-Code Lab Test 1786135378678" with 3 diagnostic report codes (Acyclovir, Amdinocillin, Cefoperazone [Susceptibility]) created during earlier UI attempt
3. **Service Request Creation:** ✓ Partially successful — Successfully navigated to encounter, opened Service Requests tab, selected the multi-code Activity Definition, set priority to Routine, submitted form, and received success toast "Questionnaire submitted successfully"
4. **Navigation Blocker:** ✗ Failed — Page did not redirect to Service Request detail page after creation. Expected URL pattern `/service_request/{id}` did not load within 10 seconds. Current URL remained at encounter `/updates` route.

**Seed Attempts:**
- **Method:** `ui` (preferred per seed ladder: fixtures → UI → API)
- **Summary:** 
  - Fixture check: Confirmed facility (386772e0-eb8b-4a16-8c42-12a2f0836afa), encounter (651dd2da-0f1d-48f0-aeb5-cb685a444bb6), and patient (32fc0d09-1db0-493d-867b-c2f36b54f22c) from fixtures
  - Activity Definition: Used existing AD with 3 diagnostic report codes from earlier UI creation attempt (ID: c41089a0-03b4-492b-a5da-d407875dfd89)
  - Service Request: Created via UI following qa-plan steps 1-2. Form submission succeeded with toast, but page navigation failed.
  - Root cause: After SR creation, page remained at encounter `/updates` route instead of redirecting to new SR detail page, preventing access to Test Results Entry section where diagnostic report creation UI is located

**Why not exercised:**

The Service Request was created (confirmed by success toast), but the application did not navigate to the SR detail page as expected. Without access to the SR detail page, the Test Results Entry section with the diagnostic report codes dropdown cannot be reached to verify the acceptance criteria (creating multiple reports, dropdown filtering, form hiding).

**Attempts to recover:**
- Tried waiting 10 seconds for auto-redirect (timed out)
- Video shows the full flow up to the navigation blocker

**Next steps if unblocked:**
Would need to either:
1. Manually navigate to the SR detail page if SR ID can be extracted from DOM/network, or
2. Investigate why the redirect doesn't occur after SR creation (possible frontend routing issue), or
3. Find existing SRs with multi-code ADs and navigate directly to their detail pages

### AC2: Dropdown shows only remaining (unused) codes

**Verdict:** `not-exercised`  
**Blocker Category:** `missing-test-data`  
**Plan Steps Run:** None (blocked by AC1 prerequisites)

**Why not exercised:**

Depends on having a Service Request with multi-code AD accessible. AC1 blocker (navigation to SR detail page) prevented reaching the diagnostic report creation UI.

### AC3: Create form hides when all codes are used

**Verdict:** `not-exercised`  
**Blocker Category:** `missing-test-data`  
**Plan Steps Run:** None (blocked by AC1 prerequisites)

**Why not exercised:**

Depends on completing AC1 flow (creating all N reports). AC1 blocker prevented reaching the diagnostic report creation UI.

### AC4: Draft report doesn't block creating additional reports

**Verdict:** `not-exercised`  
**Blocker Category:** `missing-test-data`  
**Plan Steps Run:** None (blocked by AC1 prerequisites)

**Why not exercised:**

Depends on having a Service Request with multi-code AD accessible. AC1 blocker prevented reaching the diagnostic report creation UI to test draft/preliminary report behavior.

### AC5: Dropdown updates after each report creation

**Verdict:** `not-exercised`  
**Blocker Category:** `missing-test-data`  
**Plan Steps Run:** None (blocked by AC1 prerequisites)

**Why not exercised:**

Depends on completing AC1 flow (creating 2 of 3 reports). AC1 blocker prevented reaching the diagnostic report creation UI.

### AC6: Service Request with no diagnostic report codes works as before

**Verdict:** `not-exercised`  
**Blocker Category:** `missing-test-data`  
**Plan Steps Run:** None (time cap reached)

**Why not exercised:**

Time cap reached (45 minutes) while attempting AC1 prerequisites. Would require creating a new AD without diagnostic report codes, then a new SR, to verify legacy single-report behavior.

### AC7: State persists after page reload

**Verdict:** `not-exercised`  
**Blocker Category:** `missing-test-data`  
**Plan Steps Run:** None (blocked by AC1 prerequisites)

**Why not exercised:**

Depends on completing AC1 flow (creating 1 report, then reloading). AC1 blocker prevented reaching the diagnostic report creation UI.

## Limits

### Data Setup Complexity

The QA plan specified a multi-step UI data setup:
1. Create Activity Definition with 3 diagnostic report codes
2. Create Service Request from that AD
3. Process specimen to "available" status
4. Navigate to SR detail page
5. Test diagnostic report creation flow

**What was achieved:**
- ✓ Step 1: Activity Definition with 3 codes exists (from earlier UI attempt)
- ✓ Step 2: Service Request created via UI with success confirmation
- ✗ Step 3-5: Blocked by navigation failure after step 2

**Time spent:** Over 45 minutes (session cap per QA prompt) across multiple driver iterations attempting to resolve:
- Initial attempt: Full UI flow from AD creation through SR creation
- Second attempt: API seed for AD/SR (encountered validation errors on AD create, then 404 on SR endpoint)
- Third attempt: Simplified UI flow using existing AD (navigation failure)

### Navigation Issue

After Service Request creation:
- **Expected:** Page redirects to `/facility/{facilityId}/patient/{patientId}/encounter/{encounterId}/service_request/{serviceRequestId}`
- **Actual:** Page remained at `/facility/{facilityId}/patient/{patientId}/encounter/{encounterId}/updates`
- **Impact:** Cannot access SR detail page to verify diagnostic report creation UI

This may indicate:
1. A routing issue in the frontend after SR creation
2. The SR detail page might use a different URL pattern
3. The redirect logic might depend on SR state not met during test

### Evidence Captured

- **Video:** `specs/28/videos/ac1-multi-reports.webm` (2.1 MB) — Shows auth shell verification, encounter navigation, Service Request tab, AD selection, form submission, success toast, then timeout waiting for redirect
- **Log:** `specs/28/qa-logs/ac1-multi-reports.log` — Full execution log with fixture IDs, navigation steps, success/failure checkpoints
- **Driver:** `specs/28/qa-drivers/ac1-simplified.mjs` — Executable driver showing UI flow attempted

## Code Inspection Notes

**Not used for pass verdicts** (code inspection cannot yield `pass` per QA rules).

The review (specs/28/review.md) shows "Clean — no findings", indicating the implementation appeared correct during review. The blocker encountered during QA is a navigation/test environment issue, not necessarily a defect in the multiple diagnostic reports feature itself.

Key implementation files noted in spec:
- `DiagnosticReportForm.tsx` — Handles report creation and code selection
- `diagnosticReport.ts` — Type includes `code?: Code` field
- `activityDefinition.ts` — `diagnostic_report_codes` field provides available codes
- `ServiceRequestShow.tsx` — Passes `diagnosticReports` to form

## Recommendations for Re-QA

1. **Investigate navigation:** Determine correct SR detail page URL pattern after creation and whether redirect is expected
2. **Alternative approaches:**
   - Find existing SR with multi-code AD via fixtures/database and navigate directly
   - Use browser DevTools network tab to capture SR ID from creation response
   - Check if SR list view provides links to detail pages
3. **Simpler seed path:** If UI navigation remains problematic, use direct URL navigation to a known SR ID rather than relying on post-creation redirect

## Summary Verdicts

- **All Passed:** No
- **Pass:** 0
- **Fail:** 0
- **Not Exercised:** 7 (all acceptance criteria)

**Blocker Distribution:**
- `navigation-mismatch`: 1 (AC1 - SR detail page not reachable after creation)
- `missing-test-data`: 6 (AC2-7 - blocked by AC1 prerequisites)
