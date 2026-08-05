# QA Plan: Show user's role on facility user list cards

## AC1 — Card view displays role org name

### Research map
- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/users`
- components: `src/components/Users/UserListAndCard.tsx` (UserGrid, UserCard)
- i18n labels: "Users", "See Details"
- auth/role: `tests/.auth/user.json` (admin)
- permissions: Yes (facility-scoped)
- fixtures needed: Facility with users having role_orgs

### Prerequisites
- Admin user logged in
- Facility context active
- Backend running with users having role_orgs data

### Steps
1. **Action:** Navigate to Facility → Users page (card view default)
   **Expect:** User cards display with role organization names visible below username
   **Record through:** yes
   
2. **Action:** Observe role labels on user cards
   **Expect:** Each card shows role org name(s) like "Doctor", "Nurse", "Administrator" from role_orgs
   **Record through:** yes

### Success looks like
- User cards display organization.name from role_orgs
- Role labels visible and properly formatted
- No blank/missing role displays for users with role_orgs

## AC2 — Fixture user care-nurse shows Nurse role

### Research map
- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/users`
- components: `src/components/Users/UserListAndCard.tsx`
- i18n labels: "Users", "Search"
- auth/role: `tests/.auth/user.json` (admin)
- permissions: Yes (facility-scoped)
- fixtures needed: care-nurse user with Nurse role_org

### Prerequisites
- Admin user logged in
- Facility where care-nurse is assigned
- care-nurse has role_orgs with organization.name = "Nurse"

### Steps
1. **Action:** Navigate to Facility → Users page
   **Expect:** User list loads successfully
   **Record through:** yes

2. **Action:** Search for "care-nurse" user (if search available) or scroll to find
   **Expect:** care-nurse card visible in results
   **Record through:** yes

3. **Action:** Observe role label on care-nurse card
   **Expect:** Card displays **"Nurse"** (not blank or undefined)
   **Record through:** yes

### Success looks like
- care-nurse user card shows "Nurse" role clearly
- No blank role field
- Confirms role_orgs data is properly loaded and displayed

## AC3 — Multiple role_orgs display comma-separated

### Research map
- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/users`
- components: `src/components/Users/UserListAndCard.tsx`, `src/Utils/utils.ts` (formatRoleOrgLabels)
- i18n labels: "Users"
- auth/role: `tests/.auth/user.json` (admin)
- permissions: Yes (facility-scoped)
- fixtures needed: User with multiple role_orgs (e.g., Doctor and Nurse)

### Prerequisites
- Admin user logged in
- User exists with multiple role_orgs assignments

### Steps
1. **Action:** Create or identify a user with multiple role org memberships (e.g., Doctor, Nurse)
   **Expect:** User saved successfully with multiple role_orgs
   **Record through:** yes

2. **Action:** Navigate to Facility → Users page and locate the multi-role user
   **Expect:** User card visible in list
   **Record through:** yes

3. **Action:** Observe role label on user card
   **Expect:** Display shows comma-separated names: **"Doctor, Nurse"** (or similar)
   **Record through:** yes

### Success looks like
- Multiple organization names joined with comma and space
- All role org names visible without truncation
- Proper formatting maintained

## AC4 — Non-Member roles show designation

### Research map
- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/users`
- components: `src/components/Users/UserListAndCard.tsx`, `src/Utils/utils.ts` (formatRoleOrgLabels)
- i18n labels: "Users"
- auth/role: `tests/.auth/user.json` (admin)
- permissions: Yes (facility-scoped)
- fixtures needed: User with role_orgs where role.name = "Manager" or "Admin"

### Prerequisites
- Admin user logged in
- User exists with role_orgs having role.name other than "Member"

### Steps
1. **Action:** Create or identify a user with role.name = "Manager" (e.g., Doctor · Manager)
   **Expect:** User created/identified successfully
   **Record through:** yes

2. **Action:** Navigate to Facility → Users page and locate the user
   **Expect:** User card visible
   **Record through:** yes

3. **Action:** Observe role label format
   **Expect:** Display shows **"Doctor · Manager"** with middle dot separator
   **Record through:** yes

4. **Action:** Verify users with role.name = "Member" do NOT show designation
   **Expect:** Display shows only organization name: **"Doctor"** (no "· Member")
   **Record through:** yes

### Success looks like
- Non-Member roles display: `{organization.name} · {role.name}`
- Member roles display only: `{organization.name}`
- Middle dot separator used correctly
- Proper spacing around separator

