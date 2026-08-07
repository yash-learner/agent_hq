# Review: Add search for the Healthcare Service index page

## Round 1

### Blockers

- **blocker** `tests/facility/services/` — No test coverage added for search functionality; QA plan requires E2E tests for search input rendering, filtering by name, URL persistence, empty state, and clearing search (see qa-plan.md lines 199-209).

## Round 2

### Blockers

- **blocker** `tests/facility/services/serviceSearch.spec.ts:50,63,84,90,106,129,144,158,173,190,207` — All 11 placeholder selectors use `"Search healthcare services"` but the actual i18n string is `"Search healthcare services..."` (with ellipsis); tests will fail to find the input field.
- **blocker** `tests/facility/services/serviceSearch.spec.ts:75,92,98,115,137,148,166,180,198,210` — Using `page.waitForTimeout(500)` instead of proper Playwright waiting strategies; replace with `waitForResponse`, `waitForLoadState`, or element state assertions for debounced searches.

### Should-fix

- **should-fix** `tests/facility/services/serviceSearch.spec.ts:57` — Icon selector `[class*="l-search"]` is fragile and depends on CSS implementation; use semantic locator like `page.locator('[aria-label="Search"]')` or remove this assertion if the input placeholder is sufficient.
- **should-fix** `tests/facility/services/helpers.ts:25` — Empty text filter `.filter({ hasText: /^$/ })` for dialog button is unclear; add a comment explaining why this selects the correct button or use a more semantic selector.
