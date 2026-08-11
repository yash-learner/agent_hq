# QA Plan: Show all linked departments for user

## AC1 — User with 20+ departments sees all without truncation

### Research map

- routes: `src/Routers/routes/UserRoutes.tsx` → `/facility/{facilityId}/users/{username}/departments`
- components: `src/components/Users/UserDepartmentsTab.tsx` (infinite scroll implementation)
- i18n labels: "Departments", "loading"
- auth/role: `tests/.auth/user.json`
- permissions: facility-scoped
- fixtures needed: facility, user with 20+ department assignments

### Prerequisites

- Facility context active
- User linked to 20+ departments (test creates these)

### Data setup

- Prefer fixtures: load-fixtures provides a facility (ID from `getFacilityId()` helper) and users
- Provenance:
  - Department creation: `POST /api/v1/facility/{facilityId}/organizations/` from `src/types/facilityOrganization/facilityOrganizationApi.ts` (create endpoint)
  - User-department linking: `POST /api/v1/facility/{facilityId}/organizations/{organizationId}/users/` from `src/types/facilityOrganization/facilityOrganizationApi.ts` (assignUser endpoint)
  - Role IDs: `GET /api/v1/organization/?org_type=role&limit=1` from `tests/setup/questionnaire.setup.ts:101-112`
- UI recipe (if API seed fails):
  1. Go to `/facility/{facilityId}/settings/departments`
  2. For each department (repeat 20+ times):
     - Create → name `qa-dept-46-{timestamp}`, org_type "dept", Save
     - Verify department appears in list
  3. Go to `/facility/{facilityId}/users`
  4. Click "See Details" on target user
  5. Click "Departments" tab
  6. Click "Link Department" button
  7. For each department:
     - Select department from dropdown
     - Select role from dropdown
     - Click "Link"
- API seed (recommended for efficiency):
  - Auth: `getApiUrl()` + `getApiHeaders()` from `tests/helper/utils.ts` + `tests/.auth/user.json`
  - Create 25 departments:
    - POST `/api/v1/facility/{facilityId}/organizations/`
    - Body: `{ name: "qa-dept-46-{unique}", description: "Test department", org_type: "dept", facility: "{facilityId}" }`
    - Store returned department IDs
  - Fetch a role ID:
    - GET `/api/v1/organization/?org_type=role&limit=1`
    - Extract `results[0].id`
  - Link user to all 25 departments:
    - POST `/api/v1/facility/{facilityId}/organizations/{deptId}/users/`
    - Body: `{ user: "{userId}", role: "{roleId}" }`
- Verify: Navigate to `/facility/{facilityId}/users/{username}/departments` and confirm initial departments load before scoring

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/users`
   **Expect:** User list page loads with "See Details" buttons visible
   **Record through:** no

2. **Action:** Click "See Details" on the first user in the list
   **Expect:** User profile page loads showing user banner and tabs
   **Record through:** no

3. **Action:** Click "Departments" tab
   **Expect:** Departments tab activates, showing a grid of department cards
   **Record through:** yes

4. **Action:** Scroll to bottom of page
   **Expect:** Next page of departments loads automatically (verify network request with offset parameter), department count increases
   **Record through:** yes

5. **Action:** Continue scrolling until no more departments load
   **Expect:** All 25+ departments are visible in the grid, no "loading" indicator remains
   **Record through:** yes

### Success looks like

- All 25+ departments visible in grid layout
- Multiple API requests with increasing offset values (0, 20, 40, etc.) visible in network log
- No departments missing or truncated
- Total count displayed matches API response count

## AC2 — Frontend fetches all pages until no departments remain

### Research map

- routes: same as AC1
- components: `src/components/Users/UserDepartmentsTab.tsx` (useInfiniteQuery with getNextPageParam)
- auth/role: `tests/.auth/user.json`
- permissions: facility-scoped
- fixtures needed: facility, user with 30+ departments

### Prerequisites

- Same as AC1

### Data setup

- Same as AC1, but create 30 departments to ensure at least 2 pages (PAGE_LIMIT=20)

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/users/{username}/departments` (direct URL)
   **Expect:** First 20 departments load and display
   **Record through:** yes

