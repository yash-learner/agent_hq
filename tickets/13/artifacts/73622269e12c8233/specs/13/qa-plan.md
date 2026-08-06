# QA Plan: Add search for Healthcare Service index page

## AC-1 — Search input field appears on page load

### Research map
- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/services`
- components: `src/pages/Facility/services/FacilityServices.tsx`
- i18n labels: "services", "discover_healthcare_services", "search_healthcare_services"
- auth/role: `tests/.auth/user.json`
- permissions: facility-scoped
- fixtures needed: seeded facility with healthcare services

### Prerequisites
- facility context active (user logged in with access to facility)
- seeded fixture facility with healthcare services

### Steps
1. **Action:** Navigate to `/facility/{facilityId}/services`
   **Expect:** Page loads with "Services" heading and search input with placeholder "Search healthcare services..." visible above the services list
   **Record through:** yes
   **Still after:** N/A

### Success looks like
- Search input field is visible with search icon on the left
- Placeholder text reads "Search healthcare services..."
- Input is positioned above the services list

## AC-2 — API call includes name query parameter (debounced)

### Research map
- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/services`
- components: `src/pages/Facility/services/FacilityServices.tsx` (useQuery with debounced query)
- i18n labels: "search_healthcare_services"
- auth/role: `tests/.auth/user.json`
- permissions: facility-scoped
- fixtures needed: seeded facility with healthcare services

### Prerequisites
- facility context active
- on `/facility/{facilityId}/services` page
- browser DevTools Network panel open

### Steps
1. **Action:** Open browser DevTools Network panel, type "Path" character by character in the search input
   **Expect:** API requests to `/healthcare_service/` with `name=` query parameter are debounced (not sent for every character)
   **Record through:** yes
   **Still after:** N/A

### Success looks like
- Network panel shows minimal API requests (debounced behavior)
- Final API request includes `name=Path` query parameter

## AC-3 — Matching services are displayed in the list

### Research map
- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/services`
- components: `src/pages/Facility/services/FacilityServices.tsx`, `src/pages/Facility/settings/healthcareService/ServiceCard.tsx`
- i18n labels: "search_healthcare_services"
- auth/role: `tests/.auth/user.json`
- permissions: facility-scoped
- fixtures needed: seeded facility with "Pathology Lab" healthcare service

### Prerequisites
- facility context active
- on `/facility/{facilityId}/services` page
- fixture "Pathology Lab" healthcare service exists

### Steps
1. **Action:** Type "Pathology" in the search input field
   **Expect:** Wait for debounce (~1 second), only "Pathology Lab" service card is visible in the list
   **Record through:** yes
   **Still after:** N/A

### Success looks like
- Only services matching "Pathology" are displayed
- URL contains `search=Pathology` query parameter
- Non-matching services are hidden

## AC-4 — Empty state shows "no_services_found"

### Research map
- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/services`
- components: `src/pages/Facility/services/FacilityServices.tsx`, `src/components/ui/empty-state.tsx`
- i18n labels: "search_healthcare_services", "no_services_found"
- auth/role: `tests/.auth/user.json`
- permissions: facility-scoped
- fixtures needed: seeded facility with healthcare services

### Prerequisites
- facility context active
- on `/facility/{facilityId}/services` page

### Steps
1. **Action:** Type a non-existent service name (e.g., "NonExistentService123") in the search input
   **Expect:** Wait for debounce (~1 second), empty state appears with "No services found" message
   **Record through:** yes
   **Still after:** N/A

### Success looks like
- EmptyState component is visible
- Text "No services found" is displayed
- No service cards are shown

## AC-5 — Clearing input displays all services again

### Research map
- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/services`
- components: `src/pages/Facility/services/FacilityServices.tsx`
- i18n labels: "search_healthcare_services"
- auth/role: `tests/.auth/user.json`
- permissions: facility-scoped
- fixtures needed: seeded facility with multiple healthcare services including "Pathology Lab"

### Prerequisites
- facility context active
- on `/facility/{facilityId}/services` page
- search term already entered showing filtered results

### Steps
1. **Action:** Type "Pathology" in search input to filter services
   **Expect:** Only "Pathology Lab" is visible
   **Record through:** no
2. **Action:** Clear the search input (select all and delete, or click clear button if present)
   **Expect:** Wait for debounce (~1 second), all healthcare services are displayed again (including fixture services like "Pathology Lab", "Radiology", etc.)
   **Record through:** yes
   **Still after:** N/A

### Success looks like
- All healthcare services are visible again
- URL no longer contains `search=` query parameter
- Search input is empty

## AC-6 — Search term persists with pagination

### Research map
- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/services`
- components: `src/pages/Facility/services/FacilityServices.tsx` (Pagination component)
- i18n labels: "search_healthcare_services"
- auth/role: `tests/.auth/user.json`
- permissions: facility-scoped
- fixtures needed: facility with >12 healthcare services matching search term

### Prerequisites
- facility context active
- on `/facility/{facilityId}/services` page
- facility has >12 healthcare services to trigger pagination (may need to create additional services or use a search term that yields multiple pages)

### Steps
1. **Action:** Type "Lab" (or another term that yields >12 results) in the search input
   **Expect:** Filtered services are displayed with pagination visible at bottom
   **Record through:** no
2. **Action:** Click "Next" page button
   **Expect:** Navigate to page 2, URL contains both `search=Lab` and `page=2` parameters, search input still shows "Lab"
   **Record through:** yes
   **Still after:** N/A

### Success looks like
- URL contains `search=Lab&page=2` (or similar)
- Search input value persists ("Lab" still visible)
- Page 2 of filtered results is displayed

## AC-7 — Search term persists in URL on page refresh

### Research map
- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/services`
- components: `src/pages/Facility/services/FacilityServices.tsx`
- i18n labels: "search_healthcare_services"
- auth/role: `tests/.auth/user.json`
- permissions: facility-scoped
- fixtures needed: seeded facility with "Pathology Lab" healthcare service

### Prerequisites
- facility context active
- on `/facility/{facilityId}/services` page with search term applied

### Steps
1. **Action:** Type "Pathology" in the search input
   **Expect:** Filtered results show only "Pathology Lab", URL contains `search=Pathology`
   **Record through:** no
2. **Action:** Refresh the page (F5 or browser refresh button)
   **Expect:** Page reloads, search input still contains "Pathology", filtered results still show only "Pathology Lab", URL still contains `search=Pathology`
   **Record through:** yes
   **Still after:** N/A

### Success looks like
- Search term persists in input field after refresh
- Filtered results are still displayed
- URL maintains `search=Pathology` query parameter
