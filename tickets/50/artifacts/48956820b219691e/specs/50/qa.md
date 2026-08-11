# QA Report: Ticket 50 — Show user role in sidebar nav menu

## Summary

**All acceptance criteria not exercised due to missing test data.** The implementation expects `user.user_type` field (as defined in `UserBase` interface), but the backend fixtures return `user_type: null`. The backend API has migrated to a `role_orgs` array structure, creating a data model mismatch with the frontend implementation.

---

## Live-flow Attempts

### AC1: Role badge displays for facility user with doctor role

**Verdict:** `not-exercised`  
**Blocker:** `missing-test-data`  
**Blocker category:** `missing-test-data`

**What was attempted:**

1. **UI seed attempt (qa-plan steps 1-2):**
   - Logged in with fixture user `admin` / `admin` (care-doctor credentials also attempted)
   - Navigated to facility overview `/facility/5129ac6f-2b95-4eed-b406-89ea282c5086/overview`
   - Authenticated shell confirmed (sidebar visible)
   - Clicked user avatar button in sidebar footer
   - Dropdown opened successfully

2. **API seed attempt:**
   - Queried `/api/v1/users/getcurrentuser/` for admin user: returned `user_type: null`
   - Queried `/api/v1/users/care-doctor/` with doctor credentials: returned `user_type: null`
   - Attempted PATCH `/api/v1/users/care-doctor/` with `{"user_type":"doctor", "first_name":"Kamala", "last_name":"Mander", "phone_number":"+919876543210", "gender":"male"}`
   - Result: PATCH succeeded (200 OK), but response still shows `user_type: null`

**Root cause:**

The backend API response includes a `role_orgs` array with nested role objects:
```json
{
  "username": "care-doctor",
  "user_type": null,
  "role_orgs": [{
    "role": {
      "name": "Doctor",
      "contexts": ["FACILITY", "GOVT_ORG"],
      ...
    },
    ...
  }]
}
```

The frontend implementation at `src/components/ui/sidebar/nav-user.tsx:96` expects:
```typescript
<Badge variant="secondary" className="text-xs">
  {t(user.user_type)}
</Badge>
```

The `UserBase` TypeScript interface defines `user_type: UserType` as required, but the runtime data returns null.

**Evidence:**

[ac1-doctor-badge](specs/50/videos/ac1-doctor-badge.webm)

---

### AC2: Role badge shows "Administrator" for care-fac-admin

**Verdict:** `not-exercised`  
**Blocker:** Same as AC1 — backend returns `user_type: null` for all fixture users  
**Blocker category:** `missing-test-data`

**What was attempted:**

- Reviewed backend response for care-fac-admin user
- Found same data model issue: `user_type: null`, with role information only in `role_orgs` array
- Cannot test administrator badge display when user_type field is unavailable

---

### AC3: Profile navigation works with role badge visible

**Verdict:** `not-exercised`  
**Blocker:** Cannot verify badge visibility on profile page when badge doesn't render due to null user_type  
**Blocker category:** `missing-test-data`

---

### AC4: Logout works with role badge present

**Verdict:** `not-exercised`  
**Blocker:** Cannot verify badge doesn't interfere with logout when badge doesn't render due to null user_type  
**Blocker category:** `missing-test-data`

---

### AC5: Patient nav menu has no role badge

**Verdict:** `not-exercised`  
**Blocker:** Cannot verify patients don't show badge when facility users don't show it either due to missing data  
**Blocker category:** `missing-test-data`

**Note:** This criterion tests the *absence* of a badge on patient accounts. Testing absence when the badge doesn't render for facility users either would not be meaningful.

---

## Limits

### Data Model Mismatch

The implementation was merged assuming the backend provides a top-level `user.user_type` field, consistent with the `UserBase` TypeScript interface. However:

- Backend fixtures (`load_fixtures`) return `user_type: null` for all users
- Backend API uses `role_orgs` array structure with nested `role.name` instead
- TypeScript types claim `user_type` is required, but runtime data doesn't provide it
- No adapter layer exists to extract a user_type-equivalent from role_orgs

This appears to be a breaking change in the backend user model that wasn't reflected in the frontend implementation or type definitions.

### Attempted Mitigations

1. **UI creation:** N/A (user_type is not editable through UI forms)
2. **API seed:** Attempted PATCH to set user_type, but field remains null after successful update
3. **Alternative fixtures:** Checked multiple fixture users (admin, care-doctor, care-fac-admin) — all return user_type: null

### Recommendation

The feature implementation is correct for the specified interface (`UserBase.user_type`), but cannot be exercised against the current backend. One of:

- Backend fixtures need to populate user_type field
- Backend API needs to expose user_type derived from role_orgs
- Frontend implementation needs adapter to extract primary role from role_orgs array
- TypeScript types need to mark user_type as nullable and implementation needs null-safety

---

## Test Artifacts

- **Videos:** `specs/50/videos/ac1-doctor-badge.webm` (dropdown open with no badge visible)
- **Logs:** `specs/50/qa-logs/ac1-doctor-badge.log` (full interaction transcript)
- **Drivers:** `specs/50/qa-drivers/ac1-doctor-badge.mjs` through `ac5-patient-no-badge.mjs`
