# qa-report.json contract checklist (machine-enforced)

Every rule below is enforced by collect (`schemas/qa-report.schema.json` +
`engine/qa_report.py`). A single violation rejects the whole run's artifacts
and burns a retry — walk this list against your final `qa-report.json`
before finishing.

## Spelling and shape (schema, `additionalProperties: false`)

- [ ] Criterion `verdict` is exactly `pass`, `fail`, or **`not-exercised`**
      (hyphen). `not_exercised` as a verdict is a schema violation — the
      underscore spelling exists **only** as the `summary.not_exercised`
      count key.
- [ ] Every criterion has **exactly** these keys: `id`, `title`, `verdict`,
      `evidence_kind`, `blocker`, `blocker_category`, `plan_steps_run`,
      `videos`, `screenshots` — plus `seed_attempt` **only** in the
      missing-test-data case. **No extra keys** (`notes`, `comment`,
      `evidence`, …): the schema rejects unknown properties outright.
- [ ] `summary` has exactly `all_passed`, `pass`, `fail`, `not_exercised` —
      nothing else.
- [ ] `blocker_category`, when set, is one of the thirteen enum values from
      the blocker list (schema-checked; no invented categories).

## Verdict consistency

- [ ] `summary.pass` / `summary.fail` / `summary.not_exercised` equal the
      actual criteria verdict counts.
- [ ] `summary.all_passed` is `true` **only** when there is at least one
      criterion and zero `fail` / `not-exercised`. Zero criteria ⇒
      `all_passed: false` (nothing proven).

## `pass` criteria

- [ ] `evidence_kind` is `live-flow` (any other kind, including
      `code-inspection`, can never back a pass).
- [ ] `blocker` and `blocker_category` are both `null`.
- [ ] `videos` contains the canonical path **exactly**
      `specs/{ticket}/videos/{id}.webm` (basename = criterion `id`), and
      that file exists on disk.
- [ ] **Each video file is claimed by exactly ONE criterion** — a clip listed
      under two ids rejects the report, whichever order they appear.
- [ ] Matching `specs/{ticket}/qa-drivers/{id}.mjs` exists, and
      `specs/{ticket}/qa-logs/{id}.log` exists **and is non-empty**.
- [ ] **MCP live transcript (agent-qa / any run with `mcp_servers`):** the
      log must name MCP browser tools (`browser_start_video`,
      `browser_navigate`, `browser_click`, `browser_snapshot`, …). A log that
      only shows `chromium.launch` / `page.goto` / `openAuthedContext` is
      rejected — that is script-driven live QA, not MCP. Drivers may still
      be Playwright scripts (codify-after); the **log** is the live proof.
- [ ] Screenshots-only mode applies **only** when the repo's media policy has
      `video: false, screenshots: true` — then ≥1 existing screenshot
      replaces the video requirement.

## `fail` / `not-exercised` criteria

- [ ] `blocker` is a **non-empty** string — a `fail` with `blocker: null` or
      `""` is rejected, even when the failure is obvious from the title.
- [ ] `blocker_category` is set (never `null` for a non-pass).
- [ ] If `plan_steps_run` is non-empty (you attempted steps):
      `qa-drivers/{id}.mjs` and non-empty `qa-logs/{id}.log` must exist.
      Only a true pre-execution blocker (e.g. `no-qa-plan`) may stay
      receipt-free with empty `plan_steps_run`.

## `missing-test-data` (the strictest case)

- [ ] `plan_steps_run` is **non-empty** — it must name the seed/live steps
      actually executed; empty steps with this category are rejected.
- [ ] `seed_attempt` is present: an object with `method` and `summary`.
- [ ] `seed_attempt.method` is `ui`, `api`, or `both` — **never `none`**
      (`none` means no seed was attempted, which contradicts the claim).
- [ ] `seed_attempt.summary` is non-empty (routes/entities/errors tried).
- [ ] Canonical driver + non-empty log exist for the criterion (same
      receipts as an attempted fail).

## Final self-check

- [ ] The file parses as JSON (`node -e 'JSON.parse(...)'` or `python3 -m
      json.tool`) and matches the shape in the prompt exactly — the engine's
      schema is not in your worktree, so the prompt's shape is your
      reference.
- [ ] Every media path listed exists on disk at that exact path (no
      `.agent-hq/mcp-output/` leftovers claimed as evidence).
