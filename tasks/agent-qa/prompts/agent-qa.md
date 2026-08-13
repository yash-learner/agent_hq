# Agent QA prompt (MCP-driven)

Read `constitution.md`, `specs/{ticket}/spec.md`, `specs/{ticket}/review.md`,
and `specs/{ticket}/qa-plan.md` when it was handed to you (see Available
inputs). Your worktree is already checked out at the implemented branch — the
code under test is there, and you have Bash, Node 22, Docker, **and the
`playwright` MCP server**: browser tools (navigate / click / type / snapshot)
plus `browser_start_video` / `browser_stop_video` for per-criterion
recordings. Drive the running app **through those MCP tools** — do not write
and run your own Playwright driver scripts for the interactive session
(codifying what worked afterwards is required, see Evidence ledger).

## Phases (in order)

1. **Read the plan + setup-notes.** Execute `qa-plan.md`; do not rebuild the
   environment. If there is no plan (or it is empty of steps for a user-facing
   criterion), that criterion is `not-exercised` with `blocker_category:
   no-qa-plan` — do not invent a pass from code reading.
2. **Open the real app + prove authenticated shell.** Navigate the MCP browser
   to the preview URL from `.agent-hq/setup-notes.md` and establish the
   signed-in session it describes (storageState / fixture login). Pass the
   **auth shell readiness** gate below before any facility-scoped criterion.
   Missing facility → `not-exercised` / `missing-facility-context`.
3. **Seed data (ordered ladder — hard rule).** For each live criterion that
   needs non-default data, climb this ladder; do not skip steps. Start the
   criterion's log **before** seeding (see Evidence ledger below).

   1. **Fixtures / setup-notes** — use what load-fixtures and setup-notes
      already provide (IDs, auth, facility).
   2. **UI-create** — if an entity is missing, **execute** the numbered Data
      setup steps in `qa-plan.md` through the MCP browser until a concrete
      visible error. Opening or inspecting a form, or calling the graph
      “impractical,” does **not** count as a UI attempt. Use unique synthetic
      names (never real patient data). For terminology-backed fields, use the
      UI picker or its valueset expansion route — never invent
      LOINC/SNOMED/code strings.
   3. **API seed escape hatch** — only when `qa-plan` marks a deep graph
      (dependent entity types / multi-page settings — **not** click count)
      **or** UI create failed with a recorded error. Facility-scoped
      fetch/`request` only, then open the UI and confirm the entity is
      visible before scoring.
      - Prefer paths and bodies already pasted in `qa-plan` Data setup.
      - If a planned API body returns **4xx**, retry once from a known-working
        `tests/**` helper / `beforeAll` / `apiSetup` payload before declaring
        a data wall. A proven plan payload rejected by validation is
        `validation-error`, **not** automatically `missing-test-data`.
      - If paths are missing: run the thin discovery recipe below. Never invent
        BE/Django URLconf names or unscoped `/api/v1/<resource>/` routes.
      - Auth: `getApiUrl` + `getApiHeaders` from `tests/helper/utils.ts`
        and `tests/.auth/user.json` (see setup-notes). On `token_not_valid` /
        expired → **mid-session token recovery** below before `auth-failure`.
   4. **Only then** `not-exercised` + `missing-test-data` (or
      `missing-permission` / `missing-facility-context` for true walls).

   Ban weak excuses: claiming API blocked after calling unscoped routes;
   claiming “exceeds time budget” without a concrete failed UI/API attempt;
   jumping straight to `missing-test-data` when fixtures or UI create could
   supply the entity; assessing complexity instead of executing numbered
   steps.

   When reporting `missing-test-data`, fill `seed_attempt` honestly in
   `qa-report.json` (`method`: `ui` | `api` | `both` | `none`, plus a
   `summary` of what was tried — routes/entities/errors). Do not use
   `method: none` or an empty summary after claiming you could not seed.
   `plan_steps_run` must name each seed/live step actually executed —
   **empty `plan_steps_run` cannot accompany `missing-test-data`**.

   Exercise criteria **independently** when their fixtures exist, even if
   sibling criteria remain blocked on a seed graph.

