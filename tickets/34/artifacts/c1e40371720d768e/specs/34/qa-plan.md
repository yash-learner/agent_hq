# QA Plan: Add search for the Healthcare Service index page

## AC1 — Search input field displayed on page load

### Research map

- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/services`
- components: `src/pages/Facility/services/FacilityServices.tsx`
- i18n labels: "search_healthcare_services"
- auth/role: tests/.auth/user.json
- permissions: facility-scoped, requires authenticated user
- fixtures needed: seeded facility with healthcare services

### Prerequisites

- Backend running on port 9000
- Fixture data loaded (`load_fixtures`)
- Authenticated user (admin)

### Data setup

- Prefer fixtures: `load_fixtures` provides a facility and healthcare services (e.g., "Pathology Lab")
- Facility ID: retrieved via `getFacilityId()` from tests/support/facilityId.ts
- Healthcare services: created by fixture, including "Pathology Lab" and others
- If additional services needed for testing:
  - UI recipe (from tests/facility/services/helpers.ts):
    1. Go to `/facility/{facilityId}/settings/healthcare_services`
    2. Click "Add Healthcare Service" button
    3. Fill "Name" field with unique name (e.g., `qa-service-${Date.now()}`)
    4. Select "Pharmacy" from "Select Internal Type" dropdown
    5. Select location from "Select locations" dropdown
    6. Click "Create" button
    7. Verify new service appears in the list

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/services`
   **Expect:** Page loads successfully showing the services index page with heading "Services" and description "Discover the comprehensive healthcare services we offer"
   **Record through:** yes

2. **Action:** Observe the page content above the list of healthcare services
   **Expect:** A search input field with placeholder "Search healthcare services..." is displayed with a search icon on the left, positioned below the heading and above the service cards list
   **Record through:** yes

### Success looks like

- Search input is visible and positioned correctly above the healthcare services list
- Input has the correct placeholder text and search icon

## AC2 — Filter services by search term with debounced API call

### Research map

- Same as AC1
- API: `src/types/healthcareService/healthcareServiceApi.ts` → `listHealthcareService` with `name` query parameter
- debounced query: `src/Utils/request/query.ts` → `query.debounced()`

### Prerequisites

- Same as AC1
- Multiple healthcare services exist (at least 3 with different names)

### Data setup

- Same as AC1
- Fixtures provide multiple services including "Pathology Lab"

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/services`
   **Expect:** Page loads with multiple healthcare services visible in the list
   **Record through:** yes

2. **Action:** Type "Pathology" in the search input field
   **Expect:** After debounce delay (~300-500ms), the list filters to show only services containing "Pathology" in their name (e.g., "Pathology Lab")
   **Record through:** yes

3. **Action:** Observe the browser URL
   **Expect:** URL updates to include `?search=Pathology` query parameter
   **Record through:** yes

### Success looks like

- Only matching services are displayed after typing
- Non-matching services are filtered out
- URL reflects the search term in query parameter

## AC3 — Clear search shows all services

### Research map

- Same as AC1

### Prerequisites

- Same as AC1
- Search has been performed (continuing from AC2)

### Data setup

- Same as AC1

### Steps

1. **Action:** Continue from AC2 with "Pathology" in the search field showing filtered results
   **Expect:** Only filtered services are visible
   **Record through:** yes

2. **Action:** Clear the search input by deleting all text (select all and delete or backspace)
   **Expect:** The list updates to show all healthcare services again (not just the filtered subset)
   **Record through:** yes

3. **Action:** Observe the browser URL
   **Expect:** URL no longer contains the `search` query parameter (or it's empty)
   **Record through:** yes

### Success looks like

- All healthcare services are displayed again
- URL query parameter is removed
- Full list is restored

## AC4 — Empty state for no matching results

### Research map

- Same as AC1
- empty state: `src/components/ui/empty-state` → EmptyState component
- i18n label: "no_services_found"

### Prerequisites

- Same as AC1

### Data setup

- Same as AC1

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/services`
   **Expect:** Page loads with healthcare services visible
   **Record through:** yes

2. **Action:** Type a search term that matches no services (e.g., "NonExistentService123XYZ")
   **Expect:** After debounce delay, the list disappears and an empty state is displayed with icon (folder icon) and title "No services found"
   **Record through:** yes

3. **Action:** Observe the URL
   **Expect:** URL contains `?search=NonExistentService123XYZ` query parameter
   **Record through:** yes

### Success looks like

- Empty state message is displayed with appropriate icon and text
- No service cards are shown
- Search term persists in URL

## AC5 — Search term persists on page reload

### Research map

- Same as AC1

### Prerequisites

- Same as AC1

### Data setup

- Same as AC1

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/services`
   **Expect:** Page loads with all services visible
   **Record through:** yes

2. **Action:** Type "Pathology" in the search field
   **Expect:** Services filter to show only matching services (e.g., "Pathology Lab")
   **Record through:** yes

3. **Action:** Note the URL contains `?search=Pathology`, then reload the page (F5 or browser refresh)
   **Expect:** Page reloads with the search field pre-filled with "Pathology" and the filtered results remain visible (only matching services shown)
   **Record through:** yes

4. **Action:** Observe the URL after reload
   **Expect:** URL still contains `?search=Pathology` query parameter
   **Record through:** yes

### Success looks like

- Search term persists in the input field after reload
- Filtered results remain visible after reload
- URL query parameter is maintained
- User doesn't lose their search context

## Test plan / notes

### Playwright E2E coverage

- Add test for search input rendering and visibility
- Add test for filtering services by name
- Add test for URL query parameter persistence
- Add test for empty state when no results match
- Add test for clearing search and restoring full list
- Ensure tests use the existing `createHealthcareService` helper for creating test data
- Tests should verify debounce behavior (wait for API call to complete)

### CI expectations

- All existing tests must pass
- New tests should be added to cover the search functionality
- Linting and formatting checks must pass
