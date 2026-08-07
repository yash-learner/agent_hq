# QA Plan: Add search for the Healthcare Service index page

## AC1 — Search input field is displayed above the list

### Research map

- routes: src/Routers/routes/FacilityRoutes.tsx → /facility/:facilityId/services
- components: src/pages/Facility/services/FacilityServices.tsx (lines 52-64)
- i18n labels: "search_healthcare_services", "services", "discover_healthcare_services"
- auth/role: tests/.auth/user.json (admin)
- permissions / facility-scoped: yes (facility context required)
- fixtures needed: seeded facility (from load-fixtures)

### Prerequisites

- Facility context active
- Backend running on port 9000 with fixtures loaded

### Data setup

- Prefer fixtures: load-fixtures provides a facility with ID from getFacilityId()
- Additional services: load-fixtures includes "Pathology Lab" and other default services
- No additional data setup needed; default fixture services are sufficient for search testing

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/services` where {facilityId} is from getFacilityId()
   **Expect:** Page loads with "Services" heading visible and list of healthcare services displayed
   **Record through:** yes

2. **Action:** Locate the search input field above the services list
   **Expect:** Search input with placeholder "Search healthcare services..." is visible with a search icon on the left
   **Record through:** yes

### Success looks like

- Search input field is prominently displayed above the services list
- Search icon (magnifying glass) is visible on the left side of the input
- Input field has appropriate placeholder text

## AC2 — Filter services by name with debounced API call

### Research map

- routes: src/Routers/routes/FacilityRoutes.tsx → /facility/:facilityId/services
- components: src/pages/Facility/services/FacilityServices.tsx (lines 28-38, 56-61)
- API: src/types/healthcareService/healthcareServiceApi.ts (listHealthcareService with name query param)
- i18n labels: "search_healthcare_services"
- auth/role: tests/.auth/user.json (admin)
- permissions / facility-scoped: yes
- fixtures needed: seeded facility with multiple services

### Prerequisites

- Facility context active
- Multiple healthcare services visible in the list

### Data setup

- Prefer fixtures: load-fixtures provides "Pathology Lab" and other services
- No additional setup needed; fixture services include varied names suitable for filtering

### Steps

1. **Action:** On `/facility/{facilityId}/services`, note the current list of services visible (e.g., "Pathology Lab" and others)
   **Expect:** Multiple services are displayed in the list
   **Record through:** yes

2. **Action:** Click into the search input and type "Pathology"
   **Expect:** After a brief delay (~500ms for debounce), the list filters to show only "Pathology Lab" service
   **Record through:** yes

3. **Action:** Clear the search input and type "Emergency"
   **Expect:** After debounce, the list filters to show only services with "Emergency" in the name (or empty if none exist)
   **Record through:** yes

### Success looks like

- Typing in search input triggers filtering after a brief debounce delay
- Only services matching the search term remain visible
- Non-matching services are removed from the display

## AC3 — Show all services when search is cleared

### Research map

- routes: src/Routers/routes/FacilityRoutes.tsx → /facility/:facilityId/services
- components: src/pages/Facility/services/FacilityServices.tsx (lines 56-61)
- hooks: src/hooks/useFilters.ts (updateQuery)
- auth/role: tests/.auth/user.json (admin)
- permissions / facility-scoped: yes
- fixtures needed: seeded facility with multiple services

### Prerequisites

- Facility context active
- Search term entered and services filtered

### Data setup

- Prefer fixtures: load-fixtures provides multiple services
- No additional setup needed

### Steps

1. **Action:** On `/facility/{facilityId}/services`, enter "Pathology" in the search input
   **Expect:** List filters to show only "Pathology Lab"
   **Record through:** yes

2. **Action:** Clear the search input (select all and delete, or use backspace to remove all text)
   **Expect:** After debounce, all healthcare services are displayed again (including services that were previously hidden)
   **Record through:** yes

### Success looks like

- Clearing search input restores the full unfiltered list
- All services that were visible before the search are visible again
- URL query parameter for search is removed

## AC4 — Display empty state for no matching results

### Research map

- routes: src/Routers/routes/FacilityRoutes.tsx → /facility/:facilityId/services
- components: src/pages/Facility/services/FacilityServices.tsx (lines 70-77)
- i18n labels: "no_services_found"
- auth/role: tests/.auth/user.json (admin)
- permissions / facility-scoped: yes
- fixtures needed: seeded facility with services

### Prerequisites

- Facility context active
- Healthcare services exist in the facility

### Data setup

- Prefer fixtures: load-fixtures provides services
- No additional setup needed

### Steps

1. **Action:** On `/facility/{facilityId}/services`, enter a search term that matches no services (e.g., "nonexistent-xyz-123")
   **Expect:** After debounce, the services list is empty
   **Record through:** yes

2. **Action:** Observe the empty state message
   **Expect:** Message "No services found" is displayed with a folder icon
   **Record through:** yes

3. **Action:** Clear the search or modify it to match an existing service
   **Expect:** The empty state disappears and matching services are displayed
   **Record through:** yes

### Success looks like

- Empty state with "No services found" message appears when no results match
- Empty state includes an icon (folder icon)
- Clearing or modifying search restores the service list

## AC5 — Search term persists in URL and results remain after reload

### Research map

- routes: src/Routers/routes/FacilityRoutes.tsx → /facility/:facilityId/services
- components: src/pages/Facility/services/FacilityServices.tsx (lines 23-26, 28-38)
- hooks: src/hooks/useFilters.ts (qParams, updateQuery with URL query persistence)
- auth/role: tests/.auth/user.json (admin)
- permissions / facility-scoped: yes
- fixtures needed: seeded facility with services

### Prerequisites

- Facility context active
- Healthcare services exist in the facility

### Data setup

- Prefer fixtures: load-fixtures provides "Pathology Lab" and other services
- No additional setup needed

### Steps

1. **Action:** On `/facility/{facilityId}/services`, enter "Pathology" in the search input
   **Expect:** List filters to show only "Pathology Lab"
   **Record through:** yes

2. **Action:** Observe the browser URL
   **Expect:** URL contains query parameter `?search=Pathology` (e.g., `/facility/{facilityId}/services?search=Pathology`)
   **Record through:** yes

3. **Action:** Reload the page (F5 or browser refresh button)
   **Expect:** After reload, search input contains "Pathology" and filtered results (only "Pathology Lab") remain visible
   **Record through:** yes

4. **Action:** Click on a service from the filtered results, then use browser back button
   **Expect:** Return to services page with search term "Pathology" still in input and filtered results visible
   **Record through:** yes

### Success looks like

- Search term appears as URL query parameter `?search=<term>`
- Page reload preserves search term and filtered results
- Browser back button preserves search state
- Filtered results remain visible after navigation

## Test plan / notes

### Playwright E2E coverage

- `tests/facility/services/serviceSearch.spec.ts` provides comprehensive test coverage:
  - Search input rendering on page load
  - Filtering services by name with debounced API call
  - Clearing search to show all services
  - Empty state for no matching results
  - URL persistence of search term across page reload and navigation
  - Partial search matches
  - Special characters in search input
  - Search state persistence when navigating back from service detail page

### CI expectations

- All Playwright tests must pass
- ESLint and Prettier checks must pass
- Build must succeed
