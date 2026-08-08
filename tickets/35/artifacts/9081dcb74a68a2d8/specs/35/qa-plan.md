# QA Plan: Highlight medicine dosages which aren't 1 to skip overlooking them

## AC1 — Medication with dosage quantity = 1 displays without highlighting

### Research map

- routes: `src/Routers/routes/EncounterRoutes.tsx` → `/facility/:facilityId/encounter/:encounterId`
- components: `src/components/Medicine/MedicationsTable.tsx`, `src/components/Medicine/FormattedDosage.tsx`
- i18n labels: "Medicines", "dosage", "Create"
- auth/role: `tests/.auth/user.json`
- permissions / facility-scoped: yes (requires facility context)
- fixtures needed: facility (seeded by load-fixtures), patient with in_progress encounter

### Prerequisites

- User logged in with admin role
- Facility context active
- Patient with an active encounter exists (seeded by load-fixtures)

### Data setup

- Prefer fixtures: load-fixtures creates facility, patients, and encounters
- Facility ID from `.agent-hq/setup-notes.md` (or `getFacilityId()` helper)
- Patient and encounter: use existing fixtures from load-fixtures
- Provenance: Medicine names from `tests/facility/patient/encounter/medicine/prescriptionTestData.ts` (e.g., "Paracetamol", "Amoxicillin")

UI create (if no suitable prescription exists):

1. Go to `/facility/{facilityId}/encounters/patients/all?status=in_progress`
2. Click "View Encounter" on first patient
3. Click "Medicines" tab
4. Click "Create" prescription
5. Click "Add Medication"
6. Select "Medication" tab
7. Search and select medicine (e.g., "Paracetamol")
8. Enter dosage quantity: `1`
9. Enter dosage unit: `tablet`
10. Enter frequency: `1-0-0` (Morning)
11. Click "Submit"
12. Confirm "Questionnaire submitted successfully" toast

### Steps

1. **Action:** Navigate to Medicines tab on an encounter with a medication that has dosage = 1
   **Expect:** The medications table displays with the medication visible
   **Record through:** yes

2. **Action:** Locate the dosage column for the medication with quantity = 1
   **Expect:** The dosage displays as "1 tablet" (or appropriate unit) in regular text without yellow background or bold styling
   **Record through:** yes

3. **Action:** Inspect the dosage cell HTML (browser DevTools)
   **Expect:** The dosage text does not have `.bg-yellow-100` or `.font-semibold` classes
   **Record through:** no (optional verification)

### Success looks like

- Dosage "1 tablet" appears in regular text
- No yellow background highlighting
- No bold emphasis on the dosage value

---

## AC2 — Medication with dosage quantity ≠ 1 displays with yellow background and bold text

### Research map

- routes: `src/Routers/routes/EncounterRoutes.tsx` → `/facility/:facilityId/encounter/:encounterId`
- components: `src/components/Medicine/MedicationsTable.tsx`, `src/components/Medicine/FormattedDosage.tsx`
- i18n labels: "Medicines", "dosage", "Create"
- auth/role: `tests/.auth/user.json`
- permissions / facility-scoped: yes
- fixtures needed: facility, patient with in_progress encounter

### Prerequisites

- User logged in with admin role
- Facility context active
- Patient with an active encounter exists

### Data setup

- Prefer fixtures: use existing facility, patient, and encounter from load-fixtures
- Provenance: Medicine names from `prescriptionTestData.ts`

UI create (if no suitable prescription exists):

1. Go to `/facility/{facilityId}/encounters/patients/all?status=in_progress`
2. Click "View Encounter" on first patient
3. Click "Medicines" tab
4. Click "Create" prescription
5. Click "Add Medication"
6. Select "Medication" tab
7. Search and select medicine (e.g., "Amoxicillin")
8. Enter dosage quantity: `2` (or any value ≠ 1, e.g., 0.5, 10)
9. Enter dosage unit: `tablet`
10. Enter frequency: `1-1-1` (Three times a day)
11. Click "Submit"
12. Confirm "Questionnaire submitted successfully" toast

### Steps

1. **Action:** Navigate to Medicines tab on an encounter with a medication that has dosage ≠ 1
   **Expect:** The medications table displays with the medication visible
   **Record through:** yes

2. **Action:** Locate the dosage column for the medication with quantity ≠ 1 (e.g., 2 tablets)
   **Expect:** The dosage displays with yellow background (`.bg-yellow-100`) and bold text (`.font-semibold`)
   **Record through:** yes

3. **Action:** Verify visual emphasis is distinct from unit dosages in the same table
   **Expect:** Non-unit dosages stand out visually with yellow highlighting and bold text; unit dosages (if present) appear in regular text
   **Record through:** yes

### Success looks like

- Dosage "2 tablet" appears with yellow background
- Text is bold/semibold
- Visually distinct from unit (=1) dosages

---

## AC3 — Medication with dose range displays with yellow background and bold text

### Research map

