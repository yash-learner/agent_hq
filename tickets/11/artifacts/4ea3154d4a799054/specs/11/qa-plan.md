# QA Plan: Show user roles on facility user list cards

## AC1 — Facility user list card view shows role from role_orgs

### Research map
- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/users`
- components: `src/pages/Facility/FacilityUsers.tsx`, `src/components/Users/UserListAndCard.tsx` (UserGrid, UserCard)
- helper: `formatRoleOrgLabels()` in `UserListAndCard.tsx`
- i18n labels: "Card View", "List View", "Users"
- auth/role: `tests/.auth/user.json` (admin fixture)
- permissions: facility-scoped, requires facility access
- fixtures needed: seeded facility with users (care-nurse, care-doctor, etc.)

### Prerequisites
- Backend running with fixture data loaded (care-nurse, care-doctor users with role_orgs)
- Facility context active (any seeded facility)
- Logged in as admin user (admin/admin)

### Steps
1. **Action:** Navigate to `/facility/{facilityId}/users`
   **Expect:** User list page loads, "Card View" button is active/visible
   **Record through:** yes
   **Still after:** yes

2. **Action:** Ensure card view is selected (click "Card View" button if needed)
   **Expect:** User cards displayed in grid layout
   **Record through:** yes

3. **Action:** Locate user card for `care-nurse` by username text
   **Expect:** Card shows "Nurse" in role area (not blank, not "undefined")
   **Record through:** yes

4. **Action:** Review other user cards
   **Expect:** Each card shows role text (e.g., "Doctor", "Administrator", "Staff") or "—" for users without role_orgs
   **Record through:** yes

### Success looks like
- User cards display `organization.name` from `role_orgs` as role label
- `care-nurse` fixture shows "Nurse" (not blank)
- No JavaScript errors in console
- Role text visible without opening user detail

---

## AC2 — Facility user list table view shows role from role_orgs

### Research map
- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/users`
- components: `src/pages/Facility/FacilityUsers.tsx`, `src/components/Users/UserListAndCard.tsx` (UserList, UserListRow)
- helper: `formatRoleOrgLabels()` in `UserListAndCard.tsx`
- i18n labels: "List View", "Role" (table column header)
- auth/role: `tests/.auth/user.json` (admin fixture)
- permissions: facility-scoped, requires facility access
- fixtures needed: seeded facility with users (care-nurse, care-doctor, etc.)

### Prerequisites
- Backend running with fixture data loaded
- Facility context active
- Logged in as admin user (admin/admin)
- On `/facility/{facilityId}/users` page

### Steps
1. **Action:** Click "List View" button to switch to table view
   **Expect:** User list displayed as table with columns: Name, Status, Role, Contact Number
   **Record through:** yes
   **Still after:** yes

2. **Action:** Locate table row for `care-nurse` user (by username column)
   **Expect:** "Role" column (`td[id="role"]`) shows "Nurse" (not blank)
   **Record through:** yes

3. **Action:** Review "Role" column for other users
   **Expect:** Each row shows role text or "—" for users without role_orgs
   **Record through:** yes

### Success looks like
- Table "Role" column displays `organization.name` from `role_orgs`
- `care-nurse` fixture shows "Nurse" in Role column
- No JavaScript errors in console
- Role column populated without opening user detail

---

## AC3 — User with single role_org displays organization name

### Research map
- routes: `/facility/:facilityId/users`
- components: `UserListAndCard.tsx` (formatRoleOrgLabels)
- test fixture: `care-nurse` with `role_orgs: [{organization: {name: "Nurse"}, role: {name: "Member"}}]`
- auth/role: `tests/.auth/user.json`
- permissions: facility-scoped
- fixtures needed: `care-nurse` fixture user

### Prerequisites
- Backend running with fixture data
- Facility context active
- On `/facility/{facilityId}/users` page (card or list view)

### Steps
1. **Action:** Locate `care-nurse` user in card or list view
   **Expect:** Role displays "Nurse" (from `organization.name`)
   **Record through:** yes
   **Still after:** yes

### Success looks like
- Single role org displays organization name without decoration
- `care-nurse` shows "Nurse", not "Member" (role.name is secondary, not shown for default Member)

---

## AC4 — User with multiple role_orgs displays comma-joined roles

