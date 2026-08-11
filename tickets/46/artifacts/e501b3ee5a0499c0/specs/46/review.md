# Review: Show all linked departments for user

## Round 1

**Blockers:**

- **blocker** `tests/PLAYWRIGHT_GUIDE.md:124-134` — URL examples are concatenated without line breaks, making the file unreadable. Lines 124-134 merge multiple URL examples into a single continuous string (``/facility/${facilityId}/overview``/facility/${facilityId}/settings/locations`...). Add newlines between each URL example.

**Should-fix:**

None.

**Nits:**

- **nit** `tests/README.md:148` — Missing newline at end of file.
