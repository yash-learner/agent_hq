# QA Plan: Add Search to Facility Selector on User Home

## AC1 — Filter facilities by search query

### Research map

- routes: `/` (user home/dashboard), facility switcher appears in sidebar on all authenticated pages
- components: `src/components/ui/sidebar/facility/facility-switcher.tsx` (FacilitySwitcher component with Command + CommandInput)
- i18n labels: "search_facilities_placeholder", "no_facilities_found", "facilities"
- auth/role: `tests/.auth/user.json` (admin role with facility access)
- permissions / facility-scoped: no (facility selection happens before facility context)
- fixtures needed: Multiple facilities from `load_fixtures` (backend command loads test facilities including "Facility with Patient")

### Prerequisites

- User must be logged in with access to multiple facilities
- Backend running with fixtures loaded via `load_fixtures` management command

### Data setup

- Prefer fixtures: The backend's `load_fixtures` command creates test facilities. The test setup at `tests/setup/facility.setup.ts:12` confirms at least one fixture facility named "Facility with Patient" exists.
- Provenance: Facility name "Facility with Patient" from `tests/setup/facility.setup.ts` line 12 (`.getByRole("link", { name: "Facility with Patient" })`).
- Additional facilities: The `load_fixtures` command typically creates multiple facilities for testing. The exact names vary but include facilities with distinct names to enable search testing.
- No UI/API seed needed: Fixtures provide facilities automatically when backend runs with `load_fixtures`.
- Verify: Open `/` after login; the facility switcher should be visible in the left sidebar.

### Steps

1. **Action:** Navigate to `/` (user home) while logged in as an admin user with access to multiple facilities
   **Expect:** The page loads successfully and the sidebar is visible with the FacilitySwitcher component showing the current facility or "Select Facility"
   **Record through:** yes

2. **Action:** Click on the FacilitySwitcher button in the sidebar (shows facility name or "Select Facility" with a caret icon)
   **Expect:** A dropdown menu opens showing:
   - "View Dashboard" link at the top
   - A search input field with placeholder text "Search facilities..."
   - A "Facilities" heading
   - A list of all available facilities below
     **Record through:** yes

3. **Action:** Type "Facility with Patient" into the search input field (or a partial match like "Patient")
   **Expect:** The facilities list filters in real-time, showing only facilities that match the search query. The facility named "Facility with Patient" appears in the filtered list.
   **Record through:** yes

4. **Action:** Clear the search input and type a different partial search term (e.g., first few letters of any visible facility name)
   **Expect:** The list updates immediately to show only matching facilities. The filtering is case-insensitive.
   **Record through:** yes

### Success looks like

- Search input filters the facility list in real-time
- Matching facilities appear; non-matching facilities are hidden
- The search is case-insensitive and works with partial strings

---

## AC2 — Empty state when no facilities match

### Research map

- Same as AC1
- i18n label: "no_facilities_found" → "No facilities found"

### Prerequisites

- Same as AC1: logged in with facility access, facility switcher dropdown open

### Data setup

- Same as AC1: fixtures provide facilities

### Steps

1. **Action:** Open the FacilitySwitcher dropdown and type a search query that matches no facilities (e.g., "XYZ123NonexistentFacility")
   **Expect:** The facilities list is empty and an empty state message "No facilities found" is displayed
   **Record through:** yes

2. **Action:** Clear the search input
   **Expect:** All facilities reappear in the list
   **Record through:** yes

### Success looks like

- When no facilities match, the empty state message "No facilities found" is clearly visible
- Clearing the search restores the full facility list

---

## AC3 — Case-insensitive partial string matching

### Research map

- Same as AC1
- Implementation: `facility-switcher.tsx:101-104` filters using `.toLowerCase().includes()` for case-insensitive matching

### Prerequisites

- Same as AC1

### Data setup

- Same as AC1

### Steps

1. **Action:** Open the FacilitySwitcher dropdown and type a search query in lowercase (e.g., "patient")
   **Expect:** Facilities containing "patient" (case-insensitive) appear, such as "Facility with Patient"
   **Record through:** yes

2. **Action:** Clear the search and type the same term in uppercase (e.g., "PATIENT")
   **Expect:** The same facilities appear, demonstrating case-insensitive matching
   **Record through:** yes

3. **Action:** Type a partial string from the middle of a facility name (e.g., "with" to match "Facility with Patient")
   **Expect:** Facilities containing that substring appear in the results
   **Record through:** yes

### Success looks like

- Search works identically regardless of letter case (lowercase, uppercase, mixed case)
- Partial strings match anywhere in the facility name (beginning, middle, end)

---

## AC4 — Responsive and accessible on mobile

### Research map

