# Review: Infinite scroll pagination for Encounter Medicine Dispense History selector

## Round 1

- **blocker** `tests/` — Missing Playwright E2E tests; qa-plan requires `tests/facility/patient/encounter/medicine/dispenseOrderPagination.spec.ts` with coverage for AC1 (first page loads 14 entries), AC2 (scroll triggers next page), AC3 (end-of-list stops fetching), and AC5 (short list no pagination). Constitution requires "Every implementation task ships tests for the code it adds."
