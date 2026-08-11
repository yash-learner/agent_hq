# QA Plan: Ticket 52 - Add Search for User Home Facility Selector

## AC1 — Search input appears above facility cards

### Research map

- routes: src/Routers/AppRouter.tsx → `/` → User Dashboard
- components: src/pages/UserDashboard.tsx (Facilities tab)
- i18n labels: "search_facilities_placeholder", "dashboard_tab_facilities"
- auth/role: tests/.auth/user.json (admin user with multiple facilities)
- permissions: no special permissions required
- fixtures needed: load-fixtures provides facilities accessible to admin user

### Prerequisites

- Backend running on http://127.0.0.1:9000
- Frontend running on http://localhost:4000
- User logged in (any user with access to multiple facilities)

### Data setup

- Prefer fixtures: load-fixtures provides `admin` user (username: `admin`, password: `admin`) with access to multiple facilities (District Facility, Dummy Facility, etc.)
- No additional data creation needed

### Steps

1. **Action:** Navigate to http://localhost:4000 and log in with username `admin`, password `admin`
   **Expect:** Successfully logged in and redirected to User Dashboard
   **Record through:** yes

2. **Action:** Observe the Facilities tab content
   **Expect:** A search input with placeholder "Search facilities" appears above the facility cards grid, with a search icon on the left
   **Record through:** yes

### Success looks like

- Search input is visible and positioned above the facility cards
- Search icon visible on the left side of the input
- Placeholder text reads "Search facilities"

## AC2 — Typing in search filters facilities by name

### Research map

- Same as AC1

### Prerequisites

- Same as AC1, with at least 2+ facilities visible

### Data setup

- Same as AC1

### Steps

1. **Action:** In the search input, type "District" (partial facility name)
   **Expect:** Only facilities containing "District" in their name are displayed in the grid (e.g., "District Facility")
   **Record through:** yes

2. **Action:** Clear the input and type "dummy" (lowercase partial name)
   **Expect:** Only facilities containing "dummy" in their name (case-insensitive) are displayed (e.g., "Dummy Facility")
   **Record through:** yes

3. **Action:** Type a single character like "d"
   **Expect:** All facilities with "d" in their name appear immediately (filtering is instantaneous)
   **Record through:** yes

### Success looks like

- Facility list updates in real-time as user types
- Search is case-insensitive
- Partial matches work correctly

## AC3 — Empty state when no facilities match

### Research map

- Same as AC1
- i18n labels: "no_facilities_found_matching"

### Prerequisites

- Same as AC1

### Data setup

- Same as AC1

### Steps

1. **Action:** In the search input, type "XYZ123NonExistentFacility"
   **Expect:** The facility grid disappears and is replaced by an empty state message: "No facilities found matching 'XYZ123NonExistentFacility'"
   **Record through:** yes

### Success looks like

- Empty state message clearly displays the search query
- No facility cards are visible
- Message is centered and readable

## AC4 — Clearing search restores full list

### Research map

- Same as AC1
- i18n labels: "clear_search"

### Prerequisites

- Search input has active query filtering facilities

### Data setup

- Same as AC1

### Steps

1. **Action:** Type "District" in search input to filter facilities
   **Expect:** Only matching facilities shown
   **Record through:** yes

2. **Action:** Click the "X" (clear) button on the right side of the search input
   **Expect:** Search input is cleared and all accessible facilities reappear in the grid
   **Record through:** yes

3. **Action:** Type "Test" in search again, then manually delete all text using backspace
   **Expect:** All accessible facilities reappear as search becomes empty
   **Record through:** yes

### Success looks like

- Clear button appears when text is entered
- Clicking clear button empties input and restores full list
- Manually clearing text also restores full list

## AC5 — Mobile responsiveness

### Research map

- Same as AC1

### Prerequisites

- Same as AC1

### Data setup

- Same as AC1

### Steps

1. **Action:** Open browser DevTools and set viewport to mobile (375x667 - iPhone SE)
   **Expect:** Page layout adjusts for mobile
   **Record through:** yes

2. **Action:** Observe the Facilities tab with search input
   **Expect:** Search input is fully visible, appropriately sized for mobile screen, and the facility cards are stacked in a single column
   **Record through:** yes

3. **Action:** Type "District" in the search input on mobile view
   **Expect:** Search functions correctly, filtering facilities without layout issues
   **Record through:** yes

### Success looks like

- Search input fits mobile viewport without horizontal scroll
- Touch targets are appropriately sized
- Facility grid displays in single column on mobile
- Search and clear functionality work on mobile

## AC6 — Accessibility compliance

### Research map

- Same as AC1
- Accessibility attributes: aria-label on search input and clear button

### Prerequisites

- Same as AC1

### Data setup

- Same as AC1

### Steps

1. **Action:** Right-click the search input and inspect element
   **Expect:** The input has `aria-label` attribute (value should be "Search facilities" or the placeholder text)
   **Record through:** yes

2. **Action:** Use Tab key to navigate to the search input
   **Expect:** Input receives focus with visible focus ring
   **Record through:** yes

3. **Action:** Type "test", then press Tab to move to the clear button
   **Expect:** Clear button receives focus with visible focus ring
   **Record through:** yes

4. **Action:** Press Enter or Space while clear button is focused
   **Expect:** Search input is cleared and focus remains on input
   **Record through:** yes

### Success looks like

- Search input has proper aria-label attribute
- Keyboard navigation works (Tab, Shift+Tab)
- Clear button is keyboard accessible
- Focus indicators are visible

## AC7 — Debouncing prevents excessive filter operations

### Research map

- Same as AC1
- Implementation: useEffect with 300ms setTimeout

### Prerequisites

- Same as AC1

### Data setup

- Same as AC1

### Steps

1. **Action:** Focus the search input and rapidly type "DistrictFacility" (all characters within 1 second)
   **Expect:** During typing, the facility grid does NOT update on every keystroke. After typing stops for 300ms, the grid updates to show matching facilities
   **Record through:** yes

2. **Action:** Type "Di", wait 400ms, observe the grid, then type "strict"
   **Expect:** Grid updates after "Di" when 300ms passes, then updates again after "strict" when another 300ms passes
   **Record through:** yes

### Success looks like

- Filter does not execute on every keystroke during rapid typing
- Filter executes once per 300ms debounce window
- Final results appear shortly after user stops typing

## Test plan / notes

- The implementation uses client-side filtering of facilities already loaded in the user object (no API calls)
- Debouncing is implemented with 300ms delay using useEffect and setTimeout
- Playwright E2E tests could be added to cover the search functionality
- CI must pass after implementation
