# QA Plan: Add Search to Facility Selector on User Home

## AC1 — Search filters facilities by name

### Research map

- routes: src/Routers/routes/ → / (home/dashboard)
- components: src/components/ui/sidebar/facility/facility-switcher.tsx
- i18n labels: "search_facilities_placeholder", "facilities", "no_facilities_found", "view_dashboard", "select_facility"
- auth/role: tests/.auth/user.json (admin user with admin/admin credentials)
- permissions / facility-scoped: no (user-level component)
- fixtures needed: Backend fixtures loaded via `load_fixtures` command provide multiple facilities for the admin user

### Prerequisites

- Backend running on port 9000 with fixtures loaded
- User logged in as admin (username: admin, password: admin)
- User has access to multiple facilities (provided by fixtures)

### Data setup

- Prefer fixtures: `load_fixtures` command provides the admin user with access to multiple facilities, including "Facility with Patient" (referenced in `tests/setup/facility.setup.ts:12`).
- Provenance: Backend fixtures loaded by the `load_fixtures` management command create multiple test facilities. The facility "Facility with Patient" is used in the test setup and can be confirmed in `tests/setup/facility.setup.ts`.
- No additional UI or API setup required — fixtures provide sufficient test data with multiple facilities

### Steps

1. **Action:** Navigate to the home page at `/` and wait for page to load
   **Expect:** User is on the dashboard/home page
   **Record through:** yes

2. **Action:** Click on the FacilitySwitcher button in the sidebar (shows current facility or "Select Facility")
   **Expect:** Dropdown opens showing a search input at the top, "View Dashboard" link, separator, "Facilities" heading, and a list of all available facilities
   **Record through:** yes

3. **Action:** Type a partial facility name in the search input (e.g., type "patient" to match "Facility with Patient", or "facility" to match facilities starting with that word)
   **Expect:** The facility list filters to show only facilities matching the search query (case-insensitive). For example, typing "patient" should show "Facility with Patient" if it exists in the fixtures.
   **Record through:** yes

4. **Action:** Clear the search input and type a different partial name that matches only one facility
   **Expect:** Only the matching facility is displayed in the filtered list
   **Record through:** yes

### Success looks like

- Search input filters facilities case-insensitively as user types
- Only matching facilities are visible in the dropdown
- Multiple matches are all shown when partial string matches multiple names

## AC2 — Empty state when no facilities match

### Research map

- Same as AC1

### Prerequisites

- Same as AC1

### Data setup

- Same as AC1

### Steps

1. **Action:** Navigate to `/` and click the FacilitySwitcher button to open the dropdown
   **Expect:** Dropdown opens with search input and facilities list
   **Record through:** yes

2. **Action:** Type a search query that does not match any facility name (e.g., "zzznomatchxxx")
   **Expect:** The facilities list is empty and the message "No facilities found" is displayed in the list area
   **Record through:** yes

3. **Action:** Clear the search input (backspace all characters)
   **Expect:** All facilities reappear in the list
   **Record through:** yes

### Success looks like

- When no facilities match the search query, "No facilities found" message is displayed
- Clearing the search restores the full list

## AC3 — Partial name matching is case-insensitive

### Research map

- Same as AC1

### Prerequisites

- Same as AC1

### Data setup

- Same as AC1

### Steps

1. **Action:** Navigate to `/` and click the FacilitySwitcher button to open the dropdown
   **Expect:** Dropdown opens with search input and facilities list
   **Record through:** yes

2. **Action:** Type a facility name in all lowercase (e.g., type "facility" or "patient")
   **Expect:** Facilities matching the search term (any case) are displayed
   **Record through:** yes

3. **Action:** Clear the input and type the same facility name in all uppercase (e.g., "FACILITY" or "PATIENT")
   **Expect:** The same facilities are displayed, proving case-insensitive matching
   **Record through:** yes

4. **Action:** Clear the input and type mixed case with a partial match (e.g., "FaCiLiTy" or "pAtIeNt")
   **Expect:** Matching facilities are still displayed
   **Record through:** yes

### Success looks like

- Search matching is case-insensitive for both uppercase, lowercase, and mixed case input
- Partial strings match regardless of case

## AC4 — Search input is responsive on mobile

### Research map

- Same as AC1

### Prerequisites

- Same as AC1
- Mobile viewport configured (e.g., iPhone 12 or similar)

