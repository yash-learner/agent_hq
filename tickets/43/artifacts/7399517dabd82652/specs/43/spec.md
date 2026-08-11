# Spec: Permission-gate EncounterHistory empty-state "Create Encounter" button

## Problem

The empty-state "Create Encounter" button in `EncounterHistory.tsx` renders unconditionally for all users, even those without `can_create_encounter` permission. This inconsistency allows unauthorized users to see the button, though the actual encounter creation may fail server-side. The PatientHome.tsx create-encounter button correctly checks this permission before rendering.

## Acceptance Criteria

1. Given a user without `can_create_encounter` permission viewing a patient with zero encounters, when EncounterHistory renders empty state, then no "Create Encounter" button appears.
2. Given a user with `can_create_encounter` permission viewing a patient with zero encounters, when EncounterHistory renders empty state, then "Create Encounter" button appears as before.
3. Given a user with `can_create_encounter` permission viewing a patient with existing encounters, when EncounterHistory renders, then behavior remains unchanged (no empty state, button not relevant).
4. Given EncounterHistory.tsx already calls `getPermissions(hasPermission, patientData.permissions)`, when the fix is applied, then `canCreateEncounter` is extracted from the existing permissions object.

## Capability Notes

- `src/components/Patient/PatientDetailsTab/EncounterHistory.tsx:38-41` — Existing `getPermissions()` call extracts `canViewPatients` from patient permissions; needs `canCreateEncounter` added.
- `src/components/Patient/PatientDetailsTab/EncounterHistory.tsx:82-93` — Empty-state `<CreateEncounterForm>` with trigger button needs conditional render wrapper `{canCreateEncounter && ...}`.
- `src/pages/Patient/PatientHome.tsx:156` — Reference implementation showing correct `{canCreateEncounter &&` wrapper pattern.
- `src/common/Permissions.tsx:310` — Permission mapping returns `canCreateEncounter: hasPermission(PERMISSION_CREATE_ENCOUNTER, permissions)`.
- `src/common/Permissions.tsx:12` — Constant `PERMISSION_CREATE_ENCOUNTER = "can_create_encounter"` defines the permission slug.

## Open Questions

None.
