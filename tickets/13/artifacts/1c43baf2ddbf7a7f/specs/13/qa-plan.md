# QA Plan: Add search for Healthcare Service index page

## AC-1 — Search input field appears on page load

### Research map
- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/services`
- components: `src/pages/Facility/services/FacilityServices.tsx`
- i18n labels: "Search healthcare services...", "Services", "Discover the comprehensive healthcare services we offer"
- auth/role: `tests/.auth/user.json`
- permissions / facility-scoped: yes (requires facility context)
- fixtures needed: seeded facility with healthcare services

### Prerequisites
- User authenticated with facility access
- Facility has healthcare services configured (fixtures include Pathology Lab, etc.)

### Steps
1. **Action:** Navigate to `/facility/:facilityId/services`
   **Expect:** Page loads with "Services" heading and services list
   **Record through:** yes
   **Still after:** yes

2. **Action:** Locate the search input field above the services list
   **Expect:** Search input field is visible with placeholder "Search healthcare services..." and a search icon on the left
   **Record through:** yes
   **Still after:** yes

### Success looks like
- Search input field is prominently displayed above the services list
- Search icon (magnifying glass) appears on the left side of the input
- Placeholder text reads "Search healthcare services..."

---

## AC-2 — Search input triggers API call with name parameter (debounced)

### Research map
- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/services`
- components: `src/pages/Facility/services/FacilityServices.tsx` (lines 30-37)
- API: `src/types/healthcareService/healthcareServiceApi.ts` → `listHealthcareService` with `name` query param
- hooks: `src/hooks/useFilters.tsx` → `qParams`, `updateQuery`
- auth/role: `tests/.auth/user.json`
- permissions / facility-scoped: yes
- fixtures needed: seeded facility with healthcare services

### Prerequisites
- User authenticated with facility access
- Browser developer tools network tab open to observe API requests

### Steps
1. **Action:** Navigate to `/facility/:facilityId/services` and open browser Network tab
   **Expect:** Page loads, initial API call shows all services
   **Record through:** yes
   **Still after:** yes

2. **Action:** Type "Path" quickly in the search input (character by character)
   **Expect:** Input updates with each keystroke
   **Record through:** yes
   **Still after:** yes

3. **Action:** Wait 1 second after typing stops
   **Expect:** Network tab shows a single (or minimal) API request to `/healthcare_service/` with `name=Path` query parameter. Not one request per character.
   **Record through:** yes
   **Still after:** yes

### Success looks like
- API requests are debounced (fewer requests than keystrokes)
- Final API call includes `name=Path` query parameter
- URL updates to include `search=Path`

---

## AC-3 — Matching services are displayed in the list

### Research map
- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/services`
- components: `src/pages/Facility/services/FacilityServices.tsx` (lines 79-86), `src/pages/Facility/settings/healthcareService/ServiceCard.tsx`
- i18n labels: "Search healthcare services..."
- auth/role: `tests/.auth/user.json`
- permissions / facility-scoped: yes
- fixtures needed: seeded facility with healthcare services including "Pathology Lab"

### Prerequisites
- User authenticated with facility access
- Facility has multiple healthcare services including "Pathology Lab"

### Steps
1. **Action:** Navigate to `/facility/:facilityId/services`
   **Expect:** All services are displayed in the list
   **Record through:** yes
   **Still after:** yes

2. **Action:** Type "Pathology" in the search input
   **Expect:** Input field shows "Pathology"
   **Record through:** yes
   **Still after:** yes

3. **Action:** Wait 1 second for debounce
   **Expect:** Only services matching "Pathology" (like "Pathology Lab") are displayed. Other services are filtered out.
   **Record through:** yes
   **Still after:** yes

4. **Action:** Verify URL
   **Expect:** URL contains `search=Pathology` query parameter
   **Record through:** yes
   **Still after:** yes

### Success looks like
- Search filters the services list in real-time
- Only matching services are displayed
- URL reflects the search term
- Services are displayed as clickable cards with service names

---

## AC-4 — Empty state shows "no_services_found" when no matches

### Research map
- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/services`
- components: `src/pages/Facility/services/FacilityServices.tsx` (lines 71-77), `src/components/ui/empty-state.tsx`
- i18n labels: "no_services_found"
- auth/role: `tests/.auth/user.json`
- permissions / facility-scoped: yes
- fixtures needed: seeded facility with healthcare services

### Prerequisites
- User authenticated with facility access
- Facility has healthcare services configured

### Steps
1. **Action:** Navigate to `/facility/:facilityId/services`
   **Expect:** Services are displayed
   **Record through:** yes
   **Still after:** yes

2. **Action:** Type "XYZNonExistentService12345" in the search input
   **Expect:** Input field shows "XYZNonExistentService12345"
   **Record through:** yes
   **Still after:** yes

3. **Action:** Wait 1 second for debounce
   **Expect:** Empty state is displayed with a folder icon and text "no_services_found"
   **Record through:** yes
   **Still after:** yes

