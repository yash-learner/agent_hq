# Spec: Highlight medicine dosages which aren't 1 to skip overlooking them

## Problem Statement

Nurses frequently assume medicine dosages are always 1 and may overlook non-standard dosages (e.g., 2 tablets, 0.5 tablets, or dose ranges) during medication administration. This creates a patient safety risk when administering medications with dosages other than the standard single-unit dose. Visual highlighting of non-unit dosages makes them immediately obvious without requiring active search or verification.

## Acceptance Criteria

1. Given a medication with dosage quantity = 1, when viewing it in the medications table, then the dosage displays without highlighting.
2. Given a medication with dosage quantity ≠ 1 (e.g., 2, 0.5, 10), when viewing it in the medications table, then the dosage displays with yellow background and bold text.
3. Given a medication with a dose range (e.g., 5mg → 10mg), when viewing it in the medications table, then the dosage displays with yellow background and bold text.
4. Given medications in the administration timeline, when a dosage quantity ≠ 1, then the dosage displays with yellow background and bold text.
5. Given medications in print preview or PDF exports, when a dosage quantity ≠ 1, then the dosage displays with bold text and an indicator (e.g., asterisk or emphasis).
6. Given highlighted dosages, when reviewed for accessibility, then the highlighting does not rely solely on color (includes bold text or other non-color indicator).

## Capability Notes

- `src/components/Medicine/FormattedDosage.tsx` — Component exists with yellow-background highlighting for non-unit doses.
- `src/components/Medicine/utils.ts:isNonUnitDose` — Function exists that identifies dosages ≠ 1 and dose ranges.
- `src/components/Medicine/MedicationsTable.tsx` — Uses `FormattedDosage` component with highlighting enabled.
- `src/components/Medicine/MedicationAdministration/GroupedMedicationRow.tsx` — Uses `FormattedDosage` in administration timeline.
- `src/components/Prescription/PrescriptionPreview.tsx` — Print component uses `formatDosage()` directly without highlighting (needs update).

## Open Questions

None.
