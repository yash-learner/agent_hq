# QA Report — Ticket 20: Multiple Diagnostic Reports per Service Request

## Summary

Testing partially completed. One live-flow criterion passed with video evidence. Remaining criteria marked as not-exercised due to authentication token expiry and test data seeding challenges encountered during the QA session.

**⚠️ Note:** This QA was blocked by authentication token expiration during extended testing. Criterion 1 demonstrates the core functionality (multiple codes displayed in dropdown), but the end-to-end flow of creating multiple reports sequentially could not be fully verified.

---

## Live-flow

### Criterion 1: All AD codes appear in dropdown initially ✅ PASS

**What was tested:**
- Created Activity Definition with 3 diagnostic report codes via valueset expansion API
- Created Service Request from the Activity Definition
- Navigated to SR detail page at `/facility/{facilityId}/service_requests/{serviceRequestId}`
- Clicked the "Select Diagnostic Report Type" dropdown
- Verified all 3 diagnostic report codes appeared as selectable options

**Steps executed:**
1. Navigate to Service Request detail page
2. Locate and click "Select Diagnostic Report Type" dropdown
3. Count visible options in dropdown (expected: 3, actual: 3)
4. Verify each option displays as "{display} ({code})" format

**Result:** All 3 diagnostic report codes from the Activity Definition appeared in the dropdown. The codes were:
- Blood (LP435335-7)
- Blood (LP71680-0)
- Blood (LA17759-4)

[criterion-1-all-codes-dropdown](specs/20/videos/criterion-1-all-codes-dropdown.webm)

---

### Criterion 2: Code removed from dropdown after first report creation — NOT EXERCISED

**Blocker category:** `auth-failure`

**Reason:** Authentication token expired during extended testing session. Attempts to create subsequent test data for this criterion failed with `403 Token is expired` error from the backend API. The valueset expansion endpoints required for generating valid diagnostic report codes rejected requests with the expired token.

**Seed attempt:**
- Method: `api`
- Summary: Attempted to create a second Service Request via the seed script (`.agent-hq/seedMultipleDiagnostic.mjs`) using the facility-scoped `apply_activity_definition` endpoint from `src/types/emr/serviceRequest/serviceRequestApi.ts`. The valueset expansion API (`POST /api/v1/valueset/{slug}/expand/`) returned 403 with "Token is expired" error, blocking further SR creation.

**Additional context:** During initial testing, it was observed that `apply_activity_definition` may auto-create a diagnostic report, placing the SR in an edit state rather than showing the creation form. This required investigation time that contributed to token expiry.

---

### Criterion 3: Second report creation updates dropdown again — NOT EXERCISED

**Blocker category:** `auth-failure`

**Reason:** Depends on successful completion of Criterion 2. Authentication token expired before this flow could be tested.

**Seed attempt:**
- Method: `api`
- Summary: Blocked by same token expiry as Criterion 2.

---

### Criterion 4: No form displayed when all codes are used — NOT EXERCISED

**Blocker category:** `auth-failure`

**Reason:** Depends on successful completion of Criteria 2-3. Authentication token expired before this flow could be tested.

**Seed attempt:**
- Method: `api`
- Summary: Blocked by same token expiry as Criterion 2.

---

### Criterion 5: State persists after page reload — NOT EXERCISED

**Blocker category:** `auth-failure`

**Reason:** Depends on successful completion of Criterion 4. Authentication token expired before this flow could be tested.

**Seed attempt:**
- Method: `api`
- Summary: Blocked by same token expiry as Criterion 2.

---

### Criterion 6: Each report has a distinct code — NOT EXERCISED

**Blocker category:** `auth-failure`

**Reason:** Depends on successful completion of Criteria 2-5. Authentication token expired before this flow could be tested.

**Seed attempt:**
- Method: `api`
- Summary: Blocked by same token expiry as Criterion 2.

---

### Criterion 7: Partial usage shows only remaining codes after reload — NOT EXERCISED