### Success looks like
- Empty state component appears when no services match
- Text "no_services_found" is visible
- Folder icon is displayed
- No service cards are shown

---

## AC-5 — All services displayed when search is cleared

### Research map
- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/services`
- components: `src/pages/Facility/services/FacilityServices.tsx`
- i18n labels: "Search healthcare services..."
- auth/role: `tests/.auth/user.json`
- permissions / facility-scoped: yes
- fixtures needed: seeded facility with multiple healthcare services including "Pathology Lab"

### Prerequisites
- User authenticated with facility access
- Facility has multiple healthcare services

### Steps
1. **Action:** Navigate to `/facility/:facilityId/services` and search for "Pathology"
   **Expect:** Filtered results showing only services matching "Pathology"
   **Record through:** yes
   **Still after:** yes

2. **Action:** Clear the search input (select all and delete, or click X if present)
   **Expect:** Input field is empty
   **Record through:** yes
   **Still after:** yes

3. **Action:** Wait 1 second for debounce
   **Expect:** All healthcare services are displayed again (including "Pathology Lab" and others)
   **Record through:** yes
   **Still after:** yes

4. **Action:** Verify URL
   **Expect:** URL no longer contains `search=` query parameter
   **Record through:** yes
   **Still after:** yes

### Success looks like
- Clearing the search input restores the full list of services
- All services that were initially visible are shown again
- URL is clean without search parameter

---

## AC-6 — Search term persists with pagination

### Research map
- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/services`
- components: `src/pages/Facility/services/FacilityServices.tsx` (lines 23-26, 90-94)
- hooks: `src/hooks/useFilters.tsx` → `Pagination` component
- i18n labels: "Search healthcare services..."
- auth/role: `tests/.auth/user.json`
- permissions / facility-scoped: yes
- fixtures needed: seeded facility with many healthcare services (>12 to trigger pagination)

### Prerequisites
- User authenticated with facility access
- Facility has more than 12 healthcare services matching the search term (to trigger pagination)

### Steps
1. **Action:** Navigate to `/facility/:facilityId/services` and search for a common term like "Lab"
   **Expect:** Search filters services, pagination controls appear if more than 12 results
   **Record through:** yes
   **Still after:** yes

2. **Action:** Verify pagination controls are visible at the bottom
   **Expect:** Pagination navigation appears with page numbers or next/previous buttons
   **Record through:** yes
   **Still after:** yes

3. **Action:** Click "Next" or "2" to navigate to page 2
   **Expect:** Page 2 loads, URL contains both `search=Lab` and `page=2`
   **Record through:** yes
   **Still after:** yes

4. **Action:** Verify search input still contains "Lab"
   **Expect:** Search input field displays "Lab"
   **Record through:** yes
   **Still after:** yes

5. **Action:** Verify services displayed are still filtered by "Lab"
   **Expect:** Only services matching "Lab" are shown on page 2
   **Record through:** yes
   **Still after:** yes

### Success looks like
- Search term persists when navigating between pages
- URL contains both search and page parameters
- Filtered results span across pagination correctly
- Search input maintains the search term on all pages

---

## AC-7 — Search term persists in URL on page refresh

### Research map
- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/services`
- components: `src/pages/Facility/services/FacilityServices.tsx`
- hooks: `src/hooks/useFilters.tsx` → manages URL query parameters
- i18n labels: "Search healthcare services..."
- auth/role: `tests/.auth/user.json`
- permissions / facility-scoped: yes
- fixtures needed: seeded facility with healthcare services including "Pathology Lab"

### Prerequisites
- User authenticated with facility access
- Facility has healthcare services including ones matching "Pathology"

### Steps
1. **Action:** Navigate to `/facility/:facilityId/services` and search for "Pathology"
   **Expect:** Filtered results showing services matching "Pathology", URL contains `search=Pathology`
   **Record through:** yes
   **Still after:** yes

2. **Action:** Note the current URL (e.g., copy it or observe it includes `search=Pathology`)
   **Expect:** URL displays `search=Pathology` in query parameters
   **Record through:** yes
   **Still after:** yes

3. **Action:** Refresh the page (F5 or browser refresh button)
   **Expect:** Page reloads
   **Record through:** yes
   **Still after:** yes

4. **Action:** Verify search input contains "Pathology" after refresh
   **Expect:** Search input field displays "Pathology"
   **Record through:** yes
   **Still after:** yes

5. **Action:** Verify filtered results still show only "Pathology" services
   **Expect:** Services matching "Pathology" are displayed (like "Pathology Lab")
   **Record through:** yes
   **Still after:** yes

6. **Action:** Verify URL still contains `search=Pathology`
   **Expect:** URL query parameter `search=Pathology` is present
   **Record through:** yes
   **Still after:** yes

### Success looks like
- Search term persists in URL after page refresh
- Search input is populated with the search term from URL
- Filtered results are maintained after refresh
- User doesn't lose their search context on page reload
