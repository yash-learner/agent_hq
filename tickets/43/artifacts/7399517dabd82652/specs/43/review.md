# Review: Permission-gate EncounterHistory empty-state "Create Encounter" button

## Round 1

- **blocker** `specs/43/qa-plan.md:26-37` — AC1/AC2 data setup is vague and unproven. The fixture patient from `getPatientId()` is extracted from an encounter list (tests/setup/patient.setup.ts:23 navigates to encounters and clicks "View Encounter"), so it will always have encounters. For empty-state testing, the plan needs a concrete, provenance-backed approach to obtain a patient with zero encounters: either (1) cite a fixture patient ID that fixtures create without encounters, or (2) provide a proven API payload with field citations from `src/types/emr/patient/patientApi.ts` or existing test seed logic (e.g., from tests that create patients), or (3) provide a numbered UI recipe with form field names from `src/components/Patient/PatientRegisterForm.tsx` or similar. "The patient from fixtures may have encounters" + "create via UI or API" without concrete steps/payloads is not executable.

## Round 2

Clean — no findings.
