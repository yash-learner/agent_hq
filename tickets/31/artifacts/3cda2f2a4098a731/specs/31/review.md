# Review: Left-nav hyperlinks via env config + plugin hooks

## Round 1

- **blocker** `specs/31/qa-plan.md` AC1-AC5 — Data setup sections reference "Dummy Facility" and "fixtures from load-fixtures" but never cite concrete facility IDs or verify these fixtures exist in the backend seed. Per constitution Data setup gate, each criterion needing non-default data must provide provenance: fixture ID, API endpoint from `*Api.ts`, or proven UI recipe. Add verified facility ID from backend fixtures or cite `tests/setup/*.setup.ts` / `tests/**/*` API setup showing facility creation.

- **blocker** `specs/31/qa-plan.md` AC6 — Steps section includes "code review" actions (steps 1-3) that aren't live QA traversals. These belong in "Test plan / notes" section under "Playwright E2E coverage (not live QA criteria)", not numbered Action/Expect pairs. Move code-path proof notes out of Steps; live AC6 should be marked `not-exercised` with environment-limitation blocker immediately (no separate code-review steps in live criteria list).

- **blocker** `src/components/ui/sidebar/nav-user.tsx:139` — Plugin nav items use `{t(item.name)}` assuming i18n keys, but env-configured links use `{item.name}` (line 154) as free text. This creates inconsistent behavior: plugin links fail if `name` isn't a valid i18n key, while env links always display. Either both should use `t()` with fallback to raw name, or both should be free text. Resolve by changing line 139 to `{item.external ? item.name : t(item.name)}` (external links = operator-supplied free text) or document in spec that plugin nav item names must be i18n keys.

- **should-fix** `src/components/ui/sidebar/nav-main.tsx:82` — External links missing accessibility announcement for "opens in new tab". Add `aria-label` or screen-reader-only text: e.g., `aria-label={\`\${children} (opens in new tab)\`}` or append `<span className="sr-only"> (opens in new tab)</span>` inside `<a>`.

- **should-fix** `care.config.ts:34,109` and `src/components/ui/sidebar/nav-user.tsx:150` — Type assertion `as NavigationLink[]` bypasses runtime validation. If env JSON contains invalid field types (e.g., `url: 123` instead of string), code won't catch it until render fails. Add Zod schema or manual checks for `typeof link.url === 'string'` after parsing.

- **should-fix** `care.config.ts:9-10` — Unrelated formatting change to `defaultDischargeDisposition` type annotation (moved `| undefined` to new line). Revert or note as style-only in commit message; not part of this ticket's scope.