## AC5 — Empty role_orgs shows em dash without crashing

### Research map
- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/users`
- components: `src/components/Users/UserListAndCard.tsx`, `src/Utils/utils.ts` (formatRoleOrgLabels)
- i18n labels: "Users"
- auth/role: `tests/.auth/user.json` (admin)
- permissions: Yes (facility-scoped)
- fixtures needed: User with empty role_orgs array

### Prerequisites
- Admin user logged in
- User exists with no role_orgs assignments

### Steps
1. **Action:** Create or identify a user with no role org memberships
   **Expect:** User created/identified successfully
   **Record through:** yes

2. **Action:** Navigate to Facility → Users page and locate the user
   **Expect:** Page loads without errors, user card visible
   **Record through:** yes

3. **Action:** Observe role label on user card
   **Expect:** Display shows **"—"** (em dash) or nothing, no crash or error
   **Record through:** yes

4. **Action:** Verify browser console has no errors
   **Expect:** No JavaScript errors or React crashes
   **Record through:** yes

### Success looks like
- Page renders successfully
- User card displays em dash for empty role_orgs
- No console errors or crashes
- Application remains functional

## AC6 — Table view displays formatted role_orgs

### Research map
- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/users`
- components: `src/components/Users/UserListAndCard.tsx` (UserList, UserListRow)
- i18n labels: "Users", "Role", "List"
- auth/role: `tests/.auth/user.json` (admin)
- permissions: Yes (facility-scoped)
- fixtures needed: Facility with users having role_orgs

### Prerequisites
- Admin user logged in
- Facility context active
- Multiple users with various role_orgs configurations

### Steps
1. **Action:** Navigate to Facility → Users page
   **Expect:** User list loads in card view by default
   **Record through:** yes

2. **Action:** Click "List" view toggle button
   **Expect:** View switches to table/list layout with columns
   **Record through:** yes

3. **Action:** Observe Role column header and cells
   **Expect:** Column header shows "Role", each row has role cell with formatted content
   **Record through:** yes

4. **Action:** Verify role column displays role_orgs consistently with card view
   **Expect:** Same formatting: organization names, comma separation, designation handling
   **Record through:** yes

5. **Action:** Locate care-nurse in table view
   **Expect:** Role column shows **"Nurse"** for care-nurse row
   **Record through:** yes

6. **Action:** Check user with multiple roles in table
   **Expect:** Role column shows comma-separated names: **"Doctor, Nurse"**
   **Record through:** yes

7. **Action:** Check user with empty role_orgs in table
   **Expect:** Role column shows **"—"** (em dash), no crash
   **Record through:** yes

### Success looks like
- Table view Role column displays formatted role_orgs
- Formatting matches card view pattern
- All edge cases handled (multiple roles, empty roles, designations)
- No regressions or crashes
- care-nurse shows "Nurse" in table

## AC7 — No regression to organization user lists with explicit roleName prop

### Research map
- routes: `src/Routers/routes/OrganizationRoutes.tsx` → `/organization/:orgId/users`
- components: `src/components/Users/UserListAndCard.tsx` (UserCard)
- i18n labels: "Users"
- auth/role: `tests/.auth/user.json` (admin)
- permissions: Organization-scoped
- fixtures needed: Organization with users

### Prerequisites
- Admin user logged in
- Organization context active
- Organization with user memberships

### Steps
1. **Action:** Navigate to Organization → Users page (if accessible)
   **Expect:** Organization user list loads
   **Record through:** yes

2. **Action:** Observe role displays on organization user cards
   **Expect:** Cards display passed roleName prop (e.g., "Member", "Manager", "Admin")
   **Record through:** yes

3. **Action:** Verify organization cards do NOT show role_orgs formatting
   **Expect:** Only explicit roleName prop is displayed (no org name from role_orgs)
   **Record through:** yes

### Success looks like
- Organization user lists unaffected by role_orgs changes
- Explicit roleName prop still respected
- No unintended formatting applied
- Backward compatibility maintained

## Notes

- All tests should be executed on a running instance with backend API connected
- Ensure fixtures are loaded (`npm run playwright:db-reset` or equivalent)
- Backend must return role_orgs data on facility users endpoint
- Tests can be partially automated with Playwright (see `tests/facility/users/userRoleDisplay.spec.ts`)
- Manual verification recommended for visual formatting and spacing