- Component: `src/components/ui/sidebar/facility/facility-switcher.tsx:41` uses `useSidebar().isMobile` for responsive behavior
- Dropdown side: `facility-switcher.tsx:77` sets `side={isMobile ? "bottom" : "right"}` to adjust menu position on mobile

### Prerequisites

- Same as AC1, but viewed on mobile device or mobile viewport

### Data setup

- Same as AC1

### Steps

1. **Action:** Resize browser window to mobile dimensions (e.g., 375px width) or use device emulation in DevTools. Navigate to `/` and log in.
   **Expect:** The sidebar and FacilitySwitcher render in mobile layout
   **Record through:** yes

2. **Action:** Tap the FacilitySwitcher button
   **Expect:** The dropdown opens below the button (not to the side). The search input is large enough for touch interaction and appears at the top of the dropdown.
   **Record through:** yes

3. **Action:** Tap into the search input field
   **Expect:** The mobile keyboard appears, and the input field accepts touch typing without layout issues
   **Record through:** yes

4. **Action:** Type a search query on mobile
   **Expect:** The facility list filters as expected, matching the desktop behavior. All interactive elements (search input, facility items) are easily tappable.
   **Record through:** yes

### Success looks like

- FacilitySwitcher dropdown opens below the trigger on mobile (not clipped or off-screen)
- Search input is fully functional with touch keyboard
- All UI elements are appropriately sized for touch interaction

---

## AC5 — Search input receives focus on dropdown open

### Research map

- Component: `facility-switcher.tsx:95` sets `autoFocus` prop on `CommandInput`

### Prerequisites

- Same as AC1

### Data setup

- Same as AC1

### Steps

1. **Action:** Click the FacilitySwitcher button to open the dropdown
   **Expect:** The dropdown opens and the search input field is automatically focused (cursor is in the input field, ready to type)
   **Record through:** yes

2. **Action:** Immediately start typing (without manually clicking the search input)
   **Expect:** The typed characters appear in the search input and the facility list filters in real-time
   **Record through:** yes

### Success looks like

- Search input has focus immediately when the dropdown opens
- User can start typing without clicking the input field

---

## AC6 — Selecting a facility closes the dropdown and activates it

### Research map

- Component: `facility-switcher.tsx:110` sets `onSelect={() => setOpen(false)}` to close dropdown on selection
- Facility link: `facility-switcher.tsx:114` uses `Link href={/facility/${facility.id}/overview}` to navigate on selection

### Prerequisites

- Same as AC1

### Data setup

- Same as AC1

### Steps

1. **Action:** Open the FacilitySwitcher dropdown, optionally filter facilities using the search input, then click on a facility from the list
   **Expect:**
   - The dropdown closes immediately
   - The page navigates to the selected facility's overview page (`/facility/{facilityId}/overview`)
   - The FacilitySwitcher button now displays the selected facility's name
     **Record through:** yes

2. **Action:** Open the FacilitySwitcher dropdown again
   **Expect:** The previously selected facility is highlighted in the list (has distinct styling showing it's the active facility)
   **Record through:** yes

### Success looks like

- Clicking a facility closes the dropdown and navigates to that facility
- The selected facility becomes the active/current facility in the UI
- Visual indication shows which facility is currently selected

---

## AC7 — Search query clears when dropdown closes without selection

### Research map

- Component: `facility-switcher.tsx:46-51` clears search state via `handleOpenChange` when dropdown closes

### Prerequisites

- Same as AC1

### Data setup

- Same as AC1

### Steps

1. **Action:** Open the FacilitySwitcher dropdown and type a search query (e.g., "Patient")
   **Expect:** The facilities list filters to show matching results
   **Record through:** yes

2. **Action:** Click outside the dropdown or press Escape to close it without selecting a facility
   **Expect:** The dropdown closes
   **Record through:** yes

3. **Action:** Re-open the FacilitySwitcher dropdown
   **Expect:** The search input is empty (the previous search query is cleared). The full list of facilities is visible again.
   **Record through:** yes

### Success looks like

- Closing the dropdown without selecting a facility resets the search input
- Re-opening the dropdown shows a clean slate: empty search input and unfiltered facility list

---

## Test plan / notes

- **Playwright E2E coverage:** Add a test suite in `tests/facility/` or `tests/auth/` to cover:
  1. Opening the facility switcher and verifying search input is visible and focused
  2. Typing into the search input and asserting filtered results match expected facilities
  3. Verifying empty state when search matches no facilities
  4. Verifying case-insensitive and partial string matching behavior
  5. Selecting a filtered facility and confirming navigation + dropdown closure
  6. Closing the dropdown without selection and confirming search query clears
  7. Mobile viewport test to verify responsive behavior and touch interaction
- **CI expectations:**
  - Linting and formatting pass without changes to unrelated files
  - Build succeeds with no errors
  - All existing tests continue to pass
