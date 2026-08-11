# Summary: Permission-gate EncounterHistory empty-state "Create Encounter" button

## What was done

The empty-state "Create Encounter" button in `EncounterHistory.tsx` was permission-gated to match the behavior of other encounter creation entry points. Users without `can_create_encounter` permission no longer see the button when viewing a patient with zero encounters.

## Changes

- Extracted `canCreateEncounter` from the existing `getPermissions()` call in `EncounterHistory.tsx`
- Wrapped the empty-state `<CreateEncounterForm>` component with a conditional render: `{canCreateEncounter && ...}`

## Acceptance Criteria Met

✅ **AC1:** Users without `can_create_encounter` permission see no button in empty state  
✅ **AC2:** Users with `can_create_encounter` permission see the button in empty state  
✅ **AC3:** Users with `can_create_encounter` viewing existing encounters see no behavioral change

## QA Outcome

All acceptance criteria passed with live-flow video evidence. Testing was performed with both nurse (lacking permission) and admin (with permission) user fixtures against fresh test patients and existing fixture patients.

## Review Outcome

Clean implementation after Round 2. Initial review required a more specific QA plan for empty-state data setup; revised plan used fixture facilities and API-created patients to ensure zero-encounter state for testing.
