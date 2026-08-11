# QA Report for Ticket 50: Show user role in sidebar nav menu

**QA Status: ❌ CRITICAL BLOCKER FOUND**

## Executive Summary

All acceptance criteria **FAIL** due to a critical mismatch between frontend implementation and backend API. The implementation displays `{t(user.user_type)}` but the backend API does not return a `user_type` field, resulting in empty role badges for all users.

### Root Cause

- **Frontend types** (src/types/user/user.ts:18): Define `UserBase.user_type: UserType`
- **Backend API** (/api/v1/users/getcurrentuser/): Returns `role_orgs` array but **no `user_type` field**
- **Result**: Badge element renders but contains no text

### Impact

- Role badges are completely non-functional - they render as empty spans
- Clinical safety goal (making active role visible) is not met
- All facility users affected (doctors, nurses, staff, volunteers, administrators)

---

## Live-flow Criteria

### AC1: Role badge displays for facility user with doctor role

**Verdict:** ❌ FAIL

**What was tested:**
1. Logged in as `admin` user via UI
2. Navigated to facility overview page (181a32f1-8844-4d68-bc33-6ccaf273e5d3)
3. Opened sidebar user dropdown by clicking footer button
4. Inspected dropdown content for role badge

**Observed behavior:**
- ✅ Login successful
- ✅ Sidebar visible with user info
- ✅ Dropdown opens on click
- ✅ Badge element renders (`<span data-slot="badge" class="...">`)
- ❌ Badge is **completely empty** - no text content
- ❌ No "Doctor", "Administrator", or any role text visible

**Technical diagnosis:**
```
API Response (/api/v1/users/admin/):
{
  "username": "admin",
  "first_name": "Admin",
  "last_name": "User",
  "role_orgs": [...],   ← Has this
  // NO user_type field   ← Missing this
}

Frontend Implementation (nav-user.tsx:95-97):
<Badge variant="secondary" className="text-xs">
  {t(user.user_type)}  ← Evaluates to t(undefined) → ""
</Badge>
```

**Video:** [ac1-doctor-role-badge.webm](specs/50/videos/ac1-doctor-role-badge.webm)

**Blocker:** `validation-error` - Implementation expects `user.user_type` but API contract doesn't provide it

---

### AC2: Role badge shows "Administrator" for care-fac-admin

**Verdict:** ❌ FAIL

**What was tested:**
1. Logged in as `care-fac-admin` / `Ohcn@123`
2. Navigated to facility page
3. Opened sidebar dropdown
4. Checked for "Administrator" badge

**Observed behavior:**
- ✅ Login successful as Ubika Lad (care-fac-admin)
- ✅ Dropdown opens
- ✅ Shows name and username correctly
- ❌ Badge element empty - no "Administrator" text

**API check:**
```bash
$ curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:9000/api/v1/users/care-fac-admin/
# Returns role_orgs with "Facility Admin" role, but no user_type field
```

**Video:** [ac2-fac-admin-badge.webm](specs/50/videos/ac2-fac-admin-badge.webm)

**Blocker:** `validation-error` - Same root cause as AC1

---

### AC3: Profile navigation works with role badge visible

**Verdict:** ❌ FAIL

**What was tested:**
1. Logged in as admin
2. Opened dropdown (badge empty)
3. Clicked "Profile" menu item
4. Navigated to /facility/{id}/users/admin
5. Opened dropdown again to verify badge persists

**Observed behavior:**
- ✅ Profile navigation works correctly
- ✅ Page loads user profile
- ✅ Dropdown reopens after navigation
- ❌ Badge empty before Profile click
- ❌ Badge still empty after navigation
- Profile **functionality is not broken**, but acceptance criterion requires badge to be visible

**Video:** [ac3-profile-navigation.webm](specs/50/videos/ac3-profile-navigation.webm)

**Blocker:** `validation-error` - Badge never populates due to missing user_type

---

