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

## Round 2

### Blockers

- **blocker** `tests/PLAYWRIGHT_GUIDE.md:90-94` — Unrelated formatting corruption: URL template strings concatenated without separators or newlines. Lines `\`/facility/${facilityId}/overview\`\`/facility/${facilityId}/settings/locations\`` should be separate lines with proper newlines. This breaks the markdown code block and is unrelated to the custom footer links feature. Revert the file to its original state or fix the formatting.

- **blocker** `specs/64/qa-plan.md` AC1-AC4, AC6-AC7 Data setup — The environment variable approach (`REACT_CUSTOM_FOOTER_LINKS`) is documented but not verified. The QA plan claims `care.config.ts` line 465+ supports env vars, but the implementation at line 469 shows `env.REACT_CUSTOM_FOOTER_LINKS ? JSON.parse(env.REACT_CUSTOM_FOOTER_LINKS)` — this assumes `env` object exists. Verify: (1) Does Vite expose `REACT_` prefixed env vars automatically via `import.meta.env`? (2) Is `env` defined in `care.config.ts` (check imports/top of file)? If env parsing is not implemented or tested, the Data setup is not reproducible. Add a manual verification step or a test that confirms the env var is read correctly.

### Should-fix

- **should-fix** `src/components/ui/sidebar/nav-footer-links.tsx:78-80` — Defensive check now translates `"unknown_link"` as a fallback, but this i18n key doesn't exist in `public/locale/en.json`. If both `customLink.name` and `navLink.name` are missing, this will render the literal string `"unknown_link"` untranslated. Either: (1) add `"unknown_link": "Unknown Link"` to `en.json`, or (2) return `null` early if `!customLink.name && !navLink.name` before the translation call (preferred, since the check on line 83 already returns null for missing URL).

- **should-fix** `tests/sidebar/customFooterLinks.spec.ts:175-180` — Test step "Collapse sidebar" assumes `data-sidebar="trigger"` locator exists and collapses sidebar on click. This should be verified: does the facility overview sidebar include a collapse trigger? If not, the test will fail. Either: (1) verify the trigger exists in facility context and document it in a comment, or (2) use `page.locator('[data-sidebar="rail"]').click()` or the actual trigger selector from `app-sidebar.tsx`.

### Clean

No further nits — Round 1 should-fix items and nits were addressed or are acceptable for now.

## Round 3

Clean — no findings.

**Round 2 blockers resolved:**
- `tests/PLAYWRIGHT_GUIDE.md:90-94` — URL concatenation exists in original file, not introduced by this PR (diff shows no changes to PLAYWRIGHT_GUIDE.md)
- `specs/64/qa-plan.md` AC1-AC4, AC6-AC7 env var parsing — Verified: `care.config.ts:31` defines `env = import.meta.env`, and `vite.config.mts` has `envPrefix: "REACT_"`, confirming proper REACT_CUSTOM_FOOTER_LINKS parsing

**Round 2 should-fix resolved:**
- `src/components/ui/sidebar/nav-footer-links.tsx:78-86` — Early return pattern prevents translation of undefined values
- `tests/sidebar/customFooterLinks.spec.ts:38-41` — Comment documents stable selector provenance

**Round 1 blocker resolved:**
- `public/locale/en.json:6687-6688` — Test i18n keys removed (file now ends at line 6688 with only production keys)

**Implementation verified against AC:**
- AC1-AC7: All acceptance criteria have complete Data setup with reproducible env var configuration
- Security: No hardcoded secrets, proper `rel="noopener noreferrer"` on external links, no injection points
- Engineering: No over-engineering, focused implementation, test coverage present
