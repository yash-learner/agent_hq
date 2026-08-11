# QA Plan: Show all linked departments for user

## AC1 — Display all assigned departments (20+)

### Research map

- routes: `src/Routers/routes/UserRoutes.tsx` → `/facility/:facilityId/users`
- components: `src/components/Users/UserDepartmentsTab.tsx` (infinite scroll with PAGE_LIMIT=20)
- i18n labels: "Departments", "Link Department", "No departments assigned"
- auth/role: `tests/.auth/user.json` (admin)
- permissions: facility-scoped
- fixtures needed: seeded facility, user with 20+ department assignments

### Prerequisites

- Backend running on port 9000
- Production build complete (`npm run build`)
- Facility context active
- User with at least 20 department assignments exists

### Data setup

- Prefer fixtures: `load-fixtures` leaves a facility and users, but no user with 20+ departments
- Provenance: department structure and user assignment from `tests/facility/users/departmentInfiniteScroll.spec.ts` beforeAll
- UI recipe:
  1. Go to `/facility/{facilityId}/users`
  2. Click "See Details" on any existing user to view their profile
  3. Click the "Departments" tab
  4. Click "Link Department" button repeatedly to link 20+ departments
     - For each link: select a department from the dropdown, select a role, click "Link to Department"
     - Use different departments from the facility's available departments
  5. After linking 20+ departments, refresh the page to verify infinite scroll
- API seed (if UI graph is deep):
  - POST `/api/v1/facility/{facilityId}/organizations/{organizationId}/users/`
    (verbatim from `src/types/facilityOrganization/facilityOrganizationApi.ts` line 48)
  - Auth: `getApiUrl()` + `getApiHeaders()` from `tests/helper/utils.ts` + `tests/.auth/user.json`
  - Body: `{"user": "{userId}", "role": "{roleId}"}` (copy from `src/components/Users/LinkUserToDepartmentSheet.tsx` line 54)
  - Repeat for 20+ departments
  - Never POST `/api/v1/organizations/{organizationId}/users/` (unscoped — will 404)
- Verify: open `/facility/{facilityId}/users`, click "See Details" on the user, click "Departments" tab, confirm 20+ department cards are visible after scrolling

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/users`, click "See Details" on a user with 20+ department assignments, click the "Departments" tab
   **Expect:** The Departments tab loads, showing the first 20 departments in a grid layout
   **Record through:** yes

2. **Action:** Scroll down to the bottom of the department grid
   **Expect:** More departments load automatically (infinite scroll), showing departments 21+
   **Record through:** yes

3. **Action:** Continue scrolling until all departments are loaded
   **Expect:** All 20+ departments are visible, no "Load more" button needed, scroll behavior is smooth
   **Record through:** yes

### Success looks like

- All 20+ department cards visible in the grid after scrolling
- No pagination controls (automatic infinite scroll)
- Loading indicator appears briefly at the bottom when fetching next page
- URL remains at `/facility/{facilityId}/users` (no query params)

## AC2 — Frontend fetches all pages until no departments remain

### Research map

- routes: same as AC1
- components: `src/components/Users/UserDepartmentsTab.tsx` (lines 122-151: useInfiniteQuery with getNextPageParam)
- i18n labels: "loading"
- auth/role: `tests/.auth/user.json`
- permissions: facility-scoped
- fixtures needed: same as AC1

### Prerequisites

- Same as AC1
- User with more departments than PAGE_LIMIT (20)

### Data setup

- Same as AC1

### Steps

1. **Action:** Open browser DevTools Network tab, navigate to `/facility/{facilityId}/users`, click "See Details" on a user with 20+ departments, click "Departments" tab
   **Expect:** First API request to `/api/v1/facility/{facilityId}/organizations/?containing_user={userId}&limit=20&offset=0` completes successfully
   **Record through:** yes

2. **Action:** Scroll down to trigger infinite scroll
   **Expect:** Second API request to `/api/v1/facility/{facilityId}/organizations/?containing_user={userId}&limit=20&offset=20` fires automatically
   **Record through:** yes

3. **Action:** Continue scrolling until all departments are loaded
   **Expect:** No more API requests fire after the final page (when `currentOffset >= lastPage.count`)
   **Record through:** yes

### Success looks like

- Multiple paginated API requests visible in DevTools Network tab
- Each request has `offset` incremented by 20
- Final request returns fewer than 20 departments or empty results
- No additional requests after all departments are loaded

## AC3 — User with exactly 14 departments sees all without pagination controls

### Research map

- Same as AC1
- Verifies that the old PAGE_LIMIT of 14 is no longer in effect

### Prerequisites

- Same as AC1
- User with exactly 14 department assignments

### Data setup

- Prefer fixtures: create or modify a user to have exactly 14 departments
- API seed: same as AC1, but link exactly 14 departments
- Verify: user profile shows exactly 14 departments

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/users`, click "See Details" on a user with 14 departments, click "Departments" tab
   **Expect:** All 14 departments load immediately (single API request), no pagination controls visible
   **Record through:** yes

