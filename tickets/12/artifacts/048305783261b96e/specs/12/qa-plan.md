# QA Plan: Show user's role on facility user list cards

## AC1 — Display role org name in card view

### Research map
- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/users`
- components: `src/components/Users/UserListAndCard.tsx` (UserCard, UserGrid)
- helper: `src/Utils/utils.ts` (formatRoleOrgLabels)
- i18n labels: "name", "role", "status", "contact_number", "see_details"
- auth/role: `tests/.auth/user.json` (admin with facility access)
- permissions: facility-scoped (requires facility membership)
- fixtures needed: seeded facility with users, care-nurse user with "Nurse" role_org

### Prerequisites
- Facility context active (facility ID from fixtures)
- Multiple users seeded with various role_orgs

### Steps
1. **Action:** Navigate to `/facility/{facilityId}/users`
   **Expect:** Facility users page loads with user cards in grid view
   **Record through:** yes

2. **Action:** If not in card view, click "Card" view toggle button
   **Expect:** Users display as cards in a grid layout
   **Record through:** yes

3. **Action:** Locate a user card with role_orgs (e.g., one showing "Doctor", "Nurse", or "Administrator")
   **Expect:** Role organization name is visible on the card below the username
   **Record through:** yes

### Success looks like
- User cards display role organization names (e.g., "Doctor", "Nurse", "Administrator")
- Role text is visible and formatted properly
- No blank role fields for users with role_orgs


## AC2 — Fixture user care-nurse shows Nurse role

### Research map
- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/users`
- components: `src/components/Users/UserListAndCard.tsx`
- helper: `src/Utils/utils.ts` (formatRoleOrgLabels)
- i18n labels: "search", "name", "role"
- auth/role: `tests/.auth/user.json`
- permissions: facility-scoped
- fixtures needed: care-nurse user with "Nurse" role_org in facility

### Prerequisites
- care-nurse user exists in the facility with role_org "Nurse"
- Facility users page is accessible

### Steps
1. **Action:** Navigate to `/facility/{facilityId}/users`
   **Expect:** Facility users page loads
   **Record through:** yes

2. **Action:** Use search box to filter for "care-nurse"
   **Expect:** Search filters users, care-nurse user appears
   **Record through:** yes

3. **Action:** Inspect the care-nurse user card (in card view) or table row (in list view)
   **Expect:** The role field displays "Nurse" (not blank or em dash)
   **Record through:** yes

### Success looks like
- care-nurse user card/row shows "Nurse" in the role field
- No blank or missing role information


## AC3 — Multiple role_orgs display comma-separated

### Research map
- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/users`
- components: `src/components/Users/UserListAndCard.tsx`
- helper: `src/Utils/utils.ts` (formatRoleOrgLabels with join)
- auth/role: `tests/.auth/user.json`
- permissions: facility-scoped
- fixtures needed: user with multiple role_orgs (e.g., both "Doctor" and "Nurse")

### Prerequisites
- At least one user in the facility has multiple role_orgs assigned
- Facility users page is accessible

### Steps
1. **Action:** Navigate to `/facility/{facilityId}/users`
   **Expect:** Facility users page loads
   **Record through:** yes

2. **Action:** Locate a user with multiple role organizations (if available)
   **Expect:** User card or table row shows comma-separated organization names
   **Record through:** yes

3. **Action:** Verify the format is readable (e.g., "Doctor, Nurse" or "Administrator, Staff")
   **Expect:** Multiple roles are comma-separated without truncation
   **Record through:** yes

### Success looks like
- Users with multiple role_orgs show all organization names
- Format is "OrgName1, OrgName2" (comma-space separated)
- All role names are visible and not truncated


## AC4 — Non-Member roles show designation

### Research map
- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/users`
- components: `src/components/Users/UserListAndCard.tsx`
- helper: `src/Utils/utils.ts` (formatRoleOrgLabels with role.name check)
- auth/role: `tests/.auth/user.json`
- permissions: facility-scoped
- fixtures needed: user with role_orgs where role.name is "Manager" or "Admin" (not default "Member")

### Prerequisites
- At least one user has a role_org with role.name != "Member" (e.g., "Manager", "Admin")
- Facility users page is accessible

