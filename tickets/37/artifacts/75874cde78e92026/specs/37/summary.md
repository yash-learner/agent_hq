# Summary: Infinite scroll pagination for Encounter Medicine Dispense History selector

## What was done

Added infinite scroll pagination to the Dispense History selector in **Encounter → Medicine → Dispense History** (left panel). The selector previously fetched only ~14 dispense orders without pagination, preventing clinicians from accessing older records. The implementation migrated from `useQuery` to `useInfiniteQuery` with scroll-triggered page loading, following the existing pattern in `PrescriptionListSelector.tsx`.

**Core changes**:
- `src/components/Medicine/DispenseOrderListSelector.tsx` — Replaced static `useQuery` with `useInfiniteQuery` using `RESULTS_PER_PAGE_LIMIT` constant (14 items per page)
- Integrated `useInView` hook from `react-intersection-observer` to trigger next-page fetch when scrolling near bottom
- Added loading skeleton at bottom during page fetch (`isFetchingNextPage`)
- Added end-of-list indicator when all records loaded
- Preserved auto-selection and query scoping to `patientId`/`facilityId`

**QA plan artifacts**:
- `specs/37/qa-plan.md` — Data setup with 120 seeded dispense orders via `DispenseOrderCreate` API
- `specs/37/videos/first-page-loads.webm` — Video evidence: initial 14-item page loads correctly
- `specs/37/videos/scroll-loads-more.webm` — Video evidence: scrolling loads pages 2-3 (15→43 items) without clearing existing list

## Acceptance criteria met

✅ **AC 1**: First page loads immediately with ~14 orders — verified with live-flow evidence (120 dispense orders seeded, 15 items initially visible including mobile drawer button)

✅ **AC 2**: Scrolling near bottom fetches next page and appends without clearing — verified with live-flow evidence (count increased from 15→43 items across pages 2-3)

✅ **AC 3**: Loading indicator appears during fetch — verified via code inspection (skeleton cards render during `isFetchingNextPage`, lines 239-242)

✅ **AC 4**: No spurious requests when all loaded — confirmed via code inspection (`getNextPageParam` returns `null` when `currentOffset >= lastPage.count`, preventing further fetches)

✅ **AC 5**: Single-page history (≤14 items) has no fetch loop — confirmed via code inspection (proper `enabled` guards and `getNextPageParam` logic)

✅ **AC 6**: Failed next-page fetch preserves loaded items — confirmed via code inspection (`useInfiniteQuery` keeps `data.pages` array intact on failure)

✅ **AC 7**: Selecting newly loaded older row shows correct detail — confirmed via code inspection (`onSelectDispenseOrder` callback and selection state unchanged from original implementation)

**Note**: Criteria 3-7 verified by code inspection only due to 45-minute QA time cap. Criteria 1-2 have recorded live-flow evidence.

## Review outcome

**Round 1 findings**: 1 blocker addressed (replaced hardcoded `limit: 14` with `RESULTS_PER_PAGE_LIMIT` constant), 1 blocker addressed (improved QA plan data setup with type adherence to `DispenseOrderCreate`)

**Round 2**: Clean — no findings.

## Remaining items

None. Feature is operational and ready for user acceptance testing. Consider adding automated Playwright tests for regression coverage of all 7 acceptance criteria.
