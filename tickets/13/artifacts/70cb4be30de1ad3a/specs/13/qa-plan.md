# QA Plan: Add search for Healthcare Service index page

## AC-1 — Search input field appears on page load

### Research map
- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/services`
- components: `src/pages/Facility/services/FacilityServices.tsx` (main page)
- i18n labels: "Search healthcare services..." (`search_healthcare_services`)
- auth/role: `tests/.auth/user.json` (admin)
- permissions / facility-scoped: yes
- fixtures needed: seeded facility with healthcare services (e.g., "Pathology Lab" from fixtures)

### Prerequisites
- Backend running on port 9000 with fixtures loaded (`load_fixtures`)
- Authenticated as admin user
- At least one facility exists with healthcare services

### Steps
1. **Action:** Navigate to `/facility/{facilityId}/services` (use fixture facility ID)
   **Expect:** Page loads with "Services" heading and "Discover the comprehensive healthcare services we offer" subheading
   **Record through:** yes
   **Still after:** yes

2. **Action:** Observe the area above the services list
   **Expect:** A search input field is visible with placeholder text "Search healthcare services..." and a search icon on the left
   **Record through:** yes
   **Still after:** yes

### Success looks like
- Search input is rendered above the healthcare services list
- Input has appropriate styling with search icon
- Placeholder text matches "Search healthcare services..."

---

## AC-2 — Search term triggers API call with name parameter (debounced)

### Research map
- routes: Same as AC-1
- components: `src/pages/Facility/services/FacilityServices.tsx`
- API: `src/types/healthcareService/healthcareServiceApi.ts` → `listHealthcareService` with `name` query param
- i18n labels: "Search healthcare services..."
- auth/role: `tests/.auth/user.json` (admin)
- permissions / facility-scoped: yes
- fixtures needed: Multiple healthcare services with different names

### Prerequisites
- Same as AC-1
- Network tab open in DevTools to observe API calls

### Steps
1. **Action:** Navigate to `/facility/{facilityId}/services`
   **Expect:** Page loads with all services listed
   **Record through:** yes
   **Still after:** yes

2. **Action:** Click the search input and type "Pathology"
   **Expect:** Input accepts characters
   **Record through:** yes
   **Still after:** yes

3. **Action:** Wait 1 second (debounce delay) and observe Network tab
   **Expect:** API call to `/api/v1/facility/{facilityId}/healthcare_service/?name=Pathology` is made
   **Record through:** yes
   **Still after:** yes

### Success looks like
- API request includes the `name` query parameter with the search term
- Search is debounced (doesn't fire on every keystroke)
- Query string in browser URL includes `?search=Pathology`

---

## AC-3 — Matching services are displayed in the list

### Research map
- routes: Same as AC-1
- components: `src/pages/Facility/services/FacilityServices.tsx`, `src/pages/Facility/settings/healthcareService/ServiceCard.tsx`
- i18n labels: "Search healthcare services..."
- auth/role: `tests/.auth/user.json` (admin)
- permissions / facility-scoped: yes
- fixtures needed: Services with names like "Pathology Lab", "Pharmacy", "Cardiology"

### Prerequisites
- Same as AC-1
- Multiple healthcare services exist with different names

### Steps
1. **Action:** Navigate to `/facility/{facilityId}/services`
   **Expect:** All services are displayed (e.g., "Pathology Lab", "Pharmacy")
   **Record through:** yes
   **Still after:** yes

2. **Action:** Type "Pathology" in the search input
   **Expect:** After debounce, only services containing "Pathology" in the name are shown
   **Record through:** yes
   **Still after:** yes

3. **Action:** Verify other services (e.g., "Pharmacy") are not visible
   **Expect:** Only matching services remain in the list
   **Record through:** yes
   **Still after:** yes

### Success looks like
- Services list is filtered to show only matching results
- ServiceCard components for non-matching services are not rendered
- Matching is case-insensitive (API behavior)

---

## AC-4 — Empty state shows "no_services_found"

### Research map
- routes: Same as AC-1
- components: `src/pages/Facility/services/FacilityServices.tsx`
- i18n labels: "no_services_found", "Search healthcare services..."
- auth/role: `tests/.auth/user.json` (admin)
- permissions / facility-scoped: yes
- fixtures needed: Healthcare services (to search for non-existent ones)

### Prerequisites
- Same as AC-1
- Healthcare services exist in the facility

### Steps
1. **Action:** Navigate to `/facility/{facilityId}/services`
   **Expect:** Services are displayed
   **Record through:** yes
   **Still after:** yes

2. **Action:** Type "NonExistentService12345" in the search input
   **Expect:** After debounce, no services match
   **Record through:** yes
   **Still after:** yes

3. **Action:** Observe the page content
   **Expect:** EmptyState component is displayed with "no_services_found" text and folder icon
   **Record through:** yes
   **Still after:** yes

### Success looks like
- Empty state replaces the services list when no matches are found
- Empty state shows appropriate icon and text
- No services are visible in the list

---

## AC-5 — Clearing input displays all services again

### Research map
- routes: Same as AC-1
- components: `src/pages/Facility/services/FacilityServices.tsx`
- i18n labels: "Search healthcare services..."
- auth/role: `tests/.auth/user.json` (admin)
- permissions / facility-scoped: yes
- fixtures needed: Multiple healthcare services

### Prerequisites
- Same as AC-1
- Multiple healthcare services exist

### Steps
1. **Action:** Navigate to `/facility/{facilityId}/services` and type "Pathology" in search
   **Expect:** Filtered list shows only "Pathology" services
   **Record through:** yes
   **Still after:** yes

2. **Action:** Clear the search input (select all text and delete, or use backspace)
   **Expect:** Input is empty
   **Record through:** yes
   **Still after:** yes

3. **Action:** Wait 1 second for debounce
   **Expect:** All healthcare services are displayed again (unfiltered list)
   **Record through:** yes
   **Still after:** yes

### Success looks like
- All services return to the list when search is cleared
- URL query parameter is removed (`?search=` disappears)
- Service count matches the total before filtering

---

## AC-6 — Search term persists with pagination

### Research map
- routes: Same as AC-1
- components: `src/pages/Facility/services/FacilityServices.tsx`, `src/components/Common/Pagination.tsx`
- i18n labels: "Search healthcare services..."
- auth/role: `tests/.auth/user.json` (admin)
- permissions / facility-scoped: yes
- fixtures needed: More than 12 healthcare services (pagination limit is 12) with similar names

### Prerequisites
- Same as AC-1
- Facility has more than 12 healthcare services that match a search term (e.g., multiple services with "Lab" in the name)
- If fixtures don't have enough, create additional services or adjust the limit in testing

### Steps
1. **Action:** Navigate to `/facility/{facilityId}/services`
   **Expect:** Pagination is visible if total services > 12
   **Record through:** yes
   **Still after:** yes

2. **Action:** Type a search term that yields more than 12 results (e.g., "Lab" or "Department")
   **Expect:** First page of filtered results is shown with pagination controls
   **Record through:** yes
   **Still after:** yes

3. **Action:** Click "Next" or page 2 in the pagination
   **Expect:** Page 2 of filtered results is displayed, URL shows `?search=Lab&page=2`
   **Record through:** yes
   **Still after:** yes

4. **Action:** Verify the search input still contains the search term
   **Expect:** Input value is "Lab" (or the searched term), and results are still filtered
   **Record through:** yes
   **Still after:** yes

### Success looks like
- Search term persists in URL when navigating between pages
- Pagination works correctly with filtered results
- Each page shows only matching services

---

## AC-7 — Search term persists in URL on page refresh

### Research map
- routes: Same as AC-1
- components: `src/pages/Facility/services/FacilityServices.tsx`
- hooks: `src/hooks/useFilters.tsx` (manages URL query params)
- i18n labels: "Search healthcare services..."
- auth/role: `tests/.auth/user.json` (admin)
- permissions / facility-scoped: yes
- fixtures needed: Healthcare services with searchable names

### Prerequisites
- Same as AC-1
- Healthcare services exist in the facility

### Steps
1. **Action:** Navigate to `/facility/{facilityId}/services`
   **Expect:** Page loads with all services
   **Record through:** yes
   **Still after:** yes

2. **Action:** Type "Pathology" in the search input and wait for results
   **Expect:** Filtered results are displayed, URL shows `?search=Pathology`
   **Record through:** yes
   **Still after:** yes

3. **Action:** Refresh the browser page (F5 or Ctrl+R)
   **Expect:** Page reloads with the search term still applied
   **Record through:** yes
   **Still after:** yes

4. **Action:** Verify the search input contains "Pathology" and results are filtered
   **Expect:** Input value is "Pathology", filtered results match, URL still shows `?search=Pathology`
   **Record through:** yes
   **Still after:** yes

### Success looks like
- Search term is preserved in URL query parameters
- On page refresh, the search input is pre-filled with the query param value
- Filtered results match the search term after refresh
- State is fully restored from URL
