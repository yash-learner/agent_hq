# QA Report: Support Multiple Diagnostic Reports per Service Request

## Summary

All 7 acceptance criteria passed. The implementation successfully allows creating multiple diagnostic reports from a Service Request whose Activity Definition defines multiple diagnostic report codes. The dropdown correctly filters out already-used codes after each report creation, and backward compatibility is maintained for Activity Definitions with no diagnostic report codes.

**Result:** ✅ All criteria passed

## Live-flow Verification

### AC1: All codes available with no reports created

**Verdict:** ✓ PASS

**What was tested:**
1. Created an Activity Definition with 3 diagnostic report codes via API (using valueset expansion)
2. Created a Service Request from that Activity Definition
3. Opened the SR details page in the browser
4. Verified the diagnostic report code dropdown shows all 3 codes
5. Verified no diagnostic report cards exist yet

**Plan steps run:** Data setup (API seed), Step 1 (locate section), Step 2 (verify dropdown), Step 3 (verify no reports)

[ac1-all-codes-available](specs/23/videos/ac1-all-codes-available.webm)

### AC2: Only unused codes shown after one report created

**Verdict:** ✓ PASS

**What was tested:**
1. Created a fresh Service Request with 3 diagnostic report codes
2. Selected the first code from the dropdown
3. Clicked "Create Report" button
4. Verified success toast appeared
5. Without reloading, verified the dropdown now shows only 2 remaining codes
6. Verified the used code no longer appears in the dropdown

**Plan steps run:** Data setup, Step 1 (select first code), Step 2 (create report), Step 3 (verify 2 codes remain)

[ac2-unused-codes](specs/23/videos/ac2-unused-codes.webm)

### AC3: Create report without reload, code removed from dropdown

**Verdict:** ✓ PASS

**What was tested:**
1. Continued from AC2 state (2 codes remaining)
2. Selected one of the 2 remaining codes
3. Clicked "Create Report" button
4. Verified success toast appeared
5. Without reloading, verified the dropdown now shows only 1 remaining code
6. Verified the just-used code was removed from the dropdown
7. Verified a second diagnostic report card is now visible

**Plan steps run:** Step 1 (confirm 2 codes), Step 2 (select second code), Step 3 (create report), Step 4 (verify 1 code remains), Step 5 (verify report card)

[ac3-create-without-reload](specs/23/videos/ac3-create-without-reload.webm)

### AC4: No dropdown when all codes used

**Verdict:** ✓ PASS

**What was tested:**
1. Continued from AC3 state (1 code remaining)
2. Selected the last remaining code
3. Clicked "Create Report" button
4. Verified success toast appeared
5. Without reloading, verified the dropdown is no longer visible (hidden/disabled)
6. Verified the "Create Report" button is disabled
7. Verified all 3 diagnostic report cards are visible

**Plan steps run:** Step 1 (confirm 1 code), Step 2 (select last code), Step 3 (create report), Step 4 (verify no dropdown), Step 5 (verify all cards)

[ac4-no-dropdown](specs/23/videos/ac4-no-dropdown.webm)

### AC5: One code remains available after creating one of two unused codes

**Verdict:** ✓ PASS

**What was tested:**
1. Created a new Activity Definition with only 2 diagnostic report codes via API
2. Created a Service Request from that Activity Definition
3. Verified the dropdown shows 2 codes initially
4. Selected the first code and created a report
5. Verified success toast appeared
6. Without reloading, verified the dropdown shows only 1 remaining code
7. Verified the first code is no longer in the dropdown

**Plan steps run:** Data setup (2-code AD), Step 1 (verify 2 codes), Step 2 (create first report), Step 3 (verify 1 code remains), Step 4 (confirm first code gone)

[ac5-two-code-scenario](specs/23/videos/ac5-two-code-scenario.webm)

### AC6: Reload preserves exhausted/remaining-code state

**Verdict:** ✓ PASS

**What was tested:**
1. Used the Service Request from AC2-AC4 (all 3 reports already created)
2. Reloaded the browser page
3. Verified the dropdown is no longer visible after reload
4. Verified the "Create Report" button is disabled/hidden after reload
5. Verified all 3 diagnostic report cards persist after reload

**Plan steps run:** Step 1 (reload page), Step 2 (verify no dropdown), Step 3 (verify all cards persist)

[ac6-reload-persistence](specs/23/videos/ac6-reload-persistence.webm)

### AC7: Single-report behavior unchanged for no-code ADs

**Verdict:** ✓ PASS

**What was tested:**
1. Created an Activity Definition with NO diagnostic report codes (empty array) via API
2. Created a Service Request from that Activity Definition
3. Verified no dropdown is visible (as expected for no-code AD)
4. Verified the "Create Report" button is visible and enabled (not blocked by the new logic)
5. Clicked "Create Report" button
6. Verified success toast appeared
7. Verified a diagnostic report card appeared without code selection

**Plan steps run:** Data setup (no-code AD), Step 1 (verify no dropdown), Step 2 (verify button enabled), Step 3 (create report), Step 4 (verify report card)

[ac7-no-code-backward-compat](specs/23/videos/ac7-no-code-backward-compat.webm)

## Notes

- **Token refresh:** During AC5 execution, the JWT access token expired. The driver successfully refreshed the token via `/api/v1/auth/token/refresh/` endpoint using the refresh token from the auth storage state, then retried the request. This follows the mid-session token recovery procedure specified in the QA prompt.

- **API seed approach:** All criteria used the API setup approach from the qa-plan, obtaining valid codes via the valueset expansion API (`/api/v1/valueset/{slug}/expand/`) rather than hardcoding LOINC codes. This ensures only backend-validated codes are used.

- **Continuous flow:** AC2-AC4 were recorded in a single continuous video showing the complete flow of creating three diagnostic reports one after another without page reload, demonstrating the real-time dropdown filtering behavior.

- **Auth shell readiness:** The frontend occasionally renders on a facility URL without proper authentication (showing login form while URL appears correct). The drivers handle this by checking for the sidebar/navigation elements as proof of authenticated shell, not just URL or page title.

## Limits

None. All user-facing acceptance criteria were exercised successfully in the running application with live-flow video evidence.
