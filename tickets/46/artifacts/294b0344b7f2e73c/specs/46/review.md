# Review: Show all linked departments for user

## Round 1

**Blockers:**

- **blocker** `tests/PLAYWRIGHT_GUIDE.md:124-134` — URL examples are concatenated without line breaks, making the file unreadable. Lines 124-134 merge multiple URL examples into a single continuous string (`/facility/${facilityId}/overview`/facility/${facilityId}/settings/locations`...). Add newlines between each URL example.

**Should-fix:**

None.

**Nits:**

- **nit** `tests/README.md:148` — Missing newline at end of file.

## Round 2

**Blockers:**

- **blocker** `tests/PLAYWRIGHT_GUIDE.md:90-95` — Round 1 blocker NOT fixed; actually worsened. URL examples concatenated without line breaks on lines 90, 92, 94. Each template literal needs its own line. Current: `` `/facility/${facilityId}/overview``/facility/${facilityId}/settings/locations` ``. Expected: each on separate line as before the change.

**Should-fix:**

- **should-fix** `tests/facility/users/userDepartmentsInfiniteScroll.spec.ts:119` — Hardcoded role value "member" may not exist in fixtures. Test should query available roles first or use a fixture-proven role ID. Current approach will fail if "member" role doesn't exist in test database.
- **should-fix** `tests/facility/users/userDepartmentsInfiniteScroll.spec.ts:229-233` — Test "user with exactly 14 departments" doesn't create a user with 14 departments; just logs a note and uses existing user. This test doesn't validate AC3 (exactly 14 departments). Either implement proper setup or remove this test case.

**Nits:**

- **nit** `tests/README.md:148` — Missing newline at end of file (from Round 1, still not fixed).
- **nit** `src/components/Users/UserDepartmentsTab.tsx:115` — PAGE_LIMIT constant could be moved to top-level constants file for consistency with `RESULTS_PER_PAGE_LIMIT` in `src/common/constants.tsx`.
