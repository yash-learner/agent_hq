# QA Report: Permission-gate EncounterHistory empty-state "Create Encounter" button

## Summary

All acceptance criteria passed. The implementation correctly applies the `can_create_encounter` permission check to the empty-state "Create Encounter" button in `EncounterHistory.tsx`, matching the pattern used in other encounter creation entry points.

## Live-flow

### AC1: User without can_create_encounter sees no button in empty state

**Verdict:** Pass

**Steps executed:**
1. Created test patient with zero encounters via API using nurse credentials (care-nurse)
2. Logged in as care-nurse (nurse role lacking can_create_encounter permission)
3. Navigated to patient's Encounters tab
4. Verified empty state displayed without "Create Encounter" button

**Outcome:** Empty state rendered correctly with heading and description, but no "Create Encounter" button appeared for the nurse user. The permission gating works as expected.

[ac1-no-button-nurse](specs/43/videos/ac1-no-button-nurse.webm)

### AC2: User with can_create_encounter sees button in empty state

**Verdict:** Pass

**Steps executed:**
1. Created test patient with zero encounters via API using admin credentials
2. Logged in as admin (has can_create_encounter permission)
3. Navigated to patient's Encounters tab
4. Verified empty state displayed with "Create Encounter" button
5. Clicked button to open encounter creation dialog
6. Closed dialog with Escape key

**Outcome:** Empty state rendered with heading, description, and visible "Create Encounter" button for admin user. Button click successfully opened the encounter creation form. The button is correctly shown when the user has the required permission.

[ac2-button-visible-admin](specs/43/videos/ac2-button-visible-admin.webm)

### AC3: User with can_create_encounter and existing encounters sees no change

**Verdict:** Pass

**Steps executed:**
1. Logged in as admin (has can_create_encounter permission)
2. Navigated to fixture patient's Encounters tab (patient with existing encounters)
3. Verified encounter list displayed without empty state
4. Confirmed no regression in behavior

**Outcome:** The page correctly displayed the encounter list without showing empty state. Found 18 encounter-related elements on the page. No empty-state "Create Encounter" button was present, as expected. Behavior is unchanged from before the fix—no regression detected.

[ac3-existing-encounters](specs/43/videos/ac3-existing-encounters.webm)

## Test Data

All test data was created using the seeded backend fixtures and API calls:

- **Facility:** Used fixture facility ID `6bb10676-1d20-4fc5-b730-0ff203c6e30d`
- **AC1 & AC2:** Created fresh patients via POST `/api/v1/patient/` with zero encounters
  - Fetched `geo_organization` from `/api/v1/organization/?org_type=govt&limit=1`
  - Used synthetic patient names with timestamps to avoid conflicts
- **AC3:** Used fixture patient ID `b4ac8f95-74a0-4bfe-948f-e2798eb5f347` with existing encounters

## Code Inspection

The implementation correctly extracts `canCreateEncounter` from the existing `getPermissions()` call and wraps the empty-state `<CreateEncounterForm>` component with a conditional render `{canCreateEncounter && ...}`, matching the reference implementation in `PatientHome.tsx`. The permission constant `PERMISSION_CREATE_ENCOUNTER = "can_create_encounter"` from `src/common/Permissions.tsx` is properly used.

## Limits

No blockers encountered. All acceptance criteria were executable with the provided fixtures and backend setup. The frontend preview server and backend were both operational throughout testing.
