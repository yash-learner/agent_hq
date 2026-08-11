# Spec: Show all linked departments for user

## Problem statement

The User Departments tab displays only up to 14 departments per user due to a hardcoded pagination limit (`RESULTS_PER_PAGE_LIMIT = 14`) in the query that fetches departments. The API endpoint supports the `containing_user` filter but returns a paginated response, and the frontend does not fetch subsequent pages. Users with more than 14 department assignments cannot view or access all their departments.

## Acceptance criteria

1. Given a user is assigned to 20+ departments, when viewing their Departments tab, then all assigned departments are displayed without truncation.
2. Given the API returns departments in pages, when the Departments tab loads, then the frontend fetches and renders all pages until no departments remain.
3. Given a user has exactly 14 departments, when viewing their Departments tab, then all 14 departments are visible without pagination controls.
4. Given a user has 50+ departments, when the Departments tab loads, then all 50+ departments render within 5 seconds without blocking the UI.
5. Given infinite scroll is used elsewhere (e.g., `FacilityOrganizationSelector`), when the Departments tab renders many departments, then the UI pattern remains consistent with existing infinite scroll implementations.

## Capability notes

- `src/components/Users/UserDepartmentsTab.tsx:117-126` — currently uses `useQuery` with `facilityOrganizationApi.list`, fetching only the first page of departments filtered by `containing_user`. Needs migration to `useInfiniteQuery` or a fetch-all strategy.
- `src/types/facilityOrganization/facilityOrganizationApi.ts:9-13` — `list` endpoint returns `PaginatedResponse<FacilityOrganizationRead>` with standard `count`, `next`, `previous`, `results` structure.
- `src/pages/Facility/settings/organizations/components/FacilityOrganizationSelector.tsx:116-149` — example of `useInfiniteQuery` with `PAGE_LIMIT = 20`, infinite scroll sentinel, and `fetchNextPage` logic. Pattern can be reused or simplified.
- `src/common/constants.tsx:1` — defines `RESULTS_PER_PAGE_LIMIT = 14`, used by `useFilters` hook. Not directly referenced in `UserDepartmentsTab`, but establishes the default pagination limit throughout the app.
- `tests/facility/users/departmentInfiniteScroll.spec.ts` — Playwright test that verifies infinite scroll in the Link Department sheet's dropdown. Validates that 25+ departments load across pages via scroll-triggered `fetchNextPage`.

## Open questions

None.
