# Spec: Infinite scroll pagination for Encounter Medicine Dispense History selector

## Problem

The Dispense History selector in Encounter → Medicines → Dispense History loads all dispense orders without pagination, effectively capping the visible entries to what the API returns (typically ~100). Older dispense records are not reachable when a patient has more than one page of entries, making historical data inaccessible from the UI.

## Acceptance criteria

1. Given a patient with more than 14 dispense orders, when the Dispense History tab loads, then the first page of latest dispense orders displays in the selector.
2. Given the Dispense History selector is scrolled near the bottom, when more results exist, then the next page loads and appends older entries without duplicating existing rows.
3. Given all dispense orders have been loaded, when the user scrolls to the bottom, then no additional fetch requests are made.
4. Given a dispense order is selected from a paginated list, when the user clicks it, then the correct detail view shows in the right panel.
5. Given a patient has fewer than 14 dispense orders, when the Dispense History tab loads, then no unnecessary pagination requests are triggered.
6. Given the user is on desktop or mobile, when scrolling the selector, then pagination behaves correctly on both layouts (desktop sidebar, mobile drawer).
7. Given pagination is in progress, when new rows are loading, then a loading indicator appears at the bottom of the selector list.

## Capability notes

- `src/components/Medicine/DispenseOrderListSelector.tsx` -- exists, currently fetches all dispense orders without pagination (line 37-46)
- `src/types/emr/dispenseOrder/dispenseOrderApi.ts` -- exists, list endpoint supports paginated responses (line 8-13)
- `src/Utils/request/query.ts` -- exists, provides `query.paginated()` wrapper for infinite scroll patterns
- `useInfiniteQuery` from `@tanstack/react-query` -- available, handles paginated data fetching
- Intersection Observer API or scroll event handler -- needs building for detecting scroll-to-bottom threshold

## Open questions

None.
