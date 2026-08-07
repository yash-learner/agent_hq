# QA Plan: Show user role on user list cards

## AC1 — Role visible on card with role, regardless of edit action

### Research map

- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/users`
- components: `src/components/Facility/FacilityUsers.tsx`, `src/components/Users/UserListAndCard.tsx:UserCard`, `src/components/Users/UserListAndCard.tsx:UserGrid`
- i18n labels: "users_management", "see_details"
- auth/role: tests/.auth/user.json (admin) | tests/.auth/facilityAdmin.json (facility admin)
- permissions / facility-scoped: yes (facility users list)
- fixtures needed: facility with users (various user_type values)

### Prerequisites

- Backend running on port 9000 with fixtures loaded (`load_fixtures`)
- Facility context active
- Authenticated as admin or facility admin

### Data setup

- Prefer fixtures: `load_fixtures` provides a facility with multiple users of different types (doctor, nurse, staff, etc.)
- Fixture users from CLAUDE.md:
  - `care-doctor` (user_type: "Doctor")
  - `care-nurse` (user_type: "Nurse")
  - `care-staff` (user_type: "Staff")
  - `care-fac-admin` (user_type: facility admin role)
- These users are linked to the seeded facility via `getFacilityId()` from `tests/support/facilityId`
- No additional data setup required; fixture users already have user_type values

### Steps

1. **Action:** Navigate to `/` and log in as admin (username: `admin`, password: `admin`)
   **Expect:** Successfully logged in, redirected to home page
   **Record through:** yes

2. **Action:** Navigate to the first facility by clicking the "View" link
   **Expect:** Facility overview page loads
   **Record through:** yes

3. **Action:** Click "Toggle Sidebar" then click "Users" in the sidebar
   **Expect:** Users list page loads showing user cards in card view
   **Record through:** yes

4. **Action:** Locate a user card for `care-doctor` (or any user with a doctor role)
   **Expect:** The card displays the username and name, AND the role "Doctor" is visible below the username without needing to click any button or action
   **Record through:** yes

5. **Action:** Switch to list view by clicking the "List" tab/button (if available)
   **Expect:** Users displayed in table format with role column showing user roles
   **Record through:** yes

6. **Action:** Switch back to card view
   **Expect:** User cards display with roles visible
   **Record through:** yes

7. **Action:** Locate a user card for `care-nurse`
   **Expect:** The card displays "Nurse" role visible next to user identity details
   **Record through:** yes

### Success looks like

- Role text (e.g., "Doctor", "Nurse", "Staff") is clearly visible on each user card below the username
- Role is displayed without requiring any interaction (no hover, no click)
- Role display is consistent across different user types

## AC2 — Role section not rendered when no role, but edit action still appears

### Research map

- routes: `src/Routers/routes/OrganizationRoutes.tsx` → `/organization/:id/users`
- components: `src/pages/Organization/OrganizationUsers.tsx`, `src/components/Users/UserListAndCard.tsx:UserCard`
- auth/role: tests/.auth/user.json (admin with organization access)
- permissions: organization user management
- fixtures needed: organization with users that may have editRoleAction but potentially null/empty role names

### Prerequisites

- Backend running on port 9000 with fixtures loaded
- Authenticated as admin with organization access
- Organization context active

### Data setup

- Prefer fixtures: `load_fixtures` provides organizations with user roles
- Fixture organization from CLAUDE.md: "Government" organization accessible via Governance tab
- Organization users have role objects from `src/types/organization/organization.ts`
- If testing requires a user without a role but with edit action, may need UI creation:
  1. Navigate to `/organization/{organizationId}/users`
  2. Check existing users - fixtures should provide users with roles (Admin, Manager, Member)
  3. For this AC, verify that if a user has a role (role.name exists), it displays correctly
  4. The test is mainly to ensure the code doesn't break when roleName is present

### Steps

1. **Action:** Navigate to `/` and log in as admin (username: `admin`, password: `admin`)
   **Expect:** Successfully logged in
   **Record through:** yes

2. **Action:** Click the "Governance" tab, then click the "Government" organization link (first one)
   **Expect:** Organization page loads
   **Record through:** yes

3. **Action:** Click "Users" in the organization menu
   **Expect:** Organization users list loads showing user cards
   **Record through:** yes

4. **Action:** Locate user cards that have roles (e.g., "Admin", "Manager", "Member")
   **Expect:** Each card displays the role name clearly visible below the username
   **Record through:** yes

5. **Action:** If an "Edit" link is visible on a card (for users with edit permissions), verify the role text appears alongside it
   **Expect:** Role name is visible, and if edit button exists, it appears on the same line or nearby
   **Record through:** yes

### Success looks like

- When a user has a role, the role section is rendered with the role name visible
- When a user has an edit action button, it appears correctly whether or not there's a role
- The role section div is only present when roleName exists (inspect with browser DevTools if needed)
- No visual regression: layout looks correct with role displayed

## AC3 — Facility users with "doctor" role display "doctor" on cards

### Research map

- Same as AC1
- Specifically testing doctor role display

### Prerequisites

- Same as AC1

### Data setup

- Same as AC1
- Specifically verify `care-doctor` fixture user exists with user_type: "Doctor"

### Steps

1. **Action:** Navigate to facility users page (same as AC1 steps 1-3)
   **Expect:** Users list loads in card view
   **Record through:** yes

2. **Action:** Locate the card for user `care-doctor`
   **Expect:** Card displays with name "care-doctor" (or their full name if set in fixtures)
   **Record through:** yes

3. **Action:** Verify the role "Doctor" is visible on the card below the username
   **Expect:** The text "Doctor" appears in gray text (text-gray-500 class) on the card
   **Record through:** yes

### Success looks like

- Doctor role is clearly visible on the user card for doctor users
- Text styling matches design (gray text, proper positioning)

## AC4 — Organization users display organization-specific role names

### Research map

- Same as AC2
- Testing organization role display (Admin, Manager, Member)

### Prerequisites

- Same as AC2

### Data setup

- Same as AC2
- Fixture roles from CLAUDE.md: Admin, Manager, Member for organization users

### Steps

1. **Action:** Navigate to organization users page (same as AC2 steps 1-3)
   **Expect:** Organization users list loads
   **Record through:** yes

2. **Action:** Locate cards for users with "Admin" role
   **Expect:** Card displays "Admin" role text
   **Record through:** yes

3. **Action:** Locate cards for users with "Manager" role
   **Expect:** Card displays "Manager" role text
   **Record through:** yes

4. **Action:** Locate cards for users with "Member" role
   **Expect:** Card displays "Member" role text
   **Record through:** yes

### Success looks like

- Organization-specific role names (Admin, Manager, Member) are clearly visible on user cards
- Role display is consistent with facility user role display styling

## AC5 — Facility organization users display facility organization role names

### Research map

- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/settings/organizations/:organizationId/users`
- components: `src/pages/Facility/settings/organizations/FacilityOrganizationUsers.tsx`, `src/components/Users/UserListAndCard.tsx:UserCard`
- auth/role: tests/.auth/user.json (admin) or tests/.auth/facilityAdmin.json
- permissions: facility-scoped organization user management
- fixtures needed: facility with linked organization, organization users with roles

