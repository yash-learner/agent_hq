# Review: Add Search to Facility Selector on User Home

## Round 1

- **blocker** `tests/PLAYWRIGHT_GUIDE.md:90-94` — Unintended formatting corruption. Lines 90-94 have removed newlines, concatenating multiple code lines into single lines (e.g., all facility route examples are now on one line instead of separate lines). These changes are not part of the ticket scope and break the documentation formatting. Revert these changes to restore the original multi-line format.
- **blocker** `tests/README.md:194` — Unintended formatting change. Line 194 has lost its trailing newline. This change is not part of the ticket scope. Revert to restore the original formatting.
- **should-fix** `specs/53/qa-plan.md` — Data setup lacks concrete provenance for facility names. The plan states fixtures "typically include facilities like 'Facility A', 'Facility B', etc." and AC1 step 3 uses "Apollo Hospital" and "Apollo Clinic" as examples without confirming these exist in the backend fixtures. Either cite the exact fixture file (e.g., `care/data/facility/facilities.json`) with actual facility names, or update the examples to use fixture-backed names. QA needs concrete, provenance-backed facility names to execute the test steps.
- **nit** `src/components/ui/sidebar/facility/facility-switcher.tsx:108` — Using array index as key when `facility.id` is available and unique. Change `key={index}` to `key={facility.id}`.

## Round 2

- **blocker** `tests/PLAYWRIGHT_GUIDE.md:90-94` — Unintended formatting corruption persists from Round 1. URL examples remain concatenated on single lines without proper newlines (e.g., line 90: `` `/facility/${facilityId}/overview``/facility/${facilityId}/settings/locations`...` ``). This breaks code readability. Each URL path must be on its own line within the code block. Revert to the original multi-line format where each URL is on a separate line.
