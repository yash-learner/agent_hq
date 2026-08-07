# QA Plan: Add search for the Healthcare Service index page

## AC1 — Search input displays on page load

### Research map

- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/services`
- components: `src/pages/Facility/services/FacilityServices.tsx`
- i18n labels: "services", "discover_healthcare_services", "search_healthcare_services"
- auth/role: `tests/.auth/user.json` (admin)
- permissions / facility-scoped: yes (facility context required)
- fixtures needed: seeded facility from load-fixtures

### Prerequisites

- Facility context active (use facility from fixtures)
- Backend running on port 9000
- User authenticated (admin user from fixtures)

### Data setup

- Prefer fixtures: load-fixtures provides a facility with ID available via `getFacilityId()`
- No additional data setup required for this criterion

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/services/`
   **Expect:** Page loads with "Services" heading and a search input field above the list of services
   **Record through:** yes

2. **Action:** Verify search input placeholder text
   **Expect:** Search input displays placeholder "Search healthcare services..."
   **Record through:** yes

### Success looks like

- Services page displays with search input visible above the service list
- Search input has correct placeholder text

## AC2 — Search filters services by name (debounced)

### Research map

- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/services`
- components: `src/pages/Facility/services/FacilityServices.tsx`
- API: `src/types/healthcareService/healthcareServiceApi.ts` → `listHealthcareService` with `name` query parameter
- i18n labels: "search_healthcare_services"
- auth/role: `tests/.auth/user.json` (admin)
- permissions / facility-scoped: yes
- fixtures needed: seeded facility + healthcare services

### Prerequisites

- Facility context active
- Multiple healthcare services exist in the facility (at least 3 with distinct names)

### Data setup

- Prefer fixtures: load-fixtures provides a facility; healthcare services need to be created
- Provenance: Service creation flow from `tests/facility/services/helpers.ts` `createHealthcareService()` function
- UI recipe (ordered numbered clicks):
  1. Go to `/facility/{facilityId}/settings/healthcare_services`
  2. Click "Add Healthcare Service" button
  3. Fill "Name" textbox with "Cardiology-{uniqueId}" (use timestamp or random string for uniqueId)
  4. Select "Pharmacy" from "Select Internal Type" combobox
  5. Click "Select locations" combobox
  6. Type "Pharmacy" in "Search locations..." placeholder
  7. Click first empty button in dialog (location selection)
  8. Click "Create" button
  9. Verify service appears in list
  10. Repeat steps 1-9 for "Neurology-{uniqueId}" and "Orthopedics-{uniqueId}"
  11. Navigate to `/facility/{facilityId}/services/`
- After seed: Open `/facility/{facilityId}/services/` and confirm all three services are visible before testing search

### Steps

1. **Action:** Type "Cardiology" in the search input
   **Expect:** List filters to show only "Cardiology-{uniqueId}" service after debounce (~300-500ms); other services not visible
   **Record through:** yes

2. **Action:** Verify URL updates
   **Expect:** URL contains query parameter `search=Cardiology`
   **Record through:** yes

### Success looks like

- Only matching service visible in the list
- URL reflects the search term in query parameter
- Other services are filtered out

## AC3 — Clearing search shows all services

### Research map

- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/services`
- components: `src/pages/Facility/services/FacilityServices.tsx`
- i18n labels: "search_healthcare_services"
- auth/role: `tests/.auth/user.json` (admin)
- permissions / facility-scoped: yes
- fixtures needed: seeded facility + healthcare services from AC2

### Prerequisites

- Facility context active
- Multiple healthcare services exist (from AC2 data setup)
- Search term already entered and results filtered

### Data setup

- Use the same healthcare services created in AC2 data setup

### Steps

1. **Action:** (Continuing from AC2) Clear the search input by deleting all text
   **Expect:** All healthcare services reappear in the list (Cardiology, Neurology, Orthopedics)
   **Record through:** yes

2. **Action:** Verify URL no longer has search parameter
   **Expect:** URL does not contain `search=` query parameter (or `search=` is empty)
   **Record through:** yes

### Success looks like

- All three services visible again
- URL cleared of search parameter
- List returns to unfiltered state

## AC4 — Empty state for no matching results

### Research map

- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/services`
- components: `src/pages/Facility/services/FacilityServices.tsx`
- i18n labels: "search_healthcare_services", "no_services_found"
- auth/role: `tests/.auth/user.json` (admin)
- permissions / facility-scoped: yes
- fixtures needed: seeded facility + healthcare services from AC2

### Prerequisites

- Facility context active
- Healthcare services exist (from AC2 data setup)

### Data setup

- Use the same healthcare services created in AC2 data setup

### Steps

1. **Action:** Type "NonexistentService12345" in the search input
   **Expect:** Empty state message "No services found" displays; no service cards visible
   **Record through:** yes

2. **Action:** Verify no service cards are present
   **Expect:** None of the created services (Cardiology, Neurology, Orthopedics) are visible
   **Record through:** yes

### Success looks like

- Empty state component visible with "No services found" text
- No service cards rendered on the page
- Search still active in URL

## AC5 — Search term persists in URL and on page reload

### Research map

- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/services`
- components: `src/pages/Facility/services/FacilityServices.tsx`
- hooks: `src/hooks/useFilters.ts` → provides `qParams` for URL-based filtering
- i18n labels: "search_healthcare_services"
- auth/role: `tests/.auth/user.json` (admin)
- permissions / facility-scoped: yes
- fixtures needed: seeded facility + healthcare services from AC2

### Prerequisites

- Facility context active
- Healthcare services exist (from AC2 data setup)

### Data setup

- Use the same healthcare services created in AC2 data setup

### Steps

1. **Action:** Type "Neurology" in the search input
   **Expect:** List filters to show only "Neurology-{uniqueId}" service; URL updates with `search=Neurology`
   **Record through:** yes

2. **Action:** Reload the page (F5 or browser reload button)
   **Expect:** Page loads with search input pre-filled with "Neurology" and filtered results still showing only the Neurology service
   **Record through:** yes

3. **Action:** Verify URL still contains search parameter
   **Expect:** URL contains `search=Neurology` after reload
   **Record through:** yes

### Success looks like

- Search term persists across page reload
- Filtered results remain consistent after reload
- URL maintains the search query parameter

## Test plan / notes

### Playwright E2E Coverage

- `tests/facility/services/serviceSearch.spec.ts` contains comprehensive test coverage for:
  - Search input display on page load
  - Filtering services by name with debounced API calls
  - Clearing search to show all services
  - Empty state for no matching results
  - URL persistence of search terms
  - Partial search matches
  - Special character handling
  - Navigation state preservation

### CI Expectations

- All Playwright tests must pass in CI
- Linting and formatting checks must pass
- TypeScript compilation must succeed without errors

### Additional Test Scenarios (covered by Playwright, not live QA)

- Partial search matching (typing prefix matches all services with that prefix)
- Special character handling in search input
- Search state maintained when navigating back from service detail page
- Multiple rapid searches trigger proper debouncing
