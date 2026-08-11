# QA Plan: Show all linked departments for user

## AC1 — Display all 20+ departments without truncation

### Research map

- routes: `src/Routers/routes/UsersRoute.tsx` → `/facility/:facilityId/users` → user profile tabs
- components: `src/components/Users/UserDepartmentsTab.tsx` (infinite scroll implementation)
- i18n labels: "departments", "loading", "no_departments_assigned", "click_link_department_to_get_started"
- auth/role: `tests/.auth/user.json` (admin)
- permissions: facility-scoped user management
- fixtures needed: seeded facility with users, 25+ departments linked to a test user

### Prerequisites

- Backend running on port 9000 with fixtures loaded (`npm run playwright:db-restore`)
- Frontend built and served (`npm run build && npm run preview`)
- Test data: A user linked to 25+ departments (created by Playwright test setup)

### Data setup

- Prefer fixtures: `load_fixtures` creates a facility with users and departments
- Provenance: Department linking uses `POST /api/v1/facility/{facilityId}/organizations/{organizationId}/users/` from `src/types/facilityOrganization/facilityOrganizationApi.ts`
- Test setup: The Playwright test `tests/facility/users/userDepartmentsInfiniteScroll.spec.ts` creates 25 test departments prefixed with "UserDeptTest" and links them to a test user in its `beforeAll` hook

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/users` and click "See Details" on the first user, then click the "Departments" tab
   **Expect:** The Departments tab loads and displays the first page of departments (up to 20 department cards visible)
   **Record through:** yes

2. **Action:** Count the initial number of visible department cards in the grid
   **Expect:** At least 1 department card is visible, showing department name, type badge, and user role
   **Record through:** yes

3. **Action:** Scroll down to the bottom of the department list
   **Expect:** A loading indicator appears briefly, then additional department cards load and appear below the existing ones
   **Record through:** yes

4. **Action:** Continue scrolling to the bottom until no more departments load
   **Expect:** All departments eventually become visible without any "page 2 of N" UI or pagination controls
   **Record through:** yes

5. **Action:** Count the total number of department cards visible
   **Expect:** Total count is 20+ departments (matching the number of departments linked to the user)
   **Record through:** yes

### Success looks like

- All departments are visible in a continuous scrollable list
- No pagination UI or "Load More" button (just automatic loading on scroll)
- Total department count matches the expected number (25+ from test setup)
- Each department card shows name, type badge, parent department (if applicable), and user role

## AC2 — Frontend fetches all pages until complete

### Research map

- Same as AC1
- API endpoint: `GET /api/v1/facility/{facilityId}/organizations/?containing_user={userId}&limit=20&offset={N}` from `src/types/facilityOrganization/facilityOrganizationApi.ts`
- Implementation: `useInfiniteQuery` with `getNextPageParam` in `src/components/Users/UserDepartmentsTab.tsx`

### Prerequisites

- Same as AC1

### Data setup

- Same as AC1

### Steps

1. **Action:** Open browser DevTools Network tab, navigate to `/facility/{facilityId}/users`, click "See Details" on first user, then click "Departments" tab
   **Expect:** Network tab shows initial API request: `GET .../organizations/?containing_user={userId}&limit=20&offset=0`
   **Record through:** yes

2. **Action:** Scroll to bottom of department list
   **Expect:** Network tab shows second API request: `GET .../organizations/?containing_user={userId}&limit=20&offset=20`
   **Record through:** yes

3. **Action:** Continue scrolling to bottom
   **Expect:** If more departments exist, a third request appears with `offset=40`, and so on until all pages are fetched
   **Record through:** yes

4. **Action:** Verify final scroll attempt after all departments are loaded
   **Expect:** No additional API requests are made (getNextPageParam returns null when `offset >= count`)
   **Record through:** yes

### Success looks like

- Multiple paginated API requests visible in Network tab with incrementing offset values (0, 20, 40, ...)
- Requests stop when all departments are fetched
- Response JSON shows `count` field matching total departments, and `next` field is null on last page

## AC3 — All 14 departments visible without pagination controls

### Research map

- Same as AC1

### Prerequisites

- Same as AC1

### Data setup

- Prefer fixtures: Use a user with exactly 14 departments (or fewer than 20)
- If test data has 25+ departments, this criterion validates that users with <= 20 departments still work correctly

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/users`, click "See Details" on a user with 14 or fewer departments, then click "Departments" tab
   **Expect:** All 14 departments are immediately visible (no loading spinner after initial load)
   **Record through:** yes