4. **Execute live criteria one-by-one through the MCP browser.** Default
   evidence is **video**. Per criterion, in this exact order:
   1. `browser_start_video` with `filename: {criterion-id}.webm` (the `id`
      from `qa-report.json`).
   2. Exercise the criterion's plan steps against the running app (navigate,
      click, type, assert via snapshot).
   3. `browser_stop_video`.
   4. Move/copy the finished clip from the MCP output dir
      (`.agent-hq/mcp-output/`) to exactly
      `specs/{ticket}/videos/{criterion-id}.webm`.

   **One recording per criterion — start and stop around exactly one AC.**
   Never let a single video span two criteria, and never claim one clip for
   two ids: the collector rejects a video claimed by more than one criterion.
   Optional stills only when the Evidence media policy (injected above) has
   `screenshots: true`, or as extras that do not count for pass. Prefer
   role/label targeting from the plan's research map — never invent button
   names.
5. **Validate success signals** from the plan (toast, URL, visible state) in
   the recorded session, via snapshots.
6. **Codify + log (per criterion, after the live session).** Write the
   canonical receipts the collector requires — see Evidence ledger below.
7. **Write `qa.md` + `qa-report.json`, then self-validate.** Live evidence is
   primary; code inspection belongs only in notes / Limits — never as a
   `pass`. Before finishing, check `qa-report.json` line-by-line against the
   **qa-report contract checklist** (injected below) — every rule there is
   enforced at collect, and a violation fails the whole run.

### Auth shell readiness (hard gate)

Before any facility-scoped criterion, prove an authenticated **app shell**.
CARE can leave the browser on `/facility/.../overview` while rendering the
login PublicRouter when `currentUser` fails silently — **URL without
`/login` is not proof of auth.**

1. Establish the signed-in session from setup-notes (storageState import or
   UI login with fixture credentials).
2. Navigate to a facility route from setup-notes / `getFacilityId()`.
3. Wait until **all** of:
   - loading spinner gone
   - at least one known facility nav label visible (e.g. Overview / Patients),
     **or** `[data-sidebar="sidebar"]` visible on desktop
4. Also probe for login UI (`Username` / `Password` / Sign in). If present
   while the URL is still a facility path → treat as auth failure and run
   **mid-session token recovery** (fresh UI login) before scoring.

**Ban:** treating “URL has no `/login`” or “title is CARE” as proof of auth.

Blocker taxonomy:

- Shell never authenticates after storageState + refresh + fresh login →
  `auth-failure`
- Authenticated shell present but expected nav/control missing →
  `navigation-mismatch` (or fail the AC), **not** `auth-failure`
- Expired access token on API seed **without** a refresh attempt → dishonest;
  log must show the refresh try

### Mid-session token recovery (refresh, do not surrender)

Node seed scripts that read a static `care_access_token` from
`tests/.auth/user.json` do **not** auto-refresh. Filing `auth-failure` on the
first `token_not_valid` / “Token is expired” is **banned**.

Ordered recovery before any `auth-failure`:

1. **Refresh JWT** — `POST /api/v1/auth/token/refresh/` with
   `care_refresh_token` from the same storageState; write new access/refresh
   back into `tests/.auth/user.json` (or an in-memory header helper for the
   rest of the run). Retry the failed API call once. Log status codes, not
   secrets.
2. **If refresh fails** — UI login through the MCP browser with fixture
   credentials; re-check authenticated shell; retry seed/API.
3. **Prefer UI continuation** when the browser session is still authenticated
   even if a seed script’s file token expired — do not abandon live criteria
   solely because a Node `fetch` used a stale header.
4. **Only then** `not-exercised` + `auth-failure`, with log proof that refresh
   and re-login were attempted.

Ban cascading sibling ACs as `auth-failure` without attempting recovery once.

### Thin discovery cookbook (how to find things — not a CARE encyclopedia)

Before inventing selectors or payloads:

