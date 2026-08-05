# QA Plan: Show User Role on User List Cards

## AC1 — Role visible in card view alongside name and username

### Research map
- routes: src/Routers/routes/FacilityRoutes.tsx → /facility/:facilityId/users
- components: src/components/Facility/FacilityUsers.tsx, src/components/Users/UserListAndCard.tsx (UserCard, UserGrid)
- i18n labels: "Users Management", "Card", "List", "See Details"
- auth/role: tests/.auth/user.json (admin)
- permissions / facility-scoped: yes (facility-scoped user management)
- fixtures needed: seeded facility with multiple users having different roles

### Prerequisites
- Backend running with test fixtures loaded (admin, care-doctor, care-nurse, care-staff, care-volunteer)
- Logged in as admin user
- Facility context active

### Steps
1. **Action:** Navigate to http://localhost:4000/ and log in as admin (username: admin, password: admin)
   **Expect:** Login successful, redirected to dashboard
   **Record through:** yes

2. **Action:** Click on "View" link for first available facility
   **Expect:** Facility page loads
   **Record through:** yes

3. **Action:** Click "Toggle Sidebar" button, then click "Users" link in sidebar
   **Expect:** Users Management page loads with URL /facility/:facilityId/users
   **Record through:** yes

4. **Action:** Verify view is set to "Card" view (should be default or click "Card" tab if on "List")
   **Expect:** User cards displayed in grid layout
   **Record through:** yes

5. **Action:** Observe user cards without opening any user details
   **Expect:** Each card shows:
   - User avatar
   - User full name
   - Username (below name)
   - **Role displayed below username** (e.g., "doctor", "nurse", "staff", "volunteer", "administrator")
   - User status indicator (if applicable)
   - "See Details" button
   **Record through:** yes

### Success looks like
- Role is visible on every user card in card view
- Role appears alongside (below) the username without needing to click "See Details"
- Multiple user cards show different roles (doctor, nurse, staff, etc.)

## AC2 — Doctor role displays correctly

### Research map
- Same as AC1

### Prerequisites
- Same as AC1
- At least one user with role "doctor" exists (care-doctor fixture)

### Steps
1. **Action:** Follow steps 1-4 from AC1 to reach Users Management page in card view
   **Expect:** User cards displayed
   **Record through:** no

2. **Action:** Locate the card for user "care-doctor" or any user with doctor role
   **Expect:** Card displays with user information
   **Record through:** yes

3. **Action:** Verify the role text on the card
   **Expect:** Role text reads "doctor" (displayed in gray text below username)
   **Record through:** yes

### Success looks like
- "doctor" role is clearly visible on the user card for doctor users
- Text is readable and properly styled

## AC3 — Nurse role displays correctly

### Research map
- Same as AC1

### Prerequisites
- Same as AC1
- At least one user with role "nurse" exists (care-nurse fixture)

### Steps
1. **Action:** On Users Management page in card view, locate the card for user "care-nurse" or any user with nurse role
   **Expect:** Card displays with user information
   **Record through:** yes

2. **Action:** Verify the role text on the card
   **Expect:** Role text reads "nurse" (displayed in gray text below username)
   **Record through:** yes

### Success looks like
- "nurse" role is clearly visible on the user card for nurse users
- Text is readable and properly styled

## AC4 — Administrator role displays correctly

### Research map
- Same as AC1

### Prerequisites
- Same as AC1
- At least one user with role "administrator" exists (admin fixture or care-fac-admin)

### Steps
1. **Action:** On Users Management page in card view, locate the card for user "admin" or "care-fac-admin" or any user with administrator role
   **Expect:** Card displays with user information
   **Record through:** yes

2. **Action:** Verify the role text on the card
   **Expect:** Role text reads "administrator" (displayed in gray text below username)
   **Record through:** yes

### Success looks like
- "administrator" role is clearly visible on the user card for administrator users
- Text is readable and properly styled

## AC5 — All cards show role without opening details

### Research map
- Same as AC1

### Prerequisites
- Same as AC1
- Multiple users with different roles exist in the facility

### Steps
1. **Action:** On Users Management page in card view, observe all visible user cards
   **Expect:** Multiple user cards visible in grid layout
   **Record through:** yes

2. **Action:** Verify each card shows role information without clicking any buttons
   **Expect:** Every card displays:
   - User name
   - Username
   - **Role (doctor, nurse, staff, volunteer, or administrator)**
   - See Details button (not clicked)
   **Record through:** yes

3. **Action:** Scroll down to view more user cards if paginated
   **Expect:** All cards consistently show role information
   **Record through:** yes

### Success looks like
- Role is visible on all user cards
- No need to click "See Details" to see user roles
- Operators can quickly scan roles during access reviews
- Layout is consistent across all cards

## AC6 — List view continues to display role correctly

### Research map
- Same as AC1, plus list view rendering in UserListAndCard component

### Prerequisites
- Same as AC1

### Steps
1. **Action:** On Users Management page, ensure you're in card view first
   **Expect:** User cards displayed
   **Record through:** no

2. **Action:** Click the "List" tab to switch to list view
   **Expect:** View changes to table/list format
   **Record through:** yes

3. **Action:** Observe the list view table
   **Expect:** Table displays with columns including:
   - User information (name, username)
   - Role column with roles visible
   - Other user details
   **Record through:** yes

4. **Action:** Switch back to "Card" view by clicking "Card" tab
   **Expect:** Returns to card view with roles visible on cards
   **Record through:** yes

### Success looks like
- List view continues to show role column as it did before
- No regression in list view functionality
- Both card and list views display role information correctly
- Switching between views works smoothly