- routes: `src/Routers/routes/EncounterRoutes.tsx` → `/facility/:facilityId/encounter/:encounterId`
- components: `src/components/Medicine/MedicationsTable.tsx`, `src/components/Medicine/FormattedDosage.tsx`
- utils: `src/components/Medicine/utils.ts:isNonUnitDose()` detects dose ranges
- auth/role: `tests/.auth/user.json`
- permissions / facility-scoped: yes
- fixtures needed: facility, patient with in_progress encounter

### Prerequisites

- User logged in with admin role
- Facility context active
- Patient with an active encounter exists

### Data setup

**Note:** Dose range creation UI may not be fully implemented yet in the prescription form. If the UI does not support entering dose ranges (e.g., 5mg → 10mg), this criterion can be verified by:

1. Using backend API to create a medication request with a dose range (see API seed below)
2. Or skipping this criterion until dose range UI is implemented

API seed (if UI not available):

- POST `/api/v1/patient/{patientId}/medication_request/`
  (from `src/types/emr/medicationRequest/medicationRequestApi.ts`)
- Auth: `getApiUrl()` + `getApiHeaders()` + `tests/.auth/user.json`
- Body (example with dose range):
  ```json
  {
    "encounter": "{encounterId}",
    "medication": { "code": "...", "display": "Morphine" },
    "dosage_instruction": [
      {
        "dose_and_rate": {
          "dose_range": {
            "low": { "value": 5, "unit": { "display": "mg" } },
            "high": { "value": 10, "unit": { "display": "mg" } }
          }
        },
        "timing": {
          "repeat": { "frequency": 1, "period": 1, "period_unit": "d" }
        }
      }
    ]
  }
  ```
- Verify: refresh Medicines tab; confirm the medication appears with dose range

### Steps

1. **Action:** Navigate to Medicines tab on an encounter with a medication that has a dose range (e.g., 5mg → 10mg)
   **Expect:** The medications table displays with the medication visible
   **Record through:** yes

2. **Action:** Locate the dosage column for the medication with dose range
   **Expect:** The dosage displays as "5 mg -> 10 mg" (or similar format) with yellow background and bold text
   **Record through:** yes

3. **Action:** Verify the dose range highlighting matches the styling of other non-unit doses
   **Expect:** Yellow background and bold text consistent with AC2
   **Record through:** yes

### Success looks like

- Dose range "5 mg -> 10 mg" appears with yellow background and bold text
- Visually consistent with other non-unit dose highlighting

---

## AC4 — Medications in administration timeline with dosage ≠ 1 display with yellow background and bold text

### Research map

- routes: `src/Routers/routes/EncounterRoutes.tsx` → `/facility/{facilityId}/encounter/:encounterId`
- components: `src/components/Medicine/MedicationAdministration/GroupedMedicationRow.tsx`, `src/components/Medicine/FormattedDosage.tsx`
- i18n labels: "Medicines", "Administration", "Administer"
- auth/role: `tests/.auth/nurse.json` or `tests/.auth/user.json` (admin can also administer)
- permissions / facility-scoped: yes
- fixtures needed: facility, patient with in_progress encounter, medication request with dosage ≠ 1

### Prerequisites

- User logged in with nurse or admin role
- Facility context active
- Patient with active encounter and a medication request with dosage ≠ 1
- At least one medication administration scheduled in the timeline

### Data setup

- Prefer fixtures: use existing facility, patient, encounter, and medication request from previous AC2 steps
- Provenance: same medication created in AC2 with dosage ≠ 1

If medication administration timeline is empty:

1. Navigate to encounter Medicines tab
2. Locate the medication with dosage ≠ 1
3. Click "Administer" button (if available) or ensure a scheduled administration exists
4. The administration timeline should display with the medication's dosage visible

### Steps

1. **Action:** Navigate to Medicines tab on an encounter with a medication that has dosage ≠ 1
   **Expect:** The medications table displays
   **Record through:** yes

2. **Action:** Scroll to the medication administration timeline (below the medications table)
   **Expect:** The timeline displays with grouped medication rows showing scheduled administration slots
   **Record through:** yes

3. **Action:** Locate the medication with dosage ≠ 1 in the timeline
   **Expect:** The dosage displays with yellow background (`.bg-yellow-100`) and bold text (`.font-semibold`)
   **Record through:** yes

4. **Action:** Compare with any medications in the timeline that have dosage = 1
   **Expect:** Non-unit dosages are highlighted; unit dosages are not
   **Record through:** yes

### Success looks like

- Medication dosage ≠ 1 appears in the administration timeline with yellow background and bold text
- Consistent highlighting with the medications table
- Distinct from unit dosages in the timeline

---

## AC5 — Medications in print preview with dosage ≠ 1 display with bold text and asterisk indicator

### Research map

- routes: `src/Routers/routes/EncounterRoutes.tsx` → `/facility/:facilityId}/encounter/:encounterId`
- components: `src/components/Prescription/PrescriptionPreview.tsx`, `src/components/Medicine/MedicationAdministration/PrintMedicationAdministration.tsx`
- utils: `src/components/Medicine/utils.ts:formatDosageForPrint()`
- i18n labels: "Print", "Prescription Print Preview"
- auth/role: `tests/.auth/user.json`
- permissions / facility-scoped: yes
- fixtures needed: facility, patient with encounter, prescription with medication (dosage ≠ 1)

