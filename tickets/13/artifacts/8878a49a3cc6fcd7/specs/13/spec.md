# Spec: Add search for Healthcare Service index page

## Problem Statement

The facility healthcare services index page (`/facility/:facilityId/services`) displays all healthcare services but lacks search functionality. In government deployments, departments are configured as healthcare services, creating lengthy lists that require manual scrolling. Users need a search input to quickly filter services by name, matching the pattern already implemented on the settings healthcare services page.

## Acceptance Criteria

1. Given the user is on `/facility/:facilityId/services`, when the page loads, then a search input field with placeholder "Search healthcare services..." appears above the services list.
2. Given the user types a search term, when the input changes, then the API call includes the `name` query parameter and filters services by name (debounced).
3. Given the user enters a search term, when matching services are found, then only those services are displayed in the list.
4. Given the user enters a search term, when no matching services are found, then the empty state shows "no_services_found".
5. Given the user has entered a search term, when they clear the input, then all services are displayed again.
6. Given the user searches and results span multiple pages, when they navigate pages, then the search term persists and pagination works correctly.
7. Given the user searches, when the page refreshes, then the search term persists in the URL query parameters.

## Capability Notes

- `src/pages/Facility/services/FacilityServices.tsx` -- facility services index page, currently missing search
- `src/pages/Facility/settings/healthcareService/HealthcareServiceList.tsx` -- settings page with working search implementation (lines 70-82)
- `src/hooks/useFilters.tsx` -- provides `qParams` and `updateQuery` for managing search state
- `src/types/healthcareService/healthcareServiceApi.ts` -- `listHealthcareService` endpoint supports `name` query parameter
- `public/locale/en.json` -- contains `search_healthcare_services` i18n key

## Open Questions

None.
