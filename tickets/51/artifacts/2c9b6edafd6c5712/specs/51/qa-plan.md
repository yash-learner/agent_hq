# QA Plan: Display patient search result count

## AC1 — Identifier search shows correct match count for fixtures

### Research map

- routes: `src/Routers/routes/PatientRoutes.tsx` → `/facility/:facilityId/patients`
- components: `src/components/Patient/PatientIndex.tsx` lines 127-159 (identifier search), 338-490 (identifier results)
- i18n labels: "patient_search_results_count", "patient_search_results_count_plural"
- auth/role: tests/.auth/user.json (admin/doctor role)
- permissions: facility-scoped patient viewing
- fixtures needed: facility from load_fixtures; patients created by load_fixtures

### Prerequisites

- Backend running on port 9000 with fixtures loaded (`load_fixtures`)
- Frontend build exists (run `npm run build`)
- User authenticated (admin/doctor credentials)
- Facility context available (from fixtures)

### Data setup

- Prefer fixtures: `load_fixtures` creates a facility (`getFacilityId()` from `tests/support/facilityId.ts`) and multiple patients with phone numbers
- Provenance: Backend fixtures from `load_fixtures` command (executed during test environment setup) create patients with Indian phone numbers (format: 10 digits starting with 7, 8, or 9)
- Search strategy: Use partial phone number search (e.g., "9") to match multiple fixture patients with phone numbers starting with 9
- Verification: The patient search uses `patientApi.search` from `src/types/emr/patient/patientApi.ts` which returns a `PatientSearchResponse` with `results` array
- No additional data setup required — fixture patients are sufficient

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/patients` (use `getFacilityId()` from fixtures)
   **Expect:** Patient search page loads with "Patient Identifiers" tab active, search input visible
   **Record through:** yes

2. **Action:** Select "Phone Number" from the identifier dropdown
   **Expect:** Dropdown shows "Phone Number" option selected
   **Record through:** yes

3. **Action:** Type a phone number that matches multiple fixture patients (e.g., search for a common prefix like "9")
   **Expect:** Search triggers automatically, results table displays with patient cards
   **Record through:** yes

4. **Action:** Look above the results table
   **Expect:** Count line visible showing "N results" (plural form) where N > 1
   **Record through:** yes

5. **Action:** Note the count number displayed (e.g., "3 results")
   **Expect:** Count matches the number of rows in the table below
   **Record through:** yes

### Success looks like

- Count line displays above the results table
- Count number matches the actual number of result rows
- Plural form used when count > 1 ("3 results", not "3 result")

## AC2 — Identifier search shows empty state for no matches

### Research map

- routes: `src/Routers/routes/PatientRoutes.tsx` → `/facility/:facilityId/patients`
- components: `src/components/Patient/PatientIndex.tsx` lines 345-368 (empty state)
- i18n labels: "no_patient_record_found", "no_patient_record_text"
- auth/role: tests/.auth/user.json
- permissions: facility-scoped patient viewing
- fixtures needed: facility from load_fixtures

### Prerequisites

- Backend running on port 9000 with fixtures loaded
- Frontend build exists
- User authenticated
- Facility context available

### Data setup

- Prefer fixtures: use existing facility from `load_fixtures`
- No patient creation needed — testing no-match case

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/patients`
   **Expect:** Patient search page loads with "Patient Identifiers" tab active
   **Record through:** yes

2. **Action:** Select "Phone Number" from the identifier dropdown
   **Expect:** Dropdown shows "Phone Number" option selected
   **Record through:** yes

3. **Action:** Type a non-existent phone number (e.g., "zzz-no-such-patient" or "0000000000")
   **Expect:** Search triggers, loading completes, empty state appears
   **Record through:** yes

4. **Action:** Look for count line above or within the empty state
   **Expect:** No count line visible (count line is absent for empty results)
   **Record through:** yes