2. **Action:** Open browser DevTools Network tab, filter by "organizations"
   **Expect:** See initial API request with `offset=0&limit=20`
   **Record through:** no

3. **Action:** Scroll to bottom of page
   **Expect:** Network shows second request with `offset=20&limit=20`, new departments appear
   **Record through:** yes

4. **Action:** Continue scrolling to bottom
   **Expect:** Network shows third request with `offset=40`, if 40+ departments exist
   **Record through:** yes

5. **Action:** Verify no more requests when scrolling after all departments loaded
   **Expect:** No additional network requests, no "loading" indicator
   **Record through:** yes

### Success looks like

- Network tab shows paginated requests with increasing offsets
- Each request returns `next` URL until final page (where `next` is null)
- Frontend stops requesting when `next` is null
- All departments from all pages rendered

## AC3 — User with exactly 14 departments sees all without pagination controls

### Research map

- routes: same as AC1
- components: same as AC1
- auth/role: `tests/.auth/user.json`
- permissions: facility-scoped
- fixtures needed: facility, user with exactly 14 department assignments

### Prerequisites

- Facility context active
- User linked to exactly 14 departments

### Data setup

- Prefer fixtures: if load-fixtures doesn't provide a user with exactly 14 departments, API seed required
- API seed:
  - Same as AC1, but create and link exactly 14 departments
- Verify: Navigate to target URL and confirm 14 departments visible

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/users/{username}/departments`
   **Expect:** All 14 departments load and display in grid
   **Record through:** yes

2. **Action:** Scroll to bottom of page
   **Expect:** No "loading" indicator appears, no additional API requests
   **Record through:** yes

3. **Action:** Open browser DevTools Network tab, filter by "organizations"
   **Expect:** Only one API request with `offset=0&limit=20`, returns 14 departments with `next: null`
   **Record through:** yes

### Success looks like

- All 14 departments visible immediately
- No pagination controls or infinite scroll sentinel visible
- Only one API request made
- Clean UI without loading indicators

## AC5 — UI pattern consistent with existing infinite scroll implementations

### Research map

- routes: same as AC1
- components:
  - `src/components/Users/UserDepartmentsTab.tsx`
  - `src/pages/Facility/settings/organizations/components/FacilityOrganizationSelector.tsx` (reference implementation)
- auth/role: `tests/.auth/user.json`
- permissions: facility-scoped
- fixtures needed: facility, user with 25+ departments

### Prerequisites

- Same as AC1

### Data setup

- Same as AC1

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/users/{username}/departments`
   **Expect:** Departments tab loads with infinite scroll
   **Record through:** yes

2. **Action:** Compare loading behavior with organization selector: Open "Link Department" sheet from Departments tab
   **Expect:** Both use similar infinite scroll pattern (scroll to bottom triggers next page)
   **Record through:** yes

3. **Action:** Scroll rapidly to bottom in Departments tab
   **Expect:** Smooth loading without UI jank, departments append to grid
   **Record through:** yes

4. **Action:** Verify skeleton/loading state appears while fetching
   **Expect:** Subtle "loading" text or spinner at bottom while fetching next page
   **Record through:** yes

### Success looks like

- Consistent scroll-to-load behavior across app
- Loading states match other infinite scroll components
- No duplicate departments or missing gaps in list
- Smooth user experience

## Test plan / notes

- Playwright E2E: `tests/facility/users/userDepartmentsInfiniteScroll.spec.ts` covers AC1, AC2, AC3
- CI: All tests must pass
- Performance: Load time for 50+ departments should be under 5 seconds (AC4 not in live QA — tested via CI)
- Code review: Verify `useInfiniteQuery` implementation matches pattern in `FacilityOrganizationSelector`