### Prerequisites

- Backend running on port 9000 with fixtures loaded
- Facility has a linked organization
- Authenticated as admin or facility admin

### Data setup

- Prefer fixtures: facilities created by `load_fixtures` may have organization links
- If no facility-organization link exists in fixtures, API seed or UI creation may be needed:
  1. Navigate to `/facility/{facilityId}/settings/organizations`
  2. Link an organization to the facility (if not already linked)
  3. Navigate to the organization users page within facility settings
- Organizations from fixtures: "Government" organization
- Users linked to organization should have roles defined

### Steps

1. **Action:** Navigate to `/` and log in as admin
   **Expect:** Successfully logged in
   **Record through:** yes

2. **Action:** Navigate to a facility, open sidebar, go to Settings
   **Expect:** Settings page loads
   **Record through:** yes

3. **Action:** Navigate to "Organizations" under facility settings
   **Expect:** List of linked organizations loads
   **Record through:** yes

4. **Action:** Click on an organization to view its users in the facility context
   **Expect:** Facility organization users list loads
   **Record through:** yes

5. **Action:** Verify user cards display with role names
   **Expect:** Each card shows the user's role for that organization (Admin, Manager, Member, etc.)
   **Record through:** yes

### Success looks like

- Facility organization user cards display role names correctly
- Role display is consistent with other user list views
- Layout and styling match the updated UserCard component

## Test plan / notes

### Playwright E2E coverage

- Add test in `tests/facility/users/` to verify role display on facility user cards
- Add test in `tests/organization/user/` to verify role display on organization user cards
- Tests should:
  - Navigate to user list pages (facility and organization)
  - Switch between card and list views
  - Assert role text is visible using `expect(page.getByText("Doctor")).toBeVisible()` for specific roles
  - Verify role appears for multiple user types (doctor, nurse, staff)
  - Verify role section is present when roleName exists

### CI requirements

- All existing Playwright tests must pass
- No visual regressions in user list card layouts
- TypeScript compilation must succeed
- ESLint must pass

### Manual verification notes

- Test with various user_type values to ensure all roles display correctly
- Verify responsive design: role display should work on mobile and desktop views
- Check that edit action buttons (when present) still function correctly alongside role display
- Verify accessibility: role text should be accessible to screen readers