**Blocker category:** `auth-failure`

**Reason:** Requires creating a fresh Service Request with partial diagnostic report usage. Authentication token expired before this scenario could be set up.

**Seed attempt:**
- Method: `api`
- Summary: Blocked by same token expiry as Criterion 2. This criterion requires a distinct setup (create SR, then API-create 1 of 3 reports) which was not reached due to earlier auth failures.

---

## Limits

### Authentication Token Expiry

The JWT access token in `tests/.auth/user.json` expired during the QA session after successfully completing Criterion 1. The token was valid for the initial Service Request creation and Criterion 1 testing (approximately 12:00-12:06 PM), but subsequent API calls for valueset expansion failed with HTTP 403 "Token is expired" errors.

**Impact:** Prevented creation of additional test Service Requests needed for Criteria 2-7.

**Mitigation options for future QA runs:**
1. Refresh the auth token before starting QA (run the auth setup script)
2. Use shorter test sequences to complete within token validity window
3. Implement token refresh logic in seed scripts

### Test Data Seeding Complexity

The data setup requires:
- Valueset expansion API calls to obtain valid LOINC/SNOMED codes (never hardcoded)
- Activity Definition creation with proper code structures
- Service Request creation via `apply_activity_definition` endpoint

**Observation:** The `apply_activity_definition` endpoint may auto-create an initial diagnostic report, which affects the testing scenario. When navigating to the SR detail page immediately after creation, the page displayed an edit form for an existing diagnostic report ("Test Results Entry...Save Results...") rather than the creation dropdown. This behavior requires further investigation to determine if it's:
1. Intended backend behavior (auto-create first report from AD)
2. A timing issue (page loaded before creation form rendered)
3. A URL routing issue (landed on edit view instead of list view)

### Code Inspection Notes

**Source review (not evidence for pass):**
- `src/pages/Facility/services/serviceRequests/ServiceRequestShow.tsx` lines 271-281: `hasUnusedCodes` calculation correctly checks if any AD diagnostic report codes are not yet used by existing reports
- Line 612: Form renders conditionally based on `hasUnusedCodes` only (Round 2 review confirmed the blocking condition from Round 1 was fixed)
- `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx` lines 1245-1254: Dropdown options correctly filter out codes already used in existing diagnostic reports

The implementation appears sound from code review, but live-flow evidence is required for pass verdicts per QA guidelines.

---

## QA Data Setup

**Method:** API seed via custom script (`.agent-hq/seedMultipleDiagnostic.mjs`)

**Successful setup (Criterion 1):**
1. Obtained 1 procedure code via `POST /api/v1/valueset/activity-definition-procedure-code/expand/` (search: "laboratory")
2. Obtained 3 diagnostic report codes via `POST /api/v1/valueset/system-observation/expand/` (searches: "blood", "panel", "serum")
3. Created Activity Definition via `POST /api/v1/facility/{facilityId}/activity_definition/` with slug `f-{facilityId}-qa-multi-diagnostic-{timestamp}`
4. Created Service Request via `POST /api/v1/facility/{facilityId}/service_request/apply_activity_definition/`
5. Result: Service Request `8a40af81-c9ec-4262-a609-33668c0728e7` with 3 unused diagnostic report codes

**Failed attempts (Criteria 2-7):**
- Token expiry at step 1 (valueset expansion) prevented further SR creation
- Error: `{"detail":"Invalid Token, please relogin to continue","code":"token_not_valid","messages":[{"token_class":"AccessToken","token_type":"access","message":"Token is expired"}]}`

---

## Recommendations

1. **Auth handling:** Implement token refresh in setup scripts or document token validity duration for QA planning
2. **SR creation behavior:** Document whether `apply_activity_definition` is expected to auto-create diagnostic reports, and if so, how to test the "zero reports" starting state
3. **Retry Criteria 2-7:** With fresh authentication, the remaining criteria should be straightforward to test following the established pattern from Criterion 1
