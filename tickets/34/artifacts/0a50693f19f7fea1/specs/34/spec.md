# Spec: Add search for the Healthcare Service index page

## Problem Statement

Government facilities configure departments as healthcare services, resulting in significantly long lists. Users must manually scroll through the entire list to find the relevant department. A search input on the facility healthcare services index page (`/facility/:facilityId/services`) would allow users to quickly locate departments by name.

## Acceptance Criteria

1. Given the user is on `/facility/:facilityId/services`, when the page loads, then a search input field is displayed above the list of healthcare services.
2. Given the user types a search term, when the input value changes, then the healthcare services list filters to show only services whose names match the search term (debounced API call).
3. Given the user has entered a search term and matching services are displayed, when the user clears the search input, then all healthcare services are displayed again.
4. Given the user searches for a term with no matching services, when the API returns no results, then an empty state message is displayed.
5. Given the user has entered a search term, when the user reloads the page, then the search term persists in the URL query parameter and the filtered results remain visible.

## Capability Notes

- `src/pages/Facility/services/FacilityServices.tsx` — needs updating to add search input and query parameter handling
- `src/pages/Facility/settings/healthcareService/HealthcareServiceList.tsx` — already implements search pattern (lines 70-82) that can be replicated
- `src/types/healthcareService/healthcareServiceApi.ts` — API already supports `name` query parameter for filtering (line 11 in API definition)
- `src/hooks/useFilters.ts` — provides `updateQuery` and `qParams` for URL-based filtering (already used in HealthcareServiceList)
- `src/Utils/request/query.ts` — `query.debounced()` wrapper exists for debounced search queries

## Open Questions

None.