### Research map
- routes: `/facility/:facilityId}/users`
- components: `UserListAndCard.tsx` (formatRoleOrgLabels with `.join(", ")`)
- test fixture: User with multiple role_orgs (e.g., Doctor and Nurse memberships)
- auth/role: `tests/.auth/user.json`
- permissions: facility-scoped
- fixtures needed: User with multiple role_orgs (may require manual creation or backend fixture)

### Prerequisites
- Backend running with fixture data
- Facility context active
- User with multiple role_orgs exists (may need to create via admin panel or backend fixture)
- On `/facility/{facilityId}/users` page

### Steps
1. **Action:** Locate user with multiple role_orgs in card or list view
   **Expect:** Role displays comma-separated list, e.g., "Doctor, Nurse"
   **Record through:** yes
   **Still after:** yes

2. **Action:** Verify format is readable with no trailing/leading commas
   **Expect:** Clean comma-joined format
   **Record through:** yes

### Success looks like
- Multiple roles displayed as "Doctor, Nurse" or similar
- No formatting errors (extra commas, missing spaces)

---

## AC5 — User with non-Member role displays designation

### Research map
- routes: `/facility/:facilityId}/users`
- components: `UserListAndCard.tsx` (formatRoleOrgLabels with `· ${roleName}` append)
- test fixture: User with `role_orgs: [{organization: {name: "Doctor"}, role: {name: "Manager"}}]`
- auth/role: `tests/.auth/user.json`
- permissions: facility-scoped
- fixtures needed: User with Manager or Admin role (not default Member)

### Prerequisites
- Backend running with fixture data
- Facility context active
- User with non-Member role exists (may need to create via admin panel)
- On `/facility/{facilityId}/users` page

### Steps
1. **Action:** Locate user with Manager or Admin role in card or list view
   **Expect:** Role displays "Doctor · Manager" or "Nurse · Admin" (with middot separator)
   **Record through:** yes
   **Still after:** yes

2. **Action:** Locate user with default Member role
   **Expect:** Role displays only organization name (e.g., "Nurse"), no " · Member" suffix
   **Record through:** yes

### Success looks like
- Non-default role appends designation with middot separator
- Default "Member" role does not append " · Member"
- Format is "Doctor · Manager" (organization primary, role secondary)

---

## AC6 — User with no role_orgs displays "—" without crashing

### Research map
- routes: `/facility/:facilityId}/users`
- components: `UserListAndCard.tsx` (formatRoleOrgLabels handles empty/null role_orgs)
- test fixture: User with `role_orgs: []` or `role_orgs: null`
- auth/role: `tests/.auth/user.json`
- permissions: facility-scoped
- fixtures needed: User without role_orgs (service account or newly created user)

### Prerequisites
- Backend running with fixture data
- Facility context active
- User without role_orgs exists (may be service account or test user)
- On `/facility/{facilityId}/users` page

### Steps
1. **Action:** Locate user with no role_orgs in card or list view
   **Expect:** Role displays "—" (em dash) or empty text
   **Record through:** yes
   **Still after:** yes

2. **Action:** Verify no JavaScript errors in browser console
   **Expect:** Page renders without crashes, no "Cannot read property of undefined" errors
   **Record through:** yes

### Success looks like
- User without role_orgs shows "—" in role area
- No console errors or page crashes
- Graceful degradation for missing data

---

## AC7 — Playwright tests verify role display in card and list views

### Research map
- test file: `tests/facility/users/userListRoleDisplay.spec.ts`
- fixtures: `care-nurse` and other fixture users
- test setup: `tests/setup/*.setup.ts` for admin auth
- auth/role: `tests/.auth/user.json`

### Prerequisites
- Backend running with fixture data loaded
- Production build exists (`npm run build`)
- Playwright installed (`npm run playwright:install`)

### Steps
1. **Action:** Run Playwright tests: `npm run playwright:test -- tests/facility/users/userListRoleDisplay.spec.ts`
   **Expect:** All tests pass (card view, list view, fixture users, graceful handling)
   **Record through:** no (automated test output)

2. **Action:** Verify test output shows assertions passed for:
   - Card view role display for `care-nurse`
   - List view role display for `care-nurse`
   - Graceful handling of missing role_orgs
   **Expect:** All assertions green, no failures
   **Record through:** no

### Success looks like
- Playwright tests pass for both card and list views
- Fixture users (`care-nurse`) display role correctly in automated tests
- Test suite confirms no regressions
