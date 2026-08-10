# Spec: Infinite scroll pagination for Encounter Medicine Dispense History selector

## Problem

The Dispense History selector (`DispenseOrderListSelector`) in Encounter → Medicine → Dispense History fetches dispense orders without pagination, limiting visibility to the API's default response size (~14 items). Users cannot scroll to load older dispense orders, preventing access to historical records beyond the initial fetch.

## Acceptance criteria

1. Given an encounter with more than 14 dispense orders, when the Dispense History tab loads, then the first page of orders appears in the left selector immediately.
2. Given dispense orders loaded in the selector, when the user scrolls near the bottom of the list, then the next page of older orders fetches and appends below the existing items without resetting scroll position or selection.
3. Given the user has scrolled to load additional pages, when they select any order (including newly loaded ones), then the detail pane updates correctly to show that order's dispense history.
4. Given the user scrolls to the end of available dispense orders, when no more results exist, then the API stops fetching and no loading indicator loops indefinitely.
5. Given an encounter with fewer than one page of dispense orders, when the Dispense History tab loads, then all orders appear immediately without triggering repeated fetch requests.
6. Given a page-2+ fetch fails, when the error occurs, then already loaded orders remain visible and the user sees an inline retry affordance or toast notification without losing the first page.
7. Given the selector is in mobile drawer view, when the user scrolls the drawer list, then infinite scroll behavior works identically to desktop view.

## Capability notes

- `src/components/Medicine/DispenseOrderListSelector.tsx` — current selector, uses `useQuery` (line 37), no pagination; needs conversion to `useInfiniteQuery` matching `PrescriptionListSelector` pattern.
- `src/components/Medicine/PrescriptionListSelector.tsx` — reference implementation (lines 62-92), uses `useInfiniteQuery` + `useOnInView` hook from `react-intersection-observer` for scroll detection and page fetching.
- `src/types/emr/dispenseOrder/dispenseOrderApi.ts` — list endpoint returns `PaginatedResponse<DispenseOrderRead>`; supports `limit`/`offset` query parameters (already paginated API).
- `src/common/constants.ts:RESULTS_PER_PAGE_LIMIT` — standard page size constant used by `PrescriptionListSelector` for consistent pagination (line 4 reference).
- `react-intersection-observer` package (already installed) — provides `useOnInView` hook for triggering `fetchNextPage` when scroll sentinel enters viewport.

## Open questions

None.
