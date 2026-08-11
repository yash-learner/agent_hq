# Review: Display patient search result count

## Round 1

- **blocker** `tests/PLAYWRIGHT_GUIDE.md:531-548` — code block formatting corrupted; lines merged without newlines (e.g., `` `/facility/${facilityId}/overview``/facility/${facilityId}/settings/locations` ``). Restore proper markdown formatting with one path per line.
- **blocker** `tests/` — no test file added; spec and qa-plan require `tests/facility/patient/patientSearch.spec.ts` covering all six acceptance criteria with fixture-based positive/negative cases.
- **blocker** `specs/51/qa-plan.md` — Data setup for AC1 states "Fixture patients have phone numbers" but provides no fixture provenance (file path, seed logic citation, or known IDs). QA needs concrete fixture phone numbers that load_fixtures actually creates, or an API seed recipe with proven body from existing test.
- **blocker** `specs/51/qa-plan.md` — Data setup for AC4 states "Fixture encounters have patient names" but provides no fixture provenance. QA needs concrete patient names from load_fixtures, or proven API seed logic.

## Round 2

Clean — no findings.