### Prerequisites

- User logged in with admin role
- Facility context active
- Patient with encounter containing a prescription with at least one medication with dosage ≠ 1

### Data setup

- Prefer fixtures: use prescription created in AC2 with medication dosage ≠ 1
- Provenance: same data as AC2

### Steps

1. **Action:** Navigate to Medicines tab on an encounter with a prescription containing medication with dosage ≠ 1
   **Expect:** The medicines view displays with prescriptions listed in the sidebar
   **Record through:** yes

2. **Action:** Click on the prescription card (in the sidebar or main area) containing the medication with dosage ≠ 1
   **Expect:** The prescription details view opens
   **Record through:** yes

3. **Action:** Click the "Print" button to open the prescription print preview
   **Expect:** The print preview modal/page opens showing the prescription in print format
   **Record through:** yes

4. **Action:** Locate the dosage column in the printed medications table
   **Expect:** The dosage ≠ 1 displays as bold text with an asterisk indicator (e.g., "2 tablet *")
   **Record through:** yes

5. **Action:** Verify the bold styling is visible in print preview (font-weight appears heavier than normal text)
   **Expect:** The dosage text is bold (`.font-extrabold`) and includes the asterisk (*) character
   **Record through:** yes

6. **Action:** Compare with any unit dosage (=1) in the same print preview
   **Expect:** Unit dosages display without bold text and without asterisk indicator
   **Record through:** yes

### Success looks like

- Non-unit dosage displays as "2 tablet *" in bold text
- Asterisk (*) indicator present after the dosage value
- Unit dosages (=1) appear in regular text without asterisk
- Bold styling visible in print/PDF export

---

## AC6 — Highlighted dosages do not rely solely on color (includes bold text)

### Research map

- components: `src/components/Medicine/FormattedDosage.tsx` (uses both `.bg-yellow-100` and `.font-semibold`)
- accessibility: WCAG 2.1 AA compliance requires non-color indicators
- auth/role: `tests/.auth/user.json`
- permissions / facility-scoped: yes
- fixtures needed: facility, patient with encounter, medication with dosage ≠ 1

### Prerequisites

- User logged in with admin role
- Facility context active
- Patient with encounter containing medication with dosage ≠ 1

### Data setup

- Prefer fixtures: use medication created in AC2 with dosage ≠ 1

### Steps

1. **Action:** Navigate to Medicines tab on an encounter with a medication that has dosage ≠ 1
   **Expect:** The medications table displays with the highlighted dosage visible
   **Record through:** yes

2. **Action:** Use browser DevTools to inspect the highlighted dosage element
   **Expect:** The dosage has both color (`.bg-yellow-100`) and bold text (`.font-semibold`) classes
   **Record through:** yes

3. **Action:** Use a browser extension or DevTools to simulate color blindness (e.g., grayscale mode)
   **Expect:** The dosage remains visually distinct due to bold text weight, even without color
   **Record through:** yes

4. **Action:** Review the print preview (AC5) to confirm bold + asterisk indicator
   **Expect:** Print view uses bold text and asterisk (*) indicator, not color
   **Record through:** yes

5. **Action:** Test with screen reader (optional, if screen reader testing is available)
   **Expect:** Screen reader announces the dosage value correctly (e.g., "2 tablet")
   **Record through:** no (optional accessibility verification)

### Success looks like

- Highlighted dosage uses both color (yellow background) and bold text
- Dosage remains distinct in grayscale/color-blind mode due to bold text
- Print view uses bold + asterisk, not color
- Accessibility standards met (WCAG 2.1 AA)

---

## Test plan / notes

### Playwright E2E coverage

- Existing tests in `tests/facility/patient/encounter/medicine/prescriptionCreate.spec.ts`:
  - "Add medication to patient prescription" — verifies non-unit dosage highlighting in table (AC2)
  - "Unit dosage is not highlighted in patient prescription" — verifies unit dosage not highlighted (AC1)
- New tests in `tests/facility/patient/encounter/medicine/prescriptionPrintDosageHighlighting.spec.ts`:
  - "Non-unit dosage is highlighted with bold and asterisk in print preview" — verifies AC5
  - "Unit dosage (1) is not highlighted in print preview" — verifies AC5 (negative case)
  - "Dose range is highlighted in print preview" — skipped until dose range UI is implemented (AC3)

### CI expectations

- All tests should pass on CI
- Linting and formatting should pass (`npm run lint`, `npm run format`)
- Build should succeed (`npm run build`)

### Manual QA focus

- Visual verification of highlighting in different contexts (table, timeline, print)
- Accessibility testing with color blindness simulation
- Print/PDF export verification (bold + asterisk indicator)
- Dose range highlighting (if UI is implemented)

### Known limitations

- Dose range creation UI may not be fully implemented yet; AC3 may require API seed or be deferred
- MAR print preview (PrintMedicationAdministration) not yet tested in Playwright (can be added if needed)
