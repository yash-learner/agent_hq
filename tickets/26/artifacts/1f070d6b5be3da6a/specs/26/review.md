# Review: Add support for inserting links in the left navbar

## Round 1

- **blocker** `specs/26/qa-plan.md:306-321` — QA plan includes Playwright E2E test coverage requirements (test file location `tests/sidebar/navLinks.spec.ts` and test scenarios listed), but the implementation diff shows no E2E tests were created. The spec's implicit testing requirement and QA plan's explicit test expectations are not met. Add the E2E test file covering: rendering custom nav links, external link behavior, link ordering, and edge cases.

- **blocker** `specs/26/qa-plan.md:23-24` — QA plan Data setup states "No additional data setup required" and "Testing uses environment variables only," but AC1 steps require restarting the dev server with different environment variables for each test case. This is not executable in an automated QA run where the environment is pre-configured. The plan must either: (1) provide concrete fixture data or API setup steps that work without server restarts, or (2) explicitly state that AC1/AC3/AC5 are manual-only tests excluded from automated QA, and provide an alternative automated test scenario using a different mechanism (e.g., runtime config API or test-time env injection pattern).

- **blocker** `specs/26/qa-plan.md:86-109` — AC2 Data setup states "If no plugins are enabled in test environment, this AC is verified by code review" but then lists steps requiring plugin presence. Code review is not a valid QA criterion per the constitution's QA task definition (live-flow video evidence required). The plan must provide concrete plugin setup (fixture ID, manifest location, or API configuration path) or declare AC2 manual-only and reduce its scope to ordering verification only (which can be tested via code inspection in Round 1 review, not QA).

- **should-fix** `care.config.ts:25-26` — Type cast `as NavigationLink[]` in `admin-nav.tsx:114` and `facility-nav.tsx:170` is unsafe because `careConfig.navLinks` returns `Array<{name: string, url: string, icon?: ReactNode}>` (inferred from the parsed JSON), but `NavigationLink` requires additional optional fields (`header?`, `headerIcon?`, `children?`, `visibility?`, `external?`). The shape is compatible but not explicitly typed. Change `navLinks` return type in `care.config.ts` to explicitly return `Array<Pick<NavigationLink, 'name' | 'url' | 'icon'>>` or add a type annotation to document the contract.

- **should-fix** `src/components/ui/sidebar/facility/facility-nav.tsx:202-220` — The `processedEnvLinks` transformation logic is duplicated verbatim in both `facility-nav.tsx` and `admin-nav.tsx` (lines 202-220 in facility-nav, lines 88-106 in admin-nav). Extract this to a shared utility function `processEnvNavLinks(envLinks: NavigationLink[]): NavigationLink[]` in `src/Utils/navLinks.ts` to follow DRY principle and ensure consistency if the logic needs updating.

- **nit** `care.config.ts:9-10` — Removed line break in type annotation formatting (`EncounterDischargeDisposition | undefined`) is unrelated to the ticket scope. Revert this whitespace-only change to keep the diff focused on nav links.

## Round 2

- **blocker** `tests/PLAYWRIGHT_GUIDE.md:177-195` — Lines 177-195 were corrupted during implementation. Multiple facility page URLs are now concatenated on single lines without newlines or semicolons (e.g., `` `/facility/${facilityId}/overview` `/facility/${facilityId}/settings/locations` ``), and patient/admin URLs are similarly malformed. This breaks the markdown formatting and makes the guide unreadable. Restore the original line-by-line formatting for each URL path example.

- **blocker** `specs/26/qa-plan.md:23-26,30` — QA plan still states environment testing is "automated in `tests/sidebar/navLinks.spec.ts`" and "not practical for live QA," but AC1 is a core acceptance criterion that must have executable live-flow QA steps. The current plan shifts AC1 entirely to code review and automated tests, which violates the constitution's QA requirement for video evidence of acceptance criteria. Either: (1) provide a live-flow scenario that validates sidebar rendering without requiring rebuild (e.g., verify sidebar accepts config structure via code + validate rendering consistency), or (2) escalate to product-owners that AC1/AC3/AC5 cannot be QA'd live due to build-time config limitation and request approval to mark them manual-only with code/CI coverage as substitute evidence.

- **should-fix** `tests/sidebar/navLinks.spec.ts:11-35` — Test "should display custom nav links in facility sidebar" only verifies core links exist but never checks for actual custom nav links presence. The comment "If REACT_NAV_LINKS is configured..." documents intent but test doesn't validate the AC1 behavior. Either remove the misleading test name and clarify it validates baseline rendering only, or add a sibling test that uses a test-time config override mechanism (if available) to verify custom links actually render.

- **should-fix** `tests/sidebar/navLinks.spec.ts:299-316` — Test "should maintain link order: core → env → plugin" verifies core link presence but doesn't verify ordering of env links or plugin items (only checks that questionnaireIndex >= 0 and valuesetsIndex >= 0). This doesn't validate AC4. Add assertions that verify env links (when present) appear after core items, or clarify test only validates core structure and AC4 ordering is validated elsewhere.

- **nit** `tests/README.md:208` — Added newline at EOF is a code style fix unrelated to nav links feature. While not harmful, keep diff focused on feature scope.

## Round 3

Clean — no findings.
