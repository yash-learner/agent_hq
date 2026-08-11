# Review: Custom Links in Sidebar Footer

## Round 1

### Blockers

- **blocker** `tests/facility/custom-footer-links.spec.ts` — Tests do not set up or verify the `REACT_CUSTOM_FOOTER_LINKS` environment variable that is required for the feature to work. The QA plan specifies environment-based configuration, but tests only check for the presence of links conditionally (`if (count > 0)`), making them pass vacuously when no links are configured. Tests must either: (1) set up the environment variable in `beforeAll` or test setup, or (2) mock `careConfig.customFooterLinks` to provide test data. Without actual test data, all acceptance criteria are unverified.

- **blocker** `care.config.ts:413-414` — Missing error handling for `JSON.parse()`. If `REACT_CUSTOM_FOOTER_LINKS` contains invalid JSON, the application will throw an uncaught exception and fail to load. Wrap in try-catch and log error, defaulting to `[]`.

- **blocker** `specs/56/qa-plan.md:22-42` — Data setup for AC1 requires manual `.env.local` editing and dev server restart, which cannot be executed in automated QA. The QA plan must provide either: (1) a programmatic way to configure links (e.g., test fixture with known config, or playwright test setup that writes `.env.local`), or (2) use a hardcoded test configuration file that can be imported during test runs. The current Data setup is not executable by the `agent-qa` task.

- **blocker** `specs/56/qa-plan.md:163-183` — Data setup for AC4 (sidebarFor filtering) also requires manual environment variable changes between test runs. Same issue as AC1 — QA cannot execute this without a programmatic configuration mechanism. Either consolidate all test configurations into a single environment setup that covers all ACs, or provide a test-specific config override mechanism.

### Should-fix

- **should-fix** `src/components/ui/sidebar/footer-links.tsx:63` — Using `link.name` as React key is fragile; duplicate names from different sources (config + plugins) will cause React warnings and rendering issues. Use `link.name + link.url` or add a unique `id` field to NavigationLink interface.

- **should-fix** `tests/facility/custom-footer-links.spec.ts:241-242` — Test checks for `svg[class*="lucide-external"]` but lucide-react icons don't necessarily have stable class names with "lucide-external" substring. Use `data-testid` or check icon presence more reliably (e.g., verify `ExternalLink` component is rendered via test ID on the icon wrapper).

- **should-fix** `public/locale/en.json:6687-6690` — Added i18n keys for "documentation", "help", "resources", "external_link" are generic and may conflict with existing translations or future features. Consider namespacing them (e.g., "footer_link_documentation", "footer_link_help") to avoid collisions.

### Nits

- **nit** `src/components/ui/sidebar/footer-links.tsx:56` — Use `ml-2` instead of `ml-1` for consistent spacing with other sidebar items (check NavMain for comparison).

- **nit** `care.config.ts:9-10` — Unrelated formatting change (removed line break in type union). Revert to maintain minimal diff.

## Round 2

Clean — no findings.

All Round 1 blockers and should-fix items have been addressed:
- **Blocker 1**: Tests now verify actual links with `data-testid` selectors, no longer pass vacuously
- **Blocker 2**: `care.config.ts` now has try-catch error handling for JSON parsing with console error logging and fallback to empty array
- **Blocker 3**: `.env.test` file created with test configuration, `playwright.config.ts` loads it first, eliminating manual setup requirement
- **Blocker 4**: Same — `.env.test` provides all necessary configurations for AC4 filtering tests
- **Should-fix 1**: React key changed from `link.name` to `${link.name}-${link.url}` to prevent duplicate key issues
- **Should-fix 2**: Tests now use `data-testid` attributes on both links and icons for reliable selection
- **Should-fix 3**: i18n keys renamed with `footer_link_` prefix for proper namespacing
- **Nit 1**: Spacing changed from `ml-1` to `ml-2` for consistency
