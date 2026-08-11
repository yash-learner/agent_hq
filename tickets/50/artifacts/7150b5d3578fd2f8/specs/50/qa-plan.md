# QA Plan for Ticket 50: Show user role in sidebar nav menu

## AC 1 — Role badge displays for facility user with doctor role

### Research map

- routes: src/Routers/routes/FacilityRoutes.tsx → /facility/:facilityId/
- components: src/components/ui/sidebar/nav-user.tsx (FacilityNavUser)
- i18n labels: "doctor", "nurse", "staff", "volunteer", "administrator"
- auth/role: tests/.auth/user.json (admin/admin) OR create care-doctor fixture
- permissions / facility-scoped: yes (requires facility context)
- fixtures needed: seeded facility from load_fixtures (fixture ID from getFacilityId() or setup)

### Prerequisites

- Backend running on port 9000 with load_fixtures executed
- Frontend production build running (npm run build && npm run preview)
- Facility context available

### Data setup

- Prefer fixtures: load_fixtures provides test users including care-doctor
- Credentials: care-doctor / Ohcn@123 (from backend fixture constants)
- Provenance: documented in care backend fixtures and CLAUDE.md fixture table
- If care-doctor not available: use admin/admin (admin user from tests/setup/auth.setup.ts)
- Verify: after login, sidebar should be visible with user avatar in footer

### Steps

1. **Action:** Go to `/login`, fill username "care-doctor" (or "admin"), password "Ohcn@123" (or "admin"), click Login
   **Expect:** Redirect to homepage showing "Hey [name]" heading
   **Record through:** yes
   **Still after:** yes

2. **Action:** Click the user avatar/button in the sidebar footer (displays name and username)
   **Expect:** Dropdown menu opens showing avatar, full name, username, and a badge with text "Doctor" (or "Administrator" for admin user)
   **Record through:** yes
   **Still after:** yes

### Success looks like

- Badge component visible next to username in dropdown
- Badge displays translated role text ("Doctor", "Nurse", "Staff", "Volunteer", or "Administrator")
- Badge has gray/secondary styling (variant="secondary")

---

## AC 2 — Role badge shows "Administrator" for care-fac-admin

### Research map

- routes: src/Routers/routes/FacilityRoutes.tsx → /facility/:facilityId/
- components: src/components/ui/sidebar/nav-user.tsx (FacilityNavUser)
- i18n labels: "administrator"
- auth/role: tests/setup/facilityAdmin.setup.ts (care-fac-admin / Ohcn@123)
- permissions / facility-scoped: yes
- fixtures needed: seeded facility from load_fixtures, care-fac-admin user

### Prerequisites

- Backend running on port 9000 with load_fixtures executed
- Frontend production build running
- Facility context available

### Data setup

- Prefer fixtures: care-fac-admin user created by load_fixtures
- Credentials: care-fac-admin / Ohcn@123
- Provenance: tests/setup/facilityAdmin.setup.ts line 10-11, CLAUDE.md fixture table
- User type: administrator (from backend UserType enum)
- Verify: after login, sidebar visible with user info

### Steps

1. **Action:** Go to `/login`, fill username "care-fac-admin", password "Ohcn@123", click Login
   **Expect:** Redirect to homepage showing "Hey [name]" heading
   **Record through:** yes
   **Still after:** yes

2. **Action:** Click the user avatar/button in the sidebar footer
   **Expect:** Dropdown menu opens with badge showing "Administrator"
   **Record through:** yes
   **Still after:** yes

### Success looks like

- Badge text reads "Administrator" (translated from user_type)
- Badge positioned next to username in dropdown header
- Dropdown still shows Profile and Logout menu items below

---

## AC 3 — Profile navigation works with role badge visible

### Research map

- routes: /facility/:facilityId/users/:username (profile page)
- components: src/components/ui/sidebar/nav-user.tsx (FacilityNavUser)
- i18n labels: "Profile", "nurse"
- auth/role: tests/setup/nurse.setup.ts (care-nurse / Ohcn@123)
- permissions / facility-scoped: yes
- fixtures needed: seeded facility, care-nurse user

### Prerequisites

- Backend running with load_fixtures
- Frontend production build running
- Signed in as care-nurse user

### Data setup

- Prefer fixtures: care-nurse user from load_fixtures
- Credentials: care-nurse / Ohcn@123
- Provenance: tests/setup/nurse.setup.ts line 11-12, CLAUDE.md fixture table
- User type: nurse
- Verify: sidebar visible after login

### Steps

1. **Action:** If not already logged in, go to `/login`, fill username "care-nurse", password "Ohcn@123", click Login
   **Expect:** Redirect to homepage
   **Record through:** yes

2. **Action:** Click user avatar in sidebar footer to open dropdown
   **Expect:** Dropdown displays with badge showing "Nurse"
   **Record through:** yes
   **Still after:** yes

