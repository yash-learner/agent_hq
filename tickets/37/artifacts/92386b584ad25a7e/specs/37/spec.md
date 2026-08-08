# Spec: Infinite scroll pagination for Encounter Medicine Dispense History selector

## Problem

The Dispense History selector in **Encounter → Medicine → Dispense History** (left panel, `DispenseOrderListSelector`) fetches dispense orders without pagination, limiting visibility to approximately 14 items. Clinicians cannot scroll to view or select older dispense records. This ticket adds infinite scroll so scrolling the selector loads additional pages until the full history is available.

## Acceptance criteria

1. Given an encounter with >14 dispense orders, when Dispense History loads, then the first ~14 orders appear in the left selector immediately.
2. Given the selector is loaded, when the user scrolls near the bottom, then the next page of dispense orders fetches and appends without clearing the existing list or losing scroll position.
3. Given the selector is loading the next page, when scrolling, then a loading indicator (e.g., skeleton or spinner) appears at the bottom until results arrive.
4. Given all dispense orders have loaded, when scrolling to the bottom, then no further fetches occur and the network tab shows no repeated requests.
5. Given an encounter with ≤14 dispense orders, when Dispense History loads, then exactly one fetch occurs and no infinite loop appears.
6. Given a next-page fetch fails, when scrolling triggers it, then already-loaded orders remain visible and an error toast or retry affordance appears.
7. Given a newly-loaded older dispense order is clicked, when selected, then the right detail panel (`DispenseHistory` component) displays the correct history for that order.

## Capability notes

- `src/components/Medicine/DispenseOrderListSelector.tsx:37-46` — Currently uses `useQuery` with `dispenseOrderApi.list`; needs migration to `useInfiniteQuery` pattern.
- `src/components/Medicine/PrescriptionListSelector.tsx:62-92` — Existing infinite scroll implementation with `useInfiniteQuery`, `useOnInView` from `react-intersection-observer`, and `RESULTS_PER_PAGE_LIMIT`; reference for this ticket.
- `src/types/emr/dispenseOrder/dispenseOrderApi.ts:9-13` — `dispenseOrderApi.list` returns `PaginatedResponse<DispenseOrderRead>` and supports `limit`/`offset` query params (already exists).
- `src/common/constants.tsx:1` — `RESULTS_PER_PAGE_LIMIT = 14` (existing constant for page size).
- `react-intersection-observer` package — Already installed; `useOnInView` or `useInView` hooks trigger fetch on scroll proximity.

## Open questions

None.