### AC4: Logout works with role badge present

**Verdict:** ⚠️ PARTIAL PASS (Logout functional, badge non-functional)

**What was tested:**
1. Logged in as admin
2. Opened dropdown (badge empty)
3. Clicked "Log Out"
4. Verified redirect to /login

**Observed behavior:**
- ✅ Logout menu item visible and clickable
- ✅ Logout completes successfully
- ✅ Session cleared, redirected to /login
- ❌ Badge was empty throughout (not "present" as criterion requires)

**Note:** The criterion states "Logout completes successfully" which it does. However, it also implies the badge should be "present" (i.e., visible with content). Since the badge is structurally present but empty, this is a **partial pass** - the core functionality (logout) works, but the badge requirement is not met.

**Video:** [ac4-logout-functionality.webm](specs/50/videos/ac4-logout-functionality.webm)

**Status:** Marking as **FAIL** because acceptance criterion requires badge to be present (with content), not just the HTML element.

**Blocker:** `validation-error` - Same root cause

---

### AC5: Patient nav menu has no role badge

**Verdict:** ❓ NOT EXERCISED

**Reason:** Patient OTP login flow not available in fixture data

**What was attempted:**
- Reviewed qa-plan Data setup steps
- Patient login requires:
  1. Phone number + OTP generation
  2. Backend SMS/OTP infrastructure
  3. Test patient with valid credentials
- Fixture users (care-doctor, care-fac-admin, etc.) are facility users, not patients
- No patient OTP credentials in setup-notes.md or tests/.auth/patient.json

**Code inspection (not scored):**
PatientNavUser component (src/components/ui/sidebar/nav-user.tsx:144-221) correctly does **not** include a role badge. Implementation shows:
- Avatar
- Patient name/phone
- Logout button
- No Badge component imported or rendered

**Blocker:** `missing-test-data` - Cannot test patient login without OTP infrastructure

**Plan steps run:** none (pre-execution blocker)

---

## Limits

### Missing user_type Field

The core issue preventing all criteria from passing is architectural:

**Frontend expectation:**
```typescript
// src/types/user/user.ts:18
export interface UserBase {
  user_type: UserType;  // "doctor" | "nurse" | "staff" | "volunteer" | "administrator"
}
```

**Backend reality:**
```json
{
  "role_orgs": [
    {
      "role": {
        "name": "Facility Admin",
        "contexts": ["FACILITY"]
      }
    }
  ]
  // No user_type field
}
```

**Resolution needed:**
1. **Backend option:** Add `user_type` field derived from role_orgs
2. **Frontend option:** Derive display role from role_orgs array instead of user_type
3. **Migration:** If user_type was deprecated, update types and implementation

### Patient OTP Login

Patient login requires:
- Backend OTP generation endpoint
- Test patient credentials
- Typically outside QA scope for facility-focused features

Given that PatientNavUser correctly **doesn't** use the Badge component, and the bug is facility-user-specific, patient testing is lower priority.

---

## Summary

| Criterion | Verdict | Blocker | Evidence |
|-----------|---------|---------|----------|
| AC1 | ❌ FAIL | validation-error | ac1-doctor-role-badge.webm |
| AC2 | ❌ FAIL | validation-error | ac2-fac-admin-badge.webm |
| AC3 | ❌ FAIL | validation-error | ac3-profile-navigation.webm |
| AC4 | ❌ FAIL | validation-error | ac4-logout-functionality.webm |
| AC5 | ❓ NOT EXERCISED | missing-test-data | N/A |

**All facility-user criteria fail due to API contract mismatch. The implementation is structurally correct (Badge component, translations exist, positioning correct) but user.user_type is undefined for all users.**

## Recommendation

**🛑 BLOCK MERGE** until backend provides user_type field or frontend is updated to derive role from role_orgs.

This is a P0 clinical-safety issue - the feature's entire purpose (making role visible to prevent wrong-session actions) is not met.