2. **Action:** Scroll to the bottom of the page
   **Expect:** No additional API requests fire (all data loaded in first request)
   **Record through:** yes

### Success looks like

- All 14 department cards visible immediately
- No "Load more" button or pagination controls
- No loading indicators after initial page load
- Single API request in DevTools Network tab

## AC4 — 50+ departments render within 5 seconds without blocking UI

### Research map

- Same as AC1
- Performance test for large datasets

### Prerequisites

- Same as AC1
- User with 50+ department assignments

### Data setup

- Prefer fixtures: create 50+ departments via API seed (UI creation would be too slow)
- API seed:
  1. Create 50+ departments via POST `/api/v1/facility/{facilityId}/organizations/`
     - Body: `{"name": "QA Dept {i}", "description": "Test department", "org_type": "dept", "facility": "{facilityId}"}` (from `tests/facility/users/departmentInfiniteScroll.spec.ts` line 42)
  2. Link all departments to a user via POST `/api/v1/facility/{facilityId}/organizations/{organizationId}/users/`
     - Body: `{"user": "{userId}", "role": "{roleId}"}`
  3. Repeat for 50+ departments
- Verify: user profile should show 50+ departments after scrolling

### Steps

1. **Action:** Open browser DevTools Performance tab, start recording, navigate to `/facility/{facilityId}/users`, click "See Details" on the user, click "Departments" tab
   **Expect:** First 20 departments render within 2 seconds, page remains interactive
   **Record through:** yes

2. **Action:** Scroll down rapidly to load all 50+ departments
   **Expect:** All departments load progressively, UI remains responsive, no freezing or blocking
   **Record through:** yes

3. **Action:** Stop performance recording, review timeline
   **Expect:** Total time from initial click to all 50+ departments visible is under 5 seconds
   **Record through:** yes

### Success looks like

- Smooth scrolling with no jank or freezing
- Department cards render progressively as pages load
- Loading indicators appear briefly between pages
- DevTools Performance tab shows no long tasks (>50ms) blocking the main thread
- All 50+ departments visible within 5 seconds

## AC5 — UI pattern consistent with existing infinite scroll implementations

### Research map

- routes: same as AC1
- components:
  - `src/components/Users/UserDepartmentsTab.tsx` (current implementation)
  - `src/pages/Facility/settings/organizations/components/FacilityOrganizationSelector.tsx` (lines 116-149: reference implementation)
- Verifies pattern consistency with existing infinite scroll

### Prerequisites

- Same as AC1
- User with 20+ departments for comparison

### Data setup

- Same as AC1

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/users`, click "See Details", go to Departments tab, observe infinite scroll behavior
   **Expect:** Scroll to bottom triggers automatic page load with loading indicator, consistent with FacilityOrganizationSelector
   **Record through:** yes

2. **Action:** Open "Link Department" sheet, open the department dropdown, scroll down in the dropdown
   **Expect:** Same infinite scroll pattern in the dropdown (from FacilityOrganizationSelector)
   **Record through:** yes

3. **Action:** Compare the loading indicators and scroll behavior between both views
   **Expect:** Both use react-intersection-observer sentinel, both show "loading" text at bottom, both fetch pages automatically
   **Record through:** yes

### Success looks like

- UserDepartmentsTab uses the same infinite scroll pattern as FacilityOrganizationSelector
- Both use `useInfiniteQuery` with `useInView` hook
- Both have a sentinel ref at the bottom that triggers `fetchNextPage`
- Both show a loading indicator while fetching
- Consistent UX across the application

## Test plan / notes

### Playwright E2E coverage

- `tests/facility/users/departmentInfiniteScroll.spec.ts` verifies infinite scroll in the Link Department dropdown selector
- The test creates 25 departments (> PAGE_LIMIT of 20) and verifies that scrolling in the dropdown loads more items
- The test validates that the paginated API request is fired and more items render

### CI expectations

- All existing tests should continue to pass
- No regression in user management functionality
- The change is backward-compatible (users with <20 departments work the same)
- Performance remains acceptable for large datasets

### Known limitations

- The test currently only covers the dropdown selector, not the main Departments tab view
- Consider adding a dedicated E2E test for the UserDepartmentsTab infinite scroll in a future PR
- The DB snapshot system should be used to reset state between test runs

### Additional manual testing

- Test with users having 0, 1, 14, 20, 25, 50+ departments
- Verify loading states and error handling
- Test on different screen sizes (mobile, tablet, desktop)
- Verify accessibility (keyboard navigation, screen readers)