2. **Action:** Check the bottom of the department list
   **Expect:** No loading indicator, no "Load More" button, no pagination controls visible
   **Record through:** yes

3. **Action:** Scroll down to the bottom of the page
   **Expect:** No additional API requests are made (since all departments fit in first page)
   **Record through:** yes

### Success looks like

- All departments visible immediately
- Clean bottom of list (no sentinel div with loading indicator visible)
- Single-page experience with no pagination UI

## AC4 — 50+ departments render within 5 seconds

### Research map

- Same as AC1
- Performance: `useInfiniteQuery` with lazy loading (only fetches pages as user scrolls)

### Prerequisites

- Same as AC1
- Data setup for 50+ departments (test can create additional departments beyond the 25 if needed)

### Data setup

- If test user has only 25 departments, the test validates performance for that count
- For 50+ departments: extend the test setup to create 50+ "UserDeptTest" departments and link them to the test user
- API seed recipe: Same as existing test setup, just increase DEPT_COUNT to 50+

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/users`, click "See Details" on user with 50+ departments, then click "Departments" tab
   **Expect:** First page (20 departments) loads and renders within 2 seconds
   **Record through:** yes

2. **Action:** Start timer and scroll continuously to bottom, loading all departments
   **Expect:** All 50+ departments become visible within 5 seconds total (including scroll and render time)
   **Record through:** yes

3. **Action:** Observe page responsiveness during scroll and render
   **Expect:** UI remains responsive, no freezing or blocking, smooth scrolling throughout
   **Record through:** yes

### Success looks like

- Initial page load < 2 seconds
- Full 50+ departments visible within 5 seconds with smooth scrolling
- No UI freezing or performance degradation

## AC5 — Consistent with existing infinite scroll patterns

### Research map

- Reference implementations:
  - `src/components/Common/UserSelector.tsx` (dropdown with infinite scroll)
  - `src/pages/Facility/settings/organizations/components/FacilityOrganizationSelector.tsx` (department selector)
- Pattern: `useInfiniteQuery` + `useInView` hook with sentinel div

### Prerequisites

- Same as AC1

### Data setup

- Same as AC1

### Steps

1. **Action:** On the Departments tab with 20+ departments, observe the infinite scroll behavior
   **Expect:** Loading indicator appears at bottom while fetching next page (consistent with UserSelector pattern)
   **Record through:** yes

2. **Action:** Navigate to `/facility/{facilityId}/users` and click "Link Department" on a user, then open the department dropdown
   **Expect:** Department selector uses same infinite scroll pattern (loads more as you scroll in dropdown)
   **Record through:** yes

3. **Action:** Compare the two infinite scroll implementations
   **Expect:** Both use similar visual indicators, loading states, and scroll-triggered fetch behavior
   **Record through:** yes

### Success looks like

- User Departments tab scroll behavior matches existing patterns in the codebase
- Consistent loading indicator style and placement
- Same user experience as other infinite scroll lists in CARE

## Test plan / notes

**Not live QA criteria** (these are for implementation validation):

- Playwright E2E test coverage in `tests/facility/users/userDepartmentsInfiniteScroll.spec.ts`
- Test scenarios:
  1. User with 20+ departments can view all via infinite scroll
  2. User with exactly 14 departments shows all without scroll indicator
  3. Empty state when user has no departments
- CI must pass: `npm run lint`, `npm run build`, Playwright test suite
- Manual verification: Test with users having 0, 5, 14, 20, 25, and 50+ departments
- Performance: Profile with Chrome DevTools to ensure 50+ departments render efficiently
- Edge cases: Verify behavior when API is slow, when user has 1 department, when scrolling quickly

**API endpoint validation:**

- Endpoint: `GET /api/v1/facility/{facilityId}/organizations/?containing_user={userId}&limit=20&offset={N}`
- Response structure: `{ count: number, next: string | null, results: Array<FacilityOrganizationRead> }`
- Verify `count` field matches total departments
- Verify `next` is null on final page

**Implementation notes:**

- PAGE_LIMIT set to 20 (consistent with similar components)
- Uses `useInfiniteQuery` from `@tanstack/react-query`
- Uses `useInView` from `react-intersection-observer` for scroll detection
- Sentinel div with ref placed after department grid
- `getNextPageParam` returns null when `currentOffset >= lastPage.count`
