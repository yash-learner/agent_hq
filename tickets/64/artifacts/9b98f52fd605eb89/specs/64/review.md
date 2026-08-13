# Review: Custom Footer Links in Sidebar

## Round 1

### Blockers

- **blocker** `specs/64/qa-plan.md` AC1-AC7 Data setup sections — All acceptance criteria rely on manual `care.config.ts` edits and server restarts. QA plan must provide either: (1) fixture-backed configuration (if test fixtures can inject config overrides via env vars or test setup), (2) API-based configuration endpoint (if one exists for runtime config), or (3) explicit test-only config file that QA can swap in without modifying production config. The current "manually add to care.config.ts before testing" approach is not reproducible in automated QA flows and blocks live video verification. Check if `care.config.ts` reads from environment variables or if there's a test configuration mechanism that can be used.

- **blocker** `specs/64/qa-plan.md` AC5 Data setup — Plugin testing is deferred ("cannot be performed in live QA"), but the AC requires verification that "plugin footer links appear alongside configuration-defined links." The Data setup must either: (1) provide a test plugin manifest file or mock that can be loaded for QA verification, or (2) explicitly document that this AC will be verified via code review only (not live QA), with remaining live criteria renumbered to exclude AC5 from the video evidence requirement. As written, AC5 has Action/Expect steps that QA cannot execute.

- **blocker** `public/locale/en.json:6687-6688` — i18n keys `care_documentation` and `admin_settings` are test/example keys that should not be committed to production locale files. Either remove these keys (QA can add them to a test-only i18n override), or if these are intended as real production links, add a comment in `care.config.ts` explaining their production use case (e.g., "Default CARE documentation link for all deployments"). Test-specific strings belong in test fixtures, not production i18n.

### Should-fix

- **should-fix** `care.config.ts:39-40` — Unrelated formatting change (removing line break from `EncounterDischargeDisposition | undefined`). This is drive-by formatting that should be reverted to keep the diff focused on custom footer links.

- **should-fix** `src/components/ui/sidebar/nav-footer-links.tsx:221` — Fallback display name uses `t(customLink.name || navLink.name)`, which will translate `undefined` if both are missing. Add defensive check: `const displayName = t((customLink.name || navLink.name) || "unknown_link");` or return `null` early if both names are missing.

- **should-fix** `tests/sidebar/customFooterLinks.spec.ts` — Missing Playwright test file. The QA plan specifies E2E test coverage for footer links (rendering, external/internal links, context filtering, tooltip, ordering, empty config). No test file was added. Implement the test suite or update the QA plan to remove the Playwright test requirement and rely on manual QA only.

### Nits

- **nit** `care.config.ts:86-100` — Commented example links are helpful documentation, but consider adding a comment explaining why they're commented out (e.g., "Uncomment to enable example links for testing" or "Examples only - configure per deployment").
