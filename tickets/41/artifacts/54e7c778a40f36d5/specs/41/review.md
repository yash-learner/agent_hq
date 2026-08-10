# Review: Infinite scroll pagination for Encounter Medicine Dispense History selector

## Round 1

- **blocker** `specs/41/qa-plan.md:46-54` — API seed body template includes invalid fields; `DispenseOrderCreate` (per `src/types/emr/dispenseOrder/dispenseOrder.ts:50-53`) requires only `{patient, location, status}`, but the template includes `encounter` (not a field) and `created_date` (read-only, set by backend). Correct body: `{"patient": "{patientId}", "location": "{locationId}", "status": "completed"}` — remove `encounter` and `created_date` lines.