5. **Action:** Verify empty state message is displayed
   **Expect:** Empty state shows "No patient record found" heading with description text and "Add Patient" button
   **Record through:** yes

### Success looks like

- Empty state displays without a count line
- "No patient record found" message and add patient button visible
- No "0 results" text shown (count line is absent, not zero)

## AC3 — No count line shown before search is typed

### Research map

- routes: `src/Routers/routes/PatientRoutes.tsx` → `/facility/:facilityId/patients`
- components: `src/components/Patient/PatientIndex.tsx` lines 338-342 (conditional rendering)
- auth/role: tests/.auth/user.json
- permissions: facility-scoped patient viewing
- fixtures needed: facility from load_fixtures

### Prerequisites

- Backend running on port 9000 with fixtures loaded
- Frontend build exists
- User authenticated
- Facility context available

### Data setup

- Prefer fixtures: use existing facility from `load_fixtures`
- No additional setup required

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/patients`
   **Expect:** Patient search page loads with "Patient Identifiers" tab active
   **Record through:** yes

2. **Action:** Verify search input is empty (no search term entered yet)
   **Expect:** Search input is empty, no results displayed
   **Record through:** yes

3. **Action:** Look in the results area (below search input)
   **Expect:** Results area is empty — no count line, no table, no empty state
   **Record through:** yes

### Success looks like

- No count line visible when page first loads
- No results table or empty state visible
- Only search input is shown

## AC4 — Encounter search shows correct match count from encounterList.count

### Research map

- routes: `src/Routers/routes/PatientRoutes.tsx` → `/facility/:facilityId/patients`
- components: `src/components/Patient/PatientIndex.tsx` lines 139-159 (encounter search), 491-652 (encounter results)
- i18n labels: "patient_search_results_count", "patient_search_results_count_plural", "encounters"
- auth/role: tests/.auth/user.json
- permissions: facility-scoped encounter viewing
- fixtures needed: facility and encounters from load_fixtures

### Prerequisites

- Backend running on port 9000 with fixtures loaded
- Frontend build exists
- User authenticated
- Facility context available

### Data setup

- Prefer fixtures: `load_fixtures` creates encounters with associated patients
- Provenance: Backend fixtures from `load_fixtures` command create patients with names; encounters are linked to these patients
- Search strategy: Use partial name search (e.g., "Test") to match multiple fixture patients whose names contain common substrings
- Verification: The encounter search uses `encounterApi.list` from `src/types/emr/encounter/encounterApi.ts` which returns a `PaginatedResponse<EncounterListRead>` with `count` field
- API endpoint: GET `/api/v1/encounter/` with query params `facility`, `name`, and `external_identifier`
- No additional data setup required

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/patients`
   **Expect:** Patient search page loads
   **Record through:** yes

2. **Action:** Click the "Encounters" tab
   **Expect:** Tab switches to encounter search mode, search input updates to show "Search by patient name or external identifier"
   **Record through:** yes

3. **Action:** Select "Patient Name" from the search dropdown
   **Expect:** Dropdown shows "Patient Name" option selected
   **Record through:** yes

4. **Action:** Type a patient name that matches multiple fixture encounters (e.g., search for a common first name or partial name)
   **Expect:** Search triggers automatically, results table displays with encounter rows
   **Record through:** yes

5. **Action:** Look above the results table
   **Expect:** Count line visible showing "N results" where N matches the total encounter count from the API
   **Record through:** yes

6. **Action:** Verify the count number displayed
   **Expect:** Count uses `encounterList.count` from the paginated response (may be higher than visible rows if results are truncated)
   **Record through:** yes

### Success looks like

- Count line displays above the encounter results table
- Count number matches `encounterList.count` from API response
- Plural form used appropriately based on count

## AC5 — Encounter search shows empty state for no matches

### Research map