1. Prefer pasted **Data setup** in `qa-plan.md` (exact UI steps + paths +
   proven bodies).
2. Then `tests/PLAYWRIGHT_GUIDE.md` + `rg` under `tests/` for helpers,
   `beforeAll`, `apiSetup`, and terminology constants.
3. Then `src/types/**/*Api.ts` for create paths (**verbatim**).
4. Valueset-backed codes via UI picker / expand API — never invent LOINC
   strings.
5. Auth shell probes (section above).

### API route discovery (fallback when qa-plan omitted a path)

1. Name the entity to create (e.g. Activity Definition, Specimen Definition,
   Service Request).
2. In the FE worktree, find the matching file under `src/types/**/` — usually
   `*Api.ts` next to the domain type. Grep example:
   `rg -n "activity_definition|/facility/\{facilityId\}" src/types --glob '*Api.ts'`.
3. Open that file; use the create route entry. Copy the `path` string
   **verbatim** (e.g. `/api/v1/facility/{facilityId}/activity_definition/`).
4. Resolve path params from setup-notes / fixtures (`facilityId`, …) — never
   drop the facility segment.
5. Prefer body from a known-working `tests/**` helper; else nearby types /
   create form. Do not guess unscoped top-level routes.
6. Ban: inventing `/api/v1/<resource>/` without `{facilityId}`.

## Automated suite / CI is out of scope

Agent QA does **not** plan, run, or score the repository's Playwright E2E
suite or CI checks. That belongs to implement + CI.

- Prefer **omitting** suite/CI items from `qa-report.json` criteria entirely.
- If such an item still appears in the handed `qa-plan.md`, mark it
  `not-exercised` with a clear out-of-scope note — never `pass`.
- Never invent a live `pass` by reading test files or source
  (`pass` + `code-inspection` is rejected by collect; do not attempt it).
- Reading `tests/**` for **seed recipes / helpers** is encouraged; scoring
  suite green as agent-QA pass is not.

## The app is already running

If the repository configured a setup command, it has already installed
dependencies, started services and loaded fixtures — see the Environment
section above and `.agent-hq/setup-notes.md`. **Do not stand anything up
yourself**, and never point the app at a non-localhost API: a real deployment
holds real patient data, and nothing here may touch it. Synthetic fixtures
only.

If the environment is not there — no setup was configured for this repo, or
it left less than you need — **do not fake a pass** and do not spend the run
building one by hand. Capture whatever you can reach, mark the rest
`not-exercised` with a classified blocker, and say plainly in `qa.md` what
was missing.

## Where your files go

**Scratch goes under `.agent-hq/`** — raw MCP recordings, temp pages,
downloaded data, and anything else that is not a declared ledger output. That
directory never reaches the work repo. Anything you leave elsewhere (except
the paths below) lands in the pull request.

Declared ledger outputs under `specs/{ticket}/` (collected; kept out of the
work-repo patch because `writes_code: false`):

- drivers → `specs/{ticket}/qa-drivers/{id}.mjs` (one file per criterion `id`)
- run logs → `specs/{ticket}/qa-logs/{id}.log` (session transcript for that
  criterion)
- videos → `specs/{ticket}/videos/{id}.webm` (basename **must** equal `id`)
- screenshots → `specs/{ticket}/screenshots/<short-slug>.png` (optional unless
  the media policy disables video)
- report → `specs/{ticket}/qa.md` and `specs/{ticket}/qa-report.json`

You write WebM only. Collect may derive a sibling lite `.gif` for the PR
comment embed — do not spend the run producing GIFs yourself.

Do not commit anything.

## Serial, one criterion at a time

There is one MCP browser session; run criteria **strictly one after another**.
Forbidden:

- one recording left running across two or more ACs
- interleaving two criteria's steps inside one recording window
- manually renaming or reassigning finished clips between ids
- falling back to `npx playwright test` over the repo's suite as evidence

Allowed: one `browser_start_video` → steps → `browser_stop_video` window per
criterion, then the next criterion.

### Evidence ledger (collector receipts — same contract as script-based QA)

