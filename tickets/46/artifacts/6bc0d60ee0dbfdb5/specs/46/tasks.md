# Implementation Tasks: Show all linked departments for user

## Task 1: Convert UserDepartmentsTab to useInfiniteQuery with infinite scroll

**Repository:** `yash-learner/care_fe_agent_hq`

**Scope:** ~80 lines changed

**Files to modify:**
- `src/components/Users/UserDepartmentsTab.tsx`

**Description:**
Replace the existing `useQuery` implementation with `useInfiniteQuery` to support fetching all department pages. Add infinite scroll behavior using an intersection observer sentinel to load additional pages as the user scrolls.

**Changes required:**

1. Replace `useQuery` with `useInfiniteQuery` (lines 117-126):
   - Import `useInfiniteQuery` from `@tanstack/react-query`
   - Add `limit` and `offset` query parameters for pagination
   - Set `PAGE_LIMIT = 20` (consistent with similar patterns)
   - Implement `getNextPageParam` to calculate next offset from page count
   - Use `select` to flatten all pages into a single results array
   - Update `initialPageParam: 0`

2. Add infinite scroll support:
   - Import `useInView` from `react-intersection-observer`
   - Add `useEffect` to trigger `fetchNextPage` when sentinel is in view
   - Add sentinel `div` with `ref` after the departments grid
   - Show loading indicator while `isFetchingNextPage` is true

3. Update loading states:
   - Keep initial loading skeleton for `isLoading` state
   - Add bottom loading indicator for `isFetchingNextPage`
   - Preserve empty state handling when no departments exist

4. Update data consumption:
   - Replace `departmentsData?.results` with flattened `data?.results`
   - Update `departments` variable to use the flattened array
   - Keep existing `DepartmentCard` rendering logic unchanged

**Pattern to follow:**
Reference `src/components/Common/UserSelector.tsx` and `src/pages/Facility/settings/organizations/components/FacilityOrganizationSelector.tsx` for the `useInfiniteQuery` pattern with intersection observer.

**Dependencies:** None (first task)

**Acceptance criteria covered:**
- AC1: Display all 20+ departments without truncation
- AC2: Frontend fetches all pages until complete
- AC3: All 14 departments visible without pagination controls
- AC4: 50+ departments render within 5 seconds (lazy loading)
- AC5: Consistent with existing infinite scroll patterns

---

## Task 2: Add Playwright test for department infinite scroll

**Repository:** `yash-learner/care_fe_agent_hq`

**Scope:** ~150 lines new file

**Files to create:**
- `tests/facility/users/userDepartmentsInfiniteScroll.spec.ts`

**Description:**
Create an end-to-end test that verifies the User Departments tab correctly loads and displays all departments for a user with 20+ department assignments using infinite scroll.

**Test scenarios:**

1. **Test: User with 20+ departments can view all via infinite scroll**
   - Create a test user with 25 department assignments (20 initial + 5 next page)
   - Navigate to the user's profile Departments tab
   - Verify first page loads (up to 20 departments visible)
   - Scroll to bottom of the list
   - Verify loading indicator appears
   - Verify next page loads (additional 5 departments visible)
   - Verify all 25 departments are eventually displayed
   - Verify department count badge shows correct total

2. **Test: User with exactly 14 departments shows all without scroll**
   - Create a test user with exactly 14 departments
   - Navigate to the user's profile Departments tab
   - Verify all 14 departments are visible immediately
   - Verify no loading sentinel or "load more" indicator appears

3. **Test: Empty state when user has no departments**
   - Create a test user with no department assignments
   - Navigate to the user's profile Departments tab
   - Verify empty state message is displayed
   - Verify no loading errors occur

**Implementation details:**
- Use Playwright's `page.locator()` to find department cards
- Use `scrollIntoViewIfNeeded()` to trigger infinite scroll
- Use `waitFor()` to verify loading indicators and new content
- Use existing auth fixtures from `tests/setup/`
- Reference pattern from `tests/facility/users/departmentInfiniteScroll.spec.ts`

**Dependencies:** Task 1 (requires infinite scroll implementation)

**Acceptance criteria covered:**
- AC1: Display all 20+ departments without truncation (verified by test)
- AC2: Frontend fetches all pages (verified by observing network requests)
- AC3: All 14 departments visible (verified by test case)
- AC4: 50+ departments render within 5 seconds (test timeout validates performance)
- AC5: Consistent pattern (test validates UI behavior matches spec)

---

## Summary

**Total tasks:** 2
**Total repositories:** 1 (care_fe_agent_hq)
**Estimated total changes:** ~230 lines

**Task execution order:**
1. Task 1 (implementation) → Task 2 (test)

**All acceptance criteria coverage:**
- ✅ AC1: Covered by Task 1 implementation, verified by Task 2 test
- ✅ AC2: Covered by Task 1 implementation, verified by Task 2 test
- ✅ AC3: Covered by Task 1 implementation, verified by Task 2 test
- ✅ AC4: Covered by Task 1 implementation (lazy loading), verified by Task 2 test
- ✅ AC5: Covered by Task 1 implementation (following UserSelector pattern)
