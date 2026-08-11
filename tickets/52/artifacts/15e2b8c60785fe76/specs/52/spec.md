# Ticket 52: Add Search for User Home Facility Selector

## Problem Statement

Users with access to many facilities currently view them as an unfiltered grid on the User Dashboard, requiring manual scanning to find a specific facility. This friction slows down workflows for multi-facility users (district admins, state admins, traveling doctors). Adding a search bar will enable instant facility filtering by name, scaling gracefully from dozens to hundreds of facilities.

## Acceptance Criteria

1. Given I am viewing the Facilities tab on the User Dashboard, when the facilities grid loads, then a search input appears above the facility cards.
2. Given I type a partial facility name in the search input, when the input changes, then only facilities matching the query (case-insensitive) are displayed in the grid.
3. Given I have typed a search query with no matching facilities, when the filter yields zero results, then an empty state message "No facilities found matching '[query]'" replaces the grid.
4. Given I have an active search query, when I clear the input field (backspace to empty or click clear icon), then all my accessible facilities reappear in the grid.
5. Given I am on a mobile device, when I view the Facilities tab, then the search input is fully visible, appropriately sized, and functional without layout issues.
6. Given the search input is rendered, when I inspect it with accessibility tools, then it has `aria-label="Search facilities"` and supports keyboard navigation.
7. Given I type rapidly in the search input, when multiple keystrokes occur within 300ms, then only one filter operation executes per debounce window.

## Capability Notes

- `src/pages/UserDashboard.tsx` — Facilities tab renders facility cards; add search input above `TabContent` for facilities tab.
- `src/components/Common/SearchInput.tsx` — Reusable search component; configure with single text option for facility name search.
- `src/types/facility/facilityApi.ts` — `list` endpoint supports `name` query parameter for server-side filtering (if paginated); client-side filtering acceptable for `user.facilities` array (CurrentUserRead already includes full facility list).
- `src/types/user/user.ts` — `CurrentUserRead.facilities: FacilityBareMinimum[]` contains user's accessible facilities loaded at auth time.
- `src/Utils/request/query.ts` — `query.debounced()` wrapper available for debounced search if API filtering chosen.

## Open Questions

None.
