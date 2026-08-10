# Review: Add expiry date to purchase delivery table

## Round 1

- **blocker** `specs/45/qa-plan.md:47` — Data setup relies on vague stock selection ("Select a stock item with expiry date") without provenance-backed fixture data or API seed recipe. Need specific fixture IDs/values or API paths from `src/types/**/*Api.ts` to create stock with known expiry dates for reproducible verification. Compare against proven seed logic in `tests/facility/services/locations/inventory/*.spec.ts` for stock creation patterns.

## Round 2

Clean — no findings.