### Steps
1. **Action:** Navigate to `/facility/{facilityId}/users`
   **Expect:** Facility users page loads
   **Record through:** yes

2. **Action:** Locate a user with a non-Member designation (e.g., Manager or Admin)
   **Expect:** User card or table row shows "OrgName · Designation" (e.g., "Doctor · Manager")
   **Record through:** yes

3. **Action:** Verify the format uses middle dot separator
   **Expect:** Format is "OrgName · RoleName" with middle dot (·) separator
   **Record through:** yes

### Success looks like
- Users with Manager/Admin roles show designation after organization name
- Format is "Doctor · Manager" or "Nurse · Admin" (middle dot separator)
- Default "Member" roles do not show designation


## AC5 — Empty role_orgs shows em dash without crashing

### Research map
- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/users`
- components: `src/components/Users/UserListAndCard.tsx`
- helper: `src/Utils/utils.ts` (formatRoleOrgLabels returns "—" for empty)
- auth/role: `tests/.auth/user.json`
- permissions: facility-scoped
- fixtures needed: user with empty role_orgs array or no role_orgs

### Prerequisites
- At least one user in the facility has no role_orgs or empty role_orgs array
- Facility users page is accessible

### Steps
1. **Action:** Navigate to `/facility/{facilityId}/users`
   **Expect:** Facility users page loads without errors
   **Record through:** yes

2. **Action:** Locate a user with no role assignments (no role_orgs)
   **Expect:** User card or table row displays em dash (—) in role field
   **Record through:** yes

3. **Action:** Verify no JavaScript errors or crash
   **Expect:** Page renders successfully, no error boundaries or console errors
   **Record through:** yes

### Success looks like
- Users without role_orgs show em dash (—) or blank field
- No crashes, error boundaries, or console errors
- Page remains functional and responsive


## AC6 — Table view displays formatted role_orgs

### Research map
- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/users`
- components: `src/components/Users/UserListAndCard.tsx` (UserListRow)
- helper: `src/Utils/utils.ts` (formatRoleOrgLabels)
- i18n labels: "name", "status", "role", "contact_number"
- auth/role: `tests/.auth/user.json`
- permissions: facility-scoped
- fixtures needed: seeded facility with users

### Prerequisites
- Facility context active
- Multiple users seeded with various role_orgs

### Steps
1. **Action:** Navigate to `/facility/{facilityId}/users`
   **Expect:** Facility users page loads
   **Record through:** yes

2. **Action:** Switch to list/table view (click "List" view toggle button)
   **Expect:** Users display in table format with columns: Name, Status, Role, Contact Number
   **Record through:** yes

3. **Action:** Inspect the "Role" column for multiple users
   **Expect:** Role column displays formatted role_orgs matching card view pattern
   **Record through:** yes

4. **Action:** Verify care-nurse row shows "Nurse" in the Role column
   **Expect:** care-nurse table row displays "Nurse" (not blank)
   **Record through:** yes

### Success looks like
- Table view has a "Role" column header
- Each row displays formatted role_orgs (organization names)
- care-nurse shows "Nurse" in Role column
- Format matches card view (comma-separated for multiple, em dash for empty)


## AC7 — No regression for organization user lists with explicit roleName prop

### Research map
- routes: `src/Routers/routes/OrganizationRoutes.tsx` → organization user lists
- components: `src/components/Users/UserListAndCard.tsx` (UserCard with roleName prop)
- i18n labels: various
- auth/role: `tests/.auth/user.json`
- permissions: organization-scoped
- fixtures needed: organization with users

### Prerequisites
- Organization context active
- Users assigned to organization with explicit role names passed as prop

### Steps
1. **Action:** Navigate to an organization user list page (e.g., `/organization/{orgId}/users`)
   **Expect:** Organization users page loads
   **Record through:** yes

2. **Action:** Inspect user cards or table rows
   **Expect:** Role field displays the explicit roleName prop value (e.g., "Member", "Manager", "Admin")
   **Record through:** yes

3. **Action:** Verify that organization user cards show passed role prop, not formatted role_orgs
   **Expect:** Role display matches what was explicitly passed (no regression)
   **Record through:** yes

### Success looks like
- Organization user lists display explicit roleName prop values
- No change in behavior for organization-scoped user cards
- Facility user lists use formatRoleOrgLabels, organization lists use passed prop
