# QA Plan: Permission-gate EncounterHistory empty-state "Create Encounter" button

## AC1 — User without can_create_encounter sees no button in empty state

### Research map

- routes: `src/Routers/routes/PatientRoutes.tsx` → `/facility/:facilityId/patient/:patientId/:tab`
- components: `src/components/Patient/PatientDetailsTab/EncounterHistory.tsx` (lines 82-95)
- i18n labels: "no_active_encounters_found", "create_a_new_encounter_to_get_started", "create_encounter"
- auth/role: `tests/.auth/nurse.json` (care-nurse / Ohcn@123) — nurse role typically lacks encounter creation permission
- permissions: `can_create_encounter` from `src/common/Permissions.tsx:12`
- facility-scoped: yes
- fixtures needed: seeded facility, patient with zero encounters

### Prerequisites

- Facility context active
- Backend running on port 9000 with fixtures loaded (`load_fixtures`)
- User logged in as nurse (care-nurse) who lacks `can_create_encounter` permission
- Test patient exists with no encounters

### Data setup

- Prefer fixtures: `load_fixtures` provides facility via `getFacilityId()`
- Provenance: Patient creation API payload from `tests/facility/billing/accountTransfer.spec.ts:133-165` (createPatient helper) and `src/types/emr/patient/patientApi.ts:13-19` (create route)
- **Note**: The patient from `getPatientId()` is extracted from an encounter list (tests/setup/patient.setup.ts:23 navigates to encounters and clicks "View Encounter"), so it always has encounters. For empty-state testing, create a fresh patient via API:
  - API seed (proven payload):
    - Fetch geo_organization: `GET /api/v1/organization/?org_type=govt&limit=1` (required field per accountTransfer.spec.ts:136-145)
    - POST `/api/v1/patient/` (verbatim from `src/types/emr/patient/patientApi.ts:13-19`)
    - Auth: `getApiUrl()` + `getApiHeaders()` from `tests/helper/utils.ts` + `tests/.auth/nurse.json`
    - Body (from accountTransfer.spec.ts:150-157):
      ```json
      {
        "name": "QA Patient 43 Nurse ${Date.now()}",
        "gender": "male",
        "phone_number": "+91${10-digit valid Indian mobile}",
        "date_of_birth": "1990-01-15",
        "geo_organization": "${geoOrgId from first API call}",
        "identifiers": []
      }
      ```
    - Record patient ID from response `data.id`
  - Verify: Navigate to `/facility/{facilityId}/patient/{newPatientId}/encounters` and confirm empty state with "No active encounters found" heading appears before scoring

### Steps

1. **Action:** Log in as `care-nurse` (password `Ohcn@123`)  
   **Expect:** Login succeeds; dashboard or facility home visible
   **Record through:** yes

2. **Action:** Navigate to `/facility/{facilityId}/patient/{patientId}/encounters`  
   **Expect:** Page loads; "Encounters" tab is active; empty state shows "No active encounters found" message and description
   **Record through:** yes

3. **Action:** Inspect empty state content  
   **Expect:** "Create Encounter" button is **not visible** (nurse lacks permission)
   **Record through:** yes

### Success looks like

- Empty state renders with heading and description
- No "Create Encounter" button appears for nurse user
- No form or dialog triggers present

## AC2 — User with can_create_encounter sees button in empty state

### Research map

- Same as AC1
- auth/role: `tests/.auth/user.json` (admin / admin) — admin has `can_create_encounter` permission

### Prerequisites

- Same as AC1, but logged in as admin

### Data setup

- Same as AC1 (create fresh patient via API with admin auth from `tests/.auth/user.json`); use admin credentials

### Steps

1. **Action:** Log in as `admin` (password `admin`)  
   **Expect:** Login succeeds; dashboard visible
   **Record through:** yes

2. **Action:** Navigate to `/facility/{facilityId}/patient/{patientId}/encounters` (patient with zero encounters)  
   **Expect:** Page loads; empty state visible with heading, description, and "Create Encounter" button
   **Record through:** yes

3. **Action:** Click "Create Encounter" button  
   **Expect:** Create encounter dialog/form opens
   **Record through:** yes

4. **Action:** Close dialog/form without saving (Cancel or close X)  
   **Expect:** Dialog closes; empty state returns
   **Record through:** yes

### Success looks like

- Empty state displays "Create Encounter" button for admin
- Button click opens encounter creation form/dialog
- Form can be canceled and returns to empty state

## AC3 — User with can_create_encounter and existing encounters sees no change

### Research map

- Same as AC1
- auth/role: `tests/.auth/user.json` (admin)

### Prerequisites

- Facility context active
- Admin logged in
- Patient has at least one existing encounter

### Data setup

- Prefer fixtures: Patient from `getPatientId()` should have encounter from `getEncounterId()`
- If patient has no encounters, create one first:
  1. Go to `/facility/{facilityId}/patient/{patientId}/encounters`
  2. Click "Create Encounter" (assuming admin)
  3. Fill minimal required fields (encounter type, location if required)
  4. Save; confirm encounter appears in list

### Steps

1. **Action:** Log in as `admin` (password `admin`)  
   **Expect:** Login succeeds
   **Record through:** yes

2. **Action:** Navigate to `/facility/{facilityId}/patient/{patientId}/encounters` (patient with ≥1 encounter)  
   **Expect:** Page loads; encounter list displays (no empty state)
   **Record through:** yes

3. **Action:** Verify encounter cards/rows visible  
   **Expect:** Encounters listed; no empty state or "Create Encounter" empty-state button (behavior unchanged from before fix)
   **Record through:** yes

### Success looks like

- Encounter list renders normally
- No empty state visible
- Behavior identical to before implementation (no regression)

## Test plan / notes

- **Playwright E2E coverage**: Add test in `tests/facility/patient/encounterHistory.spec.ts` (or similar):
  - Test 1: Nurse user sees no "Create Encounter" button in empty state
  - Test 2: Admin user sees "Create Encounter" button in empty state
  - Test 3: Admin user can open dialog from empty-state button
- **CI must pass**: All existing tests must pass without regression
- **Permissions**: Verify `canCreateEncounter` extracted from `getPermissions()` result
- **Code review**: Confirm pattern matches `PatientHome.tsx:156` reference implementation
