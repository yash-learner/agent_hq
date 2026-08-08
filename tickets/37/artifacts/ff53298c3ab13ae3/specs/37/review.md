# Review: Infinite scroll pagination for Encounter Medicine Dispense History selector

## Round 1

- **blocker** `src/components/Medicine/DispenseOrderListSelector.tsx:54,62` — Hardcoded `limit: 14` instead of using `RESULTS_PER_PAGE_LIMIT` constant from `src/common/constants.tsx:1`. The spec's capability notes explicitly reference this constant, and the reference implementation (`PrescriptionListSelector.tsx:71`) uses it. Replace both instances with `RESULTS_PER_PAGE_LIMIT`.

- **blocker** `specs/37/qa-plan.md:26-37` — Data setup section shows unproven API seed body for POST `/api/v1/facility/{facilityId}/order/dispense/`. The body example shows `patient`, `location`, `status`, and notes "Additional fields from DispenseOrderCreate type if required" but doesn't verify against the actual type. Per `src/types/emr/dispenseOrder/dispenseOrder.ts:50-53`, `DispenseOrderCreate` requires `patient` (string), `location` (string), and `status` (DispenseOrderStatus enum), with optional `name` and `note` fields. The plan must cite this type definition and confirm the body is complete (status field needs a valid enum value like `"completed"`). Additionally, the plan lacks fixture provenance—it should state whether load-fixtures already provides sufficient dispense orders or document the exact seeding code pattern with proper type adherence.