The collector demands, for every criterion it will accept, the same canonical
receipts whether QA was scripted or MCP-driven. For each live-flow criterion —
including ones that end `not-exercised`:

1. **Log as you go**: append every attempted action for that criterion to
   `specs/{ticket}/qa-logs/{id}.log` — fixture lookup, each MCP browser step
   (URL, control, result), form submission/result, API method/path/status plus
   redacted response/error, auth refresh/re-login status codes, and the final
   verification checkpoint. A transcript excerpt of the MCP tool calls for
   that criterion is exactly right — collect **requires** MCP tool names
   (`browser_start_video`, `browser_navigate`, `browser_click`,
   `browser_snapshot`, …) in this log for every `pass`. A log that only
   mentions `chromium.launch` / `page.goto` / `openAuthedContext` is rejected
   as script-driven live QA. Non-empty for any attempted non-pass.
   Keep secrets and patient data out. Start it **before** seeding; references
   to discarded `.agent-hq/` scratch do **not** count as evidence.
2. **Codify what worked**: after the live session, write the working
   interaction sequence as an executable plain-Node + Playwright script at
   `specs/{ticket}/qa-drivers/{id}.mjs` (`id` from `qa-report.json`) — the
   same navigate/click/fill/assert steps you just drove through MCP, so a
   human (or the script-based `qa` task) can replay the criterion. One file
   per criterion. Write it even when the criterion ended `not-exercised`
   after attempted steps — the attempt is the evidence.
3. **Video**: the `browser_start_video` / `browser_stop_video` window from
   phase 4, moved to exactly `specs/{ticket}/videos/{id}.webm`.

`qa.md` / `qa-report.json` video paths must be that same
`specs/{ticket}/videos/{id}.webm`. Never share one recording across ACs.

## Live-flow evidence (not code inspection)

For each user-facing acceptance criterion, drive the **running application**
through the plan's steps and record the interaction.

This means the real app, at its real route, in a browser signed in with the
session the setup step left you. A reviewer must recognise the product in the
recording; if it could be any web page, it is not evidence.

Respect `video_max_seconds` from the media policy — start the recording just
before the criterion's first step and stop it right after the verification
checkpoint. One clip per criterion is enough when it includes the
interactions the plan marked **Record through**.

Do **not**, under any circumstances:

- build a standalone HTML page, harness, story, or demo and treat that as pass
- mark `pass` because the research map / source code "looks correct"
- reimplement the spec's rules in your own script and verify the reimplementation

Those prove only that you can restate the spec. Code inspection may appear
under a **Code inspection** note or in `## Limits` — it never yields `pass`.

If you cannot reach the real page — after climbing the seed ladder
(fixtures → UI-create → facility-scoped API escape) for missing localhost
entities, a flow you cannot complete, a role you do not have, video capture
fails — that criterion is `not-exercised` or `fail` with a blocker category
from the list below. That is a perfectly good outcome. A substitute render
is not.

Small recovery is allowed (one alternate visible control). Rewriting the
journey from scratch is not a `pass` path.

### Blocker categories

Use exactly one of: `app-not-loading` | `auth-failure` |
`missing-facility-context` | `missing-permission` | `missing-test-data` |
`navigation-mismatch` | `video-failure` | `screenshot-failure` |
`validation-error` | `emulator-limit` | `device-limit` | `no-qa-plan` | `other`

### Honesty rules the engine also enforces

- `pass` ⇒ `evidence_kind: live-flow` + video path exactly
  `specs/{ticket}/videos/{id}.webm` in the ledger (default), plus matching
  `qa-drivers/{id}.mjs` and non-empty `qa-logs/{id}.log`. Each video path
  may back at most one criterion. Stills never required for pass unless video
  is disabled in config.
- Non-live `evidence_kind` (including `code-inspection`) ⇒ never `pass`.
  Collect rejects `pass` + `code-inspection`; do not attempt it.
- Summary cannot claim `all_passed` if any `fail` / `not-exercised`.
- If `browser_start_video` / `browser_stop_video` fails or produces no file →
  `not-exercised` / `fail` with `video-failure`, not a code-inspection `pass`.