### Data setup

- Same as AC1

### Steps

1. **Action:** Set the browser viewport to a mobile size (e.g., 390x844 for iPhone 12)
   **Expect:** Page renders in mobile layout
   **Record through:** yes

2. **Action:** Click the FacilitySwitcher button in the mobile sidebar
   **Expect:** Dropdown opens below (mobile positioning), search input is visible and sized appropriately for mobile
   **Record through:** yes

3. **Action:** Tap into the search input and type a facility name using mobile touch
   **Expect:** Virtual keyboard appears, input receives focus, text entry works smoothly, and filtering occurs as expected
   **Record through:** yes

4. **Action:** Scroll the filtered facilities list if multiple results exist
   **Expect:** List scrolls smoothly within the dropdown bounds
   **Record through:** yes

### Success looks like

- Search input is fully accessible via touch on mobile devices
- Dropdown positioning and input sizing are appropriate for mobile screens
- Touch interactions work smoothly

## AC5 — Search input receives focus automatically

### Research map

- Same as AC1

### Prerequisites

- Same as AC1

### Data setup

- Same as AC1

### Steps

1. **Action:** Navigate to `/` and click the FacilitySwitcher button to open the dropdown
   **Expect:** Dropdown opens and the search input is immediately focused (cursor blinking in the input, ready to type)
   **Record through:** yes

2. **Action:** Without clicking the input, immediately start typing a facility name
   **Expect:** Text is entered into the search input without requiring an explicit click/focus action
   **Record through:** yes

### Success looks like

- Search input is auto-focused when dropdown opens
- User can start typing immediately without clicking into the input

## AC6 — Selecting a facility closes dropdown and navigates

### Research map

- Same as AC1

### Prerequisites

- Same as AC1

### Data setup

- Same as AC1

### Steps

1. **Action:** Navigate to `/` and click the FacilitySwitcher button to open the dropdown
   **Expect:** Dropdown opens with search input and facilities list
   **Record through:** yes

2. **Action:** Type a partial facility name to filter the list down (e.g., type "patient")
   **Expect:** List is filtered to matching facilities (e.g., "Facility with Patient")
   **Record through:** yes

3. **Action:** Click on one of the filtered facility items
   **Expect:** Dropdown closes immediately, and the browser navigates to `/facility/{facilityId}/overview` for the selected facility
   **Record through:** yes

4. **Action:** Verify the URL and page content
   **Expect:** URL is `/facility/{facilityId}/overview` and the facility overview page is displayed
   **Record through:** yes

### Success looks like

- Clicking a facility from the filtered list closes the dropdown
- Navigation to the facility overview page occurs
- The selected facility is set as active

## AC7 — Search query is cleared when dropdown closes

### Research map

- Same as AC1

### Prerequisites

- Same as AC1

### Data setup

- Same as AC1

### Steps

1. **Action:** Navigate to `/` and click the FacilitySwitcher button to open the dropdown
   **Expect:** Dropdown opens with search input and facilities list
   **Record through:** yes

2. **Action:** Type a partial facility name in the search input (e.g., "patient")
   **Expect:** List is filtered to matching facilities (e.g., "Facility with Patient")
   **Record through:** yes

3. **Action:** Click outside the dropdown or press Escape to close it without selecting a facility
   **Expect:** Dropdown closes
   **Record through:** yes

4. **Action:** Click the FacilitySwitcher button again to reopen the dropdown
   **Expect:** Dropdown opens with the search input empty (no previous search query), and the full list of facilities is displayed
   **Record through:** yes

### Success looks like

- Search query is cleared when dropdown closes without selection
- Reopening the dropdown shows an empty search input and the full facilities list

## Test plan / notes

- **Playwright E2E**: Consider adding a test suite in `tests/facility/` or `tests/auth/` to cover:
  - Search filtering logic (AC1)
  - Empty state display (AC2)
  - Case-insensitive matching (AC3)
  - Auto-focus behavior (AC5)
  - Dropdown close and search clear logic (AC6, AC7)
  - Mobile viewport testing (AC4) can be covered with Playwright's mobile emulation

- **CI expectations**: All existing tests must continue to pass. No breaking changes to the FacilitySwitcher API or usage in AppSidebar.

- **Manual verification**: Test on real mobile devices (iOS Safari, Android Chrome) to ensure touch interactions and virtual keyboard behavior are optimal.
