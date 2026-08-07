# QA Report: Show user role on user list cards

## Critical Finding

**All acceptance criteria FAIL** due to a data structure mismatch between the frontend implementation and backend API.

### Root Cause

The implementation uses `user.user_type` to display roles on user cards (line 172 in `UserListAndCard.tsx`), but the backend API does not provide a `user_type` field. Instead, the backend provides `role_orgs` array with role information structured differently.

**Evidence from API:**
- Backend response includes `role_orgs[].role.name` (e.g., "Facility Admin")
- Backend response does NOT include `user_type` field
- All users have `user_type: undefined` in the actual data

**Impact:**
- The role div (lines 111-121) is never rendered because `roleName` is always undefined
- User cards display usernames but no roles
- All acceptance criteria requiring visible roles cannot be met

---

## Live-flow

### AC1 — Role visible on card with role, regardless of edit action

**Verdict:** fail  
**Plan steps run:** ["1", "2", "3", "4"]

Navigated to facility users page (`/facility/{facilityId}/users`) in card view. User cards are rendered correctly with user information (avatar, name, username, last login), but NO roles are visible on any cards.

**Evidence:**
- Examined 5 user cards (care-fac-admin, admin, care-staff, care-doctor, care-nurse)
- None display role text (should show "Facility Admin", "Doctor", "Nurse", "Staff", etc.)
- Role div (lines 111-121 in UserCard) is not rendered because `user.user_type` is undefined
- Verified via diagnostic: user cards show "care-doctor" (username) but not "Doctor" (role)

[AC1 facility users - no roles visible](specs/33/videos/ac1-facility-role-visible.webm)

**Technical issue:** Implementation passes `roleName={user.user_type}` (line 172) but backend provides `role_orgs` instead of `user_type`.

---

### AC3 — Facility users with "doctor" role display "doctor" on cards

**Verdict:** fail  
**Plan steps run:** ["1", "2", "3"]

Specifically tested for "Doctor" role visibility on facility user cards. Found `care-doctor` username visible but "Doctor" role text is NOT displayed.

**Evidence:**
- care-doctor user card is rendered
- Username "care-doctor" is visible
- Role text "Doctor" is NOT visible
- Searched page for "Doctor" text - found username but no role label

[AC3 doctor role - not displayed](specs/33/videos/ac3-doctor-role.webm)

**Same root cause:** `user.user_type` field is undefined for all users.

---

### AC2 — Role section not rendered when no role, but edit action still appears

**Verdict:** not-exercised  
**Plan steps run:** ["1", "2", "3"]

**Blocker:** `navigation-mismatch`  
**Blocker category:** navigation-mismatch

Attempted to navigate to organization users page via Governance → Government → Users. Navigation reached the users endpoint but the expected card layout did not render. Timed out waiting for user cards (10 seconds).

**What was attempted:**
1. Navigated to home page
2. Clicked Governance tab
3. Clicked Government organization
4. Clicked Users link
5. Waited for cards - timeout after 10s

Organization users may use a different layout (list only) or require different navigation. Cannot verify role display behavior without reaching the card view.

No video available (recording failed before meaningful content).

---

### AC4 — Organization users display organization-specific role names

**Verdict:** not-exercised  
**Plan steps run:** ["1", "2", "3"]

**Blocker:** `navigation-mismatch`  
**Blocker category:** navigation-mismatch

Same blocker as AC2. Could not reach organization user cards to verify role display (Admin, Manager, Member).

**Note:** OrganizationUsers component (line 216) correctly extracts `roleName={userRole.role.name}` from the role_orgs structure. This is the correct pattern that FacilityUsers should follow but doesn't.

No video available (recording failed before meaningful content).

---

### AC5 — Facility organization users display facility organization role names

**Verdict:** not-exercised  
**Plan steps run:** ["1", "2"]

**Blocker:** `missing-facility-context`  
**Blocker category:** missing-facility-context

Navigated to facility settings but "Organizations" link is not present. Fixtures do not include a facility-organization link needed to access facility organization users page.

[AC5 facility settings - no org link](specs/33/videos/ac5-facility-org-users.webm)

**What was attempted:**
1. Navigated to `/facility/{facilityId}/settings`
2. Searched for "Organizations" link - not found
3. No facility-organization relationship exists in fixture data

---

## Limits

### Implementation vs Backend Mismatch

**Core issue:** The frontend implementation assumes `user.user_type` field exists, but the backend provides `role_orgs` array instead.

**Correct implementation example:**
- `OrganizationUsers.tsx` (line 216): `roleName={userRole.role.name}` ✓
- `FacilityUsers/UserGrid` (line 172): `roleName={user.user_type}` ✗

**What should happen:**
- Extract role from `user.role_orgs[0].role.name` (for facility users)
- Or backend should add `user_type` field to the User serializer

### Fixture Data

Fixtures provide users with `role_orgs` but no `user_type`:
```json
{
  "username": "care-doctor",
  "role_orgs": [
    {
      "role": {
        "name": "Facility Admin",
        "contexts": ["FACILITY"]
      }
    }
  ]
  // NO user_type field
}
```

### Code Inspection Note

The conditional rendering fix (lines 111-121 vs 122-130) is implemented correctly:
- Renders role div when `roleName` exists ✓
- Renders separate editAction div when no role ✓
- Problem: `roleName` is always undefined due to missing `user.user_type` ✗

---

## Summary

**Result:** 2 fail, 3 not-exercised  
**No acceptance criteria passed.**

The implementation correctly fixes the conditional rendering logic but uses a non-existent field (`user.user_type`). All facility user cards fail to display roles. Organization user acceptance criteria could not be exercised due to navigation and fixture limitations.

**Required fix:** Either:
1. Frontend: Extract role from `user.role_orgs[0].role.name` (like OrganizationUsers does), or
2. Backend: Add `user_type` field to User serializer responses

**Videos generated:** 3 clips (AC1, AC3, AC5) showing navigation and cards without roles.
