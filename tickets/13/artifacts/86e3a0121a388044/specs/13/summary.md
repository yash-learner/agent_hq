# Summary: Add search for Healthcare Service index page

Added search functionality to the facility healthcare services index page (`/facility/:facilityId/services`), allowing users to quickly filter services by name instead of manually scrolling through long lists.

## What Was Implemented

- **Search input field** with placeholder "Search healthcare services..." positioned above the services list
- **Debounced API filtering** using the `name` query parameter to filter healthcare services
- **URL persistence** for search terms, enabling bookmarking and refresh persistence
- **Empty state handling** displaying "No services found" when search returns no results
- **Playwright E2E test** (`tests/facility/services/serviceSearch.spec.ts`) covering all search scenarios

## Acceptance Criteria Status

✅ All 7 acceptance criteria met and verified with live-flow video evidence:
1. Search input appears on page load
2. API calls include debounced `name` query parameter
3. Matching services are displayed
4. Empty state shows "No services found"
5. Clearing input restores all services
6. Search term persists with pagination (verified URL persistence)
7. Search term persists on page refresh

## Implementation Details

- Followed the existing pattern from `HealthcareServiceList.tsx` (settings page)
- Integrated with `useFilters` hook for URL query parameter management
- Added i18n key `search_healthcare_services` to `public/locale/en.json`
- Maintains consistent UX across facility services and settings pages

## Review Outcome

**Clean** — All blockers resolved in 3 review rounds:
- Round 1: Fixed documentation formatting in `PLAYWRIGHT_GUIDE.md`
- Round 2: Corrected test assertion to use translated text instead of i18n key
- Round 3: No findings, approved for merge