- routes: `src/Routers/routes/PatientRoutes.tsx` → `/facility/:facilityId/patients`
- components: `src/components/Patient/PatientIndex.tsx` lines 487-507 (encounter empty state)
- i18n labels: "no_patient_record_found", "no_encounters_found_description"
- auth/role: tests/.auth/user.json
- permissions: facility-scoped encounter viewing
- fixtures needed: facility from load_fixtures

### Prerequisites

- Backend running on port 9000 with fixtures loaded
- Frontend build exists
- User authenticated
- Facility context available

### Data setup

- Prefer fixtures: use existing facility from `load_fixtures`
- No encounter creation needed — testing no-match case

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/patients`
   **Expect:** Patient search page loads
   **Record through:** yes

2. **Action:** Click the "Encounters" tab
   **Expect:** Tab switches to encounter search mode
   **Record through:** yes

3. **Action:** Select "Patient Name" from the search dropdown
   **Expect:** Dropdown shows "Patient Name" option selected
   **Record through:** yes

4. **Action:** Type a non-existent patient name (e.g., "zzz-no-such-patient-xyz")
   **Expect:** Search triggers, loading completes, empty state appears
   **Record through:** yes

5. **Action:** Look for count line above or within the empty state
   **Expect:** No count line visible (count line is absent for empty results)
   **Record through:** yes

6. **Action:** Verify empty state message is displayed
   **Expect:** Empty state shows "No patient record found" heading with "No encounters found" description
   **Record through:** yes

### Success looks like

- Empty state displays without a count line
- "No patient record found" and "No encounters found" messages visible
- No "0 results" text shown

## AC6 — Count updates live when search term changes

### Research map

- routes: `src/Routers/routes/PatientRoutes.tsx` → `/facility/:facilityId/patients`
- components: `src/components/Patient/PatientIndex.tsx` (debounced search with live updates)
- auth/role: tests/.auth/user.json
- permissions: facility-scoped patient viewing
- fixtures needed: facility and patients from load_fixtures

### Prerequisites

- Backend running on port 9000 with fixtures loaded
- Frontend build exists
- User authenticated
- Facility context available

### Data setup

- Prefer fixtures: use patients from `load_fixtures`
- No additional setup required

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/patients`
   **Expect:** Patient search page loads with "Patient Identifiers" tab active
   **Record through:** yes

2. **Action:** Select "Phone Number" from the identifier dropdown and type a phone number that matches multiple patients (e.g., "9")
   **Expect:** Results appear with count line showing initial count (e.g., "5 results")
   **Record through:** yes

3. **Action:** Modify the search term to be more specific (e.g., add more digits like "91")
   **Expect:** Results update, count line updates to show new count (e.g., "2 results") without page reload
   **Record through:** yes

4. **Action:** Verify browser did not reload (check that the page URL and state remain stable)
   **Expect:** No page reload occurred — count updated via live query
   **Record through:** yes

5. **Action:** Clear the search input completely
   **Expect:** Results and count line disappear, leaving only the search input visible
   **Record through:** yes

### Success looks like

- Count line updates dynamically as search term changes
- No page reload or navigation occurs
- Count reflects the current search results in real-time

## Test plan / notes

### Playwright E2E Coverage

- Add test file `tests/facility/patient/patientSearch.spec.ts` covering:
  - Identifier search result count display (positive case)
  - Identifier search empty state (no count line)
  - Encounter search result count display (positive case)
  - Encounter search empty state (no count line)
  - Count updates when search term changes
  - Count line absent before search is entered
- Use `getFacilityId()` from `tests/support/facilityId.ts` for facility ID
- Use fixture patients and encounters from `load_fixtures`
- Test selector: text matching `/\d+ results?/` for count line
- Verify count matches table row count for identifier search
- Verify count comes from API `encounterList.count` for encounter search

### CI Expectations

- Build must pass (`npm run build`)
- Lint must pass (`npm run lint`)
- Type check must pass (`npx tsc --noEmit`)
- New tests must pass in CI pipeline
- No regression in existing patient search tests