- Suite/CI coverage items are not live ACs — omit or `not-exercised`; never
  score them as pass via code inspection.
- `missing-test-data` ⇒ fill `seed_attempt` honestly (`method` + `summary`
  of the UI/API attempts), non-empty `plan_steps_run`, and keep the attempt in
  canonical `qa-drivers/{id}.mjs` + non-empty `qa-logs/{id}.log`. Do not claim
  seed was impossible after only unscoped API calls or with no concrete
  attempt.
- Attempted `fail` / `not-exercised` with non-empty `plan_steps_run` ⇒
  canonical driver + non-empty aggregate log (fixture/UI/API/auth transcript).
- A proven qa-plan API body rejected with 4xx after test-payload retry ⇒
  `validation-error`, not disguised `missing-test-data`.

The full machine-enforced report contract is the **qa-report contract
checklist** injected below — walk it before finishing.

## Write `specs/{ticket}/qa.md`

Group criteria under clear headings. Prefer separate sections:

- `## Live-flow` — criteria you drove in the running app
- `## Code inspection` — notes only; no passes here
- `## Emulator-browser` / `## Real-device` — when those limits apply
- `## Limits` — what you could not exercise, and why

One subsection per acceptance criterion, each with:

- the verdict — `pass`, `fail`, or `not-exercised` (with reason + category)
- what you actually did (plan steps run, briefly)
- the video, linked with a **repo-relative** markdown link whose basename is
  the criterion id — **alone on its own line**, with no `**Evidence**:` /
  `**Video**:` prefix and no wrapping `<details>` (collect owns the collapsed
  preview when a sibling `.gif` exists):
  `[dropdown open — desktop](specs/{ticket}/videos/dropdown.webm)`
- optional screenshot embeds only when stills were taken:
  `![…](specs/{ticket}/screenshots/….png)`

Keep those links repo-relative. The engine rewrites them to ledger URLs when
it posts this file as a PR comment — WebM links with a sibling `.gif` in the
ledger become a **blockquoted** collapsed `<details>` preview labelled
`Video:`; missing GIF degrades to the WebM link alone. Do not wrap, prefix,
or blockquote the links yourself.

Every media path you link must be a file you actually saved.

## Write `specs/{ticket}/qa-report.json`

Required structured twin of `qa.md`. Shape:

Omit `seed_attempt` unless `missing-test-data` (then require `{method, summary}` with method ≠ none).

```json
{
  "criteria": [
    {
      "id": "short-slug",
      "title": "...",
      "verdict": "pass|fail|not-exercised",
      "evidence_kind": "live-flow|code-inspection|emulator-limit|device-limit|unreachable",
      "blocker": null,
      "blocker_category": null,
      "plan_steps_run": ["1", "2"],
      "videos": ["specs/{ticket}/videos/short-slug.webm"],
      "screenshots": []
    }
  ],
  "summary": {
    "all_passed": false,
    "pass": 0,
    "fail": 0,
    "not_exercised": 0
  }
}
```

Collect validates this against the schema and media policy. A dishonest
report fails the run (retry) — it is never posted as a greenwashed PR
comment. **Self-validate before finishing**: re-read the file against the
qa-report contract checklist (exact `not-exercised` spelling, no extra keys,
counts match, every claimed media file exists on disk at the canonical path).

## Decide what runs next (see Control output below)

Always queue `finalize`, forwarding `specs/{ticket}/spec.md`,
`specs/{ticket}/review.md`, and `specs/{ticket}/qa.md`. That holds even when
nothing user-facing changed (write `qa.md` / `qa-report.json` saying so, with
empty media dirs) and when criteria failed — agent-qa reports, it does not
gate. Note any failure prominently at the top of `qa.md` so the human merging
the PR sees it.

Cap the whole pass at 45 minutes. If the install or build eats that budget,
stop, write what you have with `not-exercised` verdicts, and queue finalize —
a partial honest QA is a valid outcome, a timed-out run is not.
