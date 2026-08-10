# QA Report: Infinite scroll pagination for Encounter Medicine Dispense History

## Critical Blocker

**All criteria are `not-exercised` due to `auth-failure`.**

Despite exhaustive attempts at mid-session token recovery as specified in the QA prompt, the application consistently redirects to or shows the login UI even after successful authentication.  The auth-failure blocks all facility-scoped live-flow testing.

### Auth Recovery Attempts Made

1. **Token Refresh**: Implemented JWT token refresh via `POST /api/v1/auth/token/refresh/` with the `care_refresh_token` from storage state. The API returned HTTP 200 with new access and refresh tokens, which were written back to `tests/.auth/user.json`.

2. **UI Login**: After token refresh failed to resolve the issue, implemented full UI login automation:
   - Navigated to home page
   - Clicked "Log in as Staff" tab  
   - Filled username ("admin") and password ("admin") from fixture credentials
   - Clicked sign in button
   - Saved new storage state after successful login

3. **Page Reload**: After successful UI login (confirmed by URL showing the facility/encounter path), reloaded the page to ensure the React app picked up the new auth state.

4. **Alternate Navigation**: Tried navigating to facility overview first (before the encounter page) to verify auth worked on a simpler page - still showed login UI.

### Evidence of Attempts

- Token refresh log shows: "Token refresh successful" and "Updated storage state saved"
- UI login log shows: "UI login successful, storage state saved" and "After reload URL: http://localhost:4000/facility/{facilityId}/patient/{patientId}/encounter/{encounterId}"
- Page remained on the facility encounter URL throughout, suggesting server-side auth succeeded
- However, the React frontend consistently rendered login tabs ("Log in as Staff" / "Log in as Patient") instead of the expected encounter UI with "Medicines" tab

### Technical Analysis

The mismatch suggests one of:
1. The Playwright storage state mechanism isn't properly hydrating localStorage/cookies in the CARE frontend's auth provider
2. The CARE frontend's auth check on protected routes has a client-side bug or race condition after token refresh
3. The fixture credentials or facility/patient/encounter associations are misconfigured

All criteria remain `not-exercised` because the authenticated app shell (required gate per QA prompt) was never achieved. Concrete attempts are documented in `specs/41/qa-logs/01-first-page-desktop.log` and `specs/41/qa-drivers/01-first-page-desktop.mjs`.

---

## Limits

- **App shell readiness gate failure**: Per QA prompt section "Auth shell readiness (hard gate)", all facility-scoped criteria require proof of authenticated shell (loading spinner gone + facility nav label or sidebar visible). Despite token refresh and UI login, only login tabs appeared.
- **No live-flow evidence possible**: Without access to the authenticated encounter page and Medicines tab, none of the acceptance criteria could be exercised in the running app.
- **Implementation not verified**: The infinite scroll code changes in `DispenseOrderListSelector.tsx` (conversion to `useInfiniteQuery`, scroll detection with `useOnInView`) could not be tested against live data.

---

## Criteria

### 1. First page loads immediately — Desktop

**Verdict**: `not-exercised`  
**Evidence**: `unreachable`  
**Blocker category**: `auth-failure`

**Plan steps attempted**:
- Token refresh via API (successful)
- UI login automation (button clicks successful, URL remained on encounter page)
- Created 25 dispense orders via API (successful)
- Navigated to encounter page
- Waited for auth shell readiness

**What blocked it**: After all auth recovery steps, the page still rendered login tabs instead of the Medicines tab, failing the auth shell readiness gate.

---

### 2. Scroll loads additional older dispense orders — Desktop

**Verdict**: `not-exercised`  
**Evidence**: `unreachable`  
**Blocker category**: `auth-failure`

**What blocked it**: Could not reach the Dispense History list to test scrolling behavior due to auth-failure on criterion 1.

---

### 3. Select older row after loading — Desktop

**Verdict**: `not-exercised`  
**Evidence**: `unreachable`  
**Blocker category**: `auth-failure`

**What blocked it**: Could not reach the Dispense History list to test row selection due to auth-failure on criterion 1.

---

### 4. Short list does not trigger fetch loop — Desktop

**Verdict**: `not-exercised`  
**Evidence**: `unreachable`  
**Blocker category**: `auth-failure`

**What blocked it**: Could not reach the Dispense History tab to verify short-list behavior due to auth-failure on criterion 1.

---

### 5. First page loads immediately — Mobile

**Verdict**: `not-exercised`  
**Evidence**: `unreachable`  
**Blocker category**: `auth-failure`

**What blocked it**: Same auth-failure as desktop criteria - mobile viewport would face identical login UI blocking access to the encounter page.

---

### 6. Scroll loads additional older dispense orders — Mobile

**Verdict**: `not-exercised`  
**Evidence**: `unreachable`  
**Blocker category**: `auth-failure`

**What blocked it**: Could not reach mobile Dispense History drawer due to auth-failure.

---

### 7. Select older row after loading — Mobile

**Verdict**: `not-exercised`  
**Evidence**: `unreachable`  
**Blocker category**: `auth-failure`

**What blocked it**: Could not reach mobile Dispense History drawer to test selection due to auth-failure.

---

## Summary

Despite implementing the full mid-session token recovery workflow (JWT refresh + fallback UI login + storage state persistence + page reload) as mandated by the QA prompt, the CARE frontend consistently showed login UI on protected routes. All seven acceptance criteria remain `not-exercised` due to this `auth-failure` blocker.

The implementation changes to `DispenseOrderListSelector.tsx` (infinite query, scroll detection, page fetching) could not be verified against the live application. Code inspection confirms the changes match the `PrescriptionListSelector` reference pattern, but live-flow evidence remains impossible without a working authenticated session.

Recommendation: Investigate CARE frontend's storage state hydration or auth provider initialization to determine why freshly refreshed JWT tokens and successful UI logins do not result in an authenticated app shell.
