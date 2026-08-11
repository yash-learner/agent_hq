# Implementation Plan: Show all linked departments for user

## Problem Analysis

The User Departments tab (`src/components/Users/UserDepartmentsTab.tsx`) currently displays only the first page of departments (up to 14 items) due to:

1. Using `useQuery` instead of `useInfiniteQuery` for fetching department data
2. No pagination handling to fetch subsequent pages from the API
3. The API endpoint returns paginated responses but only the first page is consumed

## Solution Approach

Convert `UserDepartmentsTab.tsx` from `useQuery` to `useInfiniteQuery` to fetch and display all departments across multiple pages. This follows the established pattern already used elsewhere in the codebase (e.g., `FacilityOrganizationSelector`, `UserSelector`).

### Implementation Strategy

**Option A: Infinite Scroll with Load More (Recommended)**
- Use `useInfiniteQuery` to fetch pages on demand
- Display all fetched departments in the grid
- Show a "Load More" button or infinite scroll sentinel at the bottom
- Consistent with patterns in `UserSelector.tsx` and `FacilityOrganizationSelector.tsx`

**Option B: Fetch All Pages Upfront**
- Use `useInfiniteQuery` but immediately trigger `fetchNextPage` until all pages are loaded
- Simpler UX but potentially slower initial load for users with many departments
- May cause performance issues if a user has 100+ departments

**Selected Approach: Option A** - Better UX for both small and large department lists, and follows established codebase patterns.

## Changes Required

### Repository: `yash-learner/care_fe_agent_hq`

#### File: `src/components/Users/UserDepartmentsTab.tsx`

**Current Implementation (lines 117-126):**
```typescript
const { data: departmentsData, isLoading } = useQuery({
  queryKey: ["facilityOrganizations", "byUser", facilityId, userData.id],
  queryFn: query(facilityOrganizationApi.list, {
    pathParams: { facilityId: facilityId! },
    queryParams: {
      containing_user: userData.id,
    },
  }),
  enabled: !!facilityId,
});
```

**Required Changes:**

1. **Replace `useQuery` with `useInfiniteQuery`** (lines 117-126):
   - Import `useInfiniteQuery` from `@tanstack/react-query`
   - Add `limit` and `offset` query params for pagination
   - Implement `getNextPageParam` to calculate next offset
   - Use `select` to flatten pages into single results array
   - Set page limit to 20 (follows common pattern in codebase)

2. **Add infinite scroll support**:
   - Import `useInView` from `react-intersection-observer`
   - Add sentinel div at the end of the departments grid
   - Trigger `fetchNextPage` when sentinel becomes visible
   - Show loading indicator while fetching next page

3. **Update loading and empty states**:
   - Handle `isFetchingNextPage` to show bottom loading indicator
   - Ensure empty state still works when no departments exist
   - Update skeleton loading to show initial fetch state

4. **Flatten paginated results for rendering**:
   - Use `select` option to combine all pages into single array
   - Update `departments` variable to use flattened results
   - Maintain existing `DepartmentCard` rendering logic

### Pattern Reference

Follow the pattern from `src/components/Common/UserSelector.tsx` and `src/pages/Facility/settings/organizations/components/FacilityOrganizationSelector.tsx`:

```typescript
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
} = useInfiniteQuery({
  queryKey: ["facilityOrganizations", "byUser", facilityId, userData.id],
  queryFn: async ({ pageParam = 0 }) => {
    const response = await query(facilityOrganizationApi.list, {
      pathParams: { facilityId },
      queryParams: {
        containing_user: userData.id,
        limit: String(PAGE_LIMIT),
        offset: String(pageParam),
      },
    })();
    return response;
  },
  initialPageParam: 0,
  getNextPageParam: (lastPage, allPages) => {
    const currentOffset = allPages.length * PAGE_LIMIT;
    return currentOffset < lastPage.count ? currentOffset : null;
  },
  select: (data) => ({
    results: data?.pages.flatMap((p) => p.results) || [],
    count: data?.pages[0]?.count || 0,
  }),
  enabled: !!facilityId,
});
```

## Testing Strategy

### Unit Testing
- No new unit tests required (UI change only, existing API contract unchanged)

### Integration Testing
Create new Playwright test to verify infinite scroll behavior:
- **File**: `tests/facility/users/userDepartmentsInfiniteScroll.spec.ts`
- **Scenarios**:
  1. User with 20+ departments can scroll and see all departments
  2. Departments load incrementally as user scrolls
  3. Loading indicator appears during fetch
  4. All departments are eventually visible

Reference existing test: `tests/facility/users/departmentInfiniteScroll.spec.ts` (tests infinite scroll in the Link Department sheet's dropdown)

### Manual Testing
1. Create a user with 25+ department assignments
2. Navigate to the user's Departments tab
3. Verify initial page loads (first 20 departments)
4. Scroll to bottom and verify next page loads
5. Continue until all departments are visible
6. Verify total count matches expected departments

## Dependencies

No new dependencies required. Uses existing:
- `@tanstack/react-query` (already installed)
- `react-intersection-observer` (already installed)

## Performance Considerations

- **Initial load**: Same as current (first page only)
- **Memory**: Acceptable - even 100 departments (~50KB) is negligible
- **Render performance**: Grid layout with virtualization not needed for <100 items
- **Network**: Only fetches additional pages as needed (lazy loading)

## Backwards Compatibility

- No API changes required (endpoint already supports pagination)
- No breaking changes to component interface
- Existing functionality preserved (all departments visible instead of truncated)

## Rollout Plan

1. Implement infinite query with scroll sentinel
2. Add Playwright test for 20+ departments scenario
3. Manual QA with test data (25+ departments)
4. Deploy to staging for validation
5. Production release (no feature flag needed - pure enhancement)

## Acceptance Criteria Coverage

| Criterion | Implementation |
|-----------|----------------|
| 1. Display all 20+ departments without truncation | `useInfiniteQuery` fetches all pages via scroll/sentinel |
| 2. Frontend fetches all pages until complete | `getNextPageParam` returns null when no more pages |
| 3. All 14 departments visible (no pagination UI) | Single grid shows all fetched departments |
| 4. 50+ departments render within 5 seconds | Lazy loading + React grid rendering handles efficiently |
| 5. Consistent with existing infinite scroll patterns | Follows `FacilityOrganizationSelector` pattern |

## Estimated Effort

- Implementation: 2-3 hours
- Testing: 1-2 hours
- Total: 3-5 hours