3. **Action:** Click "Profile" menu item in dropdown
   **Expect:** Navigate to /facility/{facilityId}/users/care-nurse showing user profile page
   **Record through:** yes
   **Still after:** yes

4. **Action:** Open sidebar dropdown again
   **Expect:** Badge still visible showing "Nurse"
   **Record through:** no (already verified)
   **Still after:** yes

### Success looks like

- Profile navigation completes successfully
- Badge remains visible in dropdown after navigation
- No layout shift or badge disappearance

---

## AC 4 — Logout works with role badge present

### Research map

- routes: /login (logout destination)
- components: src/components/ui/sidebar/nav-user.tsx (FacilityNavUser signOut handler)
- i18n labels: "Logout", "staff"
- auth/role: any facility user (care-staff / Ohcn@123)
- permissions / facility-scoped: yes
- fixtures needed: seeded facility, care-staff user

### Prerequisites

- Backend running with load_fixtures
- Frontend production build running
- Signed in as care-staff user

### Data setup

- Prefer fixtures: care-staff user from load_fixtures
- Credentials: care-staff / Ohcn@123
- Provenance: CLAUDE.md fixture table (backend fixture constants)
- User type: staff
- Verify: sidebar visible after login

### Steps

1. **Action:** If not already logged in, go to `/login`, fill username "care-staff", password "Ohcn@123", click Login
   **Expect:** Redirect to homepage
   **Record through:** yes

2. **Action:** Click user avatar in sidebar footer
   **Expect:** Dropdown opens with badge showing "Staff"
   **Record through:** yes
   **Still after:** yes

3. **Action:** Click "Logout" menu item in dropdown
   **Expect:** Redirect to /login page, session cleared
   **Record through:** yes
   **Still after:** yes

### Success looks like

- Logout completes successfully
- User redirected to login page
- No errors in console during logout flow

---

## AC 5 — Patient nav menu has no role badge

### Research map

- routes: /patient/* (patient-scoped routes via PatientRouter)
- components: src/components/ui/sidebar/nav-user.tsx (PatientNavUser)
- i18n labels: "Logout"
- auth/role: tests/setup/patient.setup.ts OR tests/setup/patientAccount.setup.ts
- permissions / facility-scoped: no (patient OTP login)
- fixtures needed: patient account with OTP login

### Prerequisites

- Backend running with patient fixtures
- Frontend production build running
- Patient OTP login flow configured

### Data setup

- Prefer fixtures: patient created by load_fixtures or test setup
- OTP flow: patient login uses phone number + OTP (no username/password)
- Provenance: PatientRouter handles OTP-based authentication (src/Routers/PatientRouter.tsx)
- No user_type field: patients authenticate via token, not facility user credentials
- Verify: patient nav menu visible after OTP login

### Steps

1. **Action:** Go to `/patient/login`, enter patient phone number, complete OTP flow
   **Expect:** Patient logged in, redirected to patient dashboard
   **Record through:** yes

2. **Action:** Click patient avatar/button in sidebar footer
   **Expect:** Dropdown menu opens showing patient name/phone but NO role badge
   **Record through:** yes
   **Still after:** yes

3. **Action:** Verify dropdown shows only Logout option (no Profile link)
   **Expect:** Dropdown content matches PatientNavUser (lines 195-215 in nav-user.tsx): avatar, name/phone, logout
   **Record through:** no
   **Still after:** yes

### Success looks like

- Patient dropdown displays without role badge
- Only Logout menu item present (no Profile)
- PatientNavUser component unchanged from implementation

---

## Test plan / notes

### Playwright E2E coverage

- Add new test file: `tests/auth/roleDisplay.spec.ts`
- Test fixture users: care-doctor, care-nurse, care-staff, care-volunteer, care-fac-admin
- Use storage state from setup files: tests/.auth/user.json, nurse.json, facilityAdmin.json
- Assertions:
  - `await expect(page.getByRole('button', { name: /care-nurse/i })).toBeVisible()` (sidebar trigger)
  - `await page.getByRole('button', { name: /care-nurse/i }).click()` (open dropdown)
  - `await expect(page.getByText('Nurse')).toBeVisible()` (badge text)
  - Verify no badge for patient: `await expect(page.getByText(/doctor|nurse|staff|volunteer|administrator/i)).not.toBeVisible()`
- Profile/Logout interactions should pass existing tests (no regressions)

### CI expectations

- `npm run lint` passes (no linting errors from badge import)
- `npm run build` succeeds (verified in implement)
- Type checking passes: `npx tsc --noEmit`
- Existing Playwright tests pass (no regressions to sidebar interactions)

### Manual verification notes

- Badge should not cause layout shift in dropdown
- Badge text should be readable in gray/secondary variant
- i18n translations already exist for all user types (doctor, nurse, staff, volunteer, administrator)
- No changes needed to PatientNavUser component (verified by AC 5)
