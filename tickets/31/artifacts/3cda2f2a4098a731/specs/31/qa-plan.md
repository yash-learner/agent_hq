# QA Plan: Left-nav hyperlinks via env config + plugin hooks

## AC1 — Env-configured documentation link appears in left nav

### Research map

- routes: `/` (dashboard), `/facility/:facilityId/overview` (facility sidebar)
- components: `src/components/ui/sidebar/facility/facility-nav.tsx`, `src/components/ui/sidebar/nav-main.tsx`
- config: `care.config.ts` parses `REACT_NAV_LINKS` and `REACT_NABH_LINK`
- i18n labels: Link labels from env config (free text, no i18n)
- auth/role: Any authenticated user with facility access
- permissions: None required (nav display)
- fixtures needed: Existing facility from load-fixtures (e.g., Dummy Facility)

### Prerequisites

- Application must be built with env var set: `REACT_NAV_LINKS='[{"name":"Documentation","url":"https://care.ohc.network/","external":true}]'`
- User logged in (use credentials from CLAUDE.md: `care-doctor` / `Ohcn@123`)
- Facility context active (navigate to `/facility/{facilityId}/overview`)

### Data setup

- Prefer fixtures: load-fixtures provides facilities; no additional data required for this criterion
- The env var must be set before build/start for Vite to pick it up:
  ```bash
  export REACT_NAV_LINKS='[{"name":"Documentation","url":"https://care.ohc.network/","external":true}]'
  npm run build
  npm run preview
  ```
- Or for dev mode:
  ```bash
  echo 'REACT_NAV_LINKS=[{"name":"Documentation","url":"https://care.ohc.network/","external":true}]' >> .env.local
  npm run dev
  ```
- No additional UI or API setup required; fixtures already provide facilities

### Steps

1. **Action:** Open browser to `http://localhost:4000` (dev) or `http://localhost:4173` (preview)
   **Expect:** Login page loads
   **Record through:** yes
   **Still after:** screenshot of login page (if enabled)

2. **Action:** Log in with username `care-doctor` and password `Ohcn@123`
   **Expect:** Dashboard or facility selection page loads
   **Record through:** yes

3. **Action:** Click on a facility (e.g., "Dummy Facility") to enter facility context
   **Expect:** Facility overview page loads at `/facility/{facilityId}/overview`
   **Record through:** yes

4. **Action:** Open left sidebar (click hamburger menu if collapsed on mobile/small screen)
   **Expect:** Sidebar opens showing facility nav items (Overview, Appointments, Patients, Services, etc.)
   **Record through:** yes

5. **Action:** Scroll to the bottom of the left sidebar nav items
   **Expect:** "Documentation" link appears below existing core and plugin nav items
   **Record through:** yes
   **Still after:** screenshot showing "Documentation" link in sidebar

6. **Action:** Click on the "Documentation" link
   **Expect:** New browser tab opens with URL `https://care.ohc.network/` (external link)
   **Record through:** yes

### Success looks like

- "Documentation" link visible in facility sidebar nav below core items
- Clicking opens `https://care.ohc.network/` in new tab with correct security attributes
- Existing nav items (Overview, Patients, Settings, etc.) still functional

---

## AC2 — Optional NABH link appears when configured, absent when not

### Research map

- routes: Same as AC1
- components: Same as AC1
- config: `care.config.ts` parses `REACT_NABH_LINK` (optional, null if not set)
- auth/role: Any authenticated user with facility access
- fixtures needed: Existing facility from load-fixtures

### Prerequisites

- Two test runs required: one with NABH link configured, one without
- User logged in and in facility context (same as AC1)

### Data setup

- Test run 1 (NABH configured):
  ```bash
  export REACT_NABH_LINK='{"name":"NABH Certification","url":"https://example.com/nabh-cert.pdf","external":true}'
  npm run build && npm run preview
  ```
- Test run 2 (NABH not configured): Remove or comment out `REACT_NABH_LINK`, rebuild
  ```bash
  unset REACT_NABH_LINK
  npm run build && npm run preview
  ```

### Steps (Run 1: NABH configured)

1. **Action:** Follow steps 1-4 from AC1 to reach facility sidebar
   **Expect:** Sidebar opens
   **Record through:** yes

2. **Action:** Scroll to bottom of sidebar nav items
   **Expect:** "NABH Certification" link appears alongside or after "Documentation" link (if also configured)
   **Record through:** yes
   **Still after:** screenshot showing "NABH Certification" in sidebar

3. **Action:** Click "NABH Certification" link
   **Expect:** New tab opens with `https://example.com/nabh-cert.pdf`
   **Record through:** yes

### Steps (Run 2: NABH not configured)

1. **Action:** Rebuild app without `REACT_NABH_LINK`, follow steps 1-4 from AC1
   **Expect:** Sidebar opens
   **Record through:** yes

2. **Action:** Scroll through sidebar nav items
   **Expect:** "NABH Certification" link does NOT appear; sidebar still renders normally
   **Record through:** yes
   **Still after:** screenshot showing no NABH link (only standard nav items or Documentation if configured)

### Success looks like

- With `REACT_NABH_LINK` set: NABH link visible and opens correct URL in new tab
- Without `REACT_NABH_LINK`: No NABH link; no crash; sidebar functions normally

---

## AC3 — Multiple env links render without breaking core nav

### Research map

- routes: Same as AC1
- components: Same as AC1
- config: `REACT_NAV_LINKS` array with multiple entries, plus `REACT_NABH_LINK`
- auth/role: Any authenticated user with facility access
- fixtures needed: Existing facility from load-fixtures

### Prerequisites

- Env configured with multiple links:
  ```bash
  export REACT_NAV_LINKS='[{"name":"Documentation","url":"https://care.ohc.network/","external":true},{"name":"Support Portal","url":"https://github.com/ohcnetwork/care/issues","external":true}]'
  export REACT_NABH_LINK='{"name":"NABH Cert","url":"https://example.com/cert.pdf","external":true}'
  npm run build && npm run preview
  ```
- User logged in and in facility context

### Data setup

- Same as AC1 but with multiple env links configured (see Prerequisites above)

### Steps

1. **Action:** Follow steps 1-4 from AC1 to reach facility sidebar
   **Expect:** Sidebar opens
   **Record through:** yes

2. **Action:** Scroll through sidebar nav items from top to bottom
   **Expect:** Core facility items appear first (Overview, Appointments, Patients, Services, Users, Billing, Settings)
   **Record through:** yes

3. **Action:** Continue scrolling to bottom of nav
   **Expect:** Env-configured links appear below core/plugin items: "Documentation", "Support Portal", "NABH Cert"
   **Record through:** yes
   **Still after:** screenshot showing all three custom links at bottom of sidebar

4. **Action:** Click "Overview" link (core nav item)
   **Expect:** Navigates to facility overview page (internal routing via raviger)
   **Record through:** yes

5. **Action:** Click "Patients" link (core nav item)
   **Expect:** Navigates to patients search page
   **Record through:** yes

6. **Action:** Click "Support Portal" link (env-configured external)
   **Expect:** Opens `https://github.com/ohcnetwork/care/issues` in new tab
   **Record through:** yes

### Success looks like

- Multiple env links (Documentation, Support Portal, NABH Cert) all visible
- Core nav items (Overview, Patients, Encounters, Settings) still navigate correctly
- External links open in new tabs; internal links use raviger routing

---

## AC4 — External links open with correct security attributes

### Research map

- routes: Any facility nav context
- components: `src/components/ui/sidebar/nav-main.tsx` `NavLink` component
- Security: `external={true}` → `<a target="_blank" rel="noopener noreferrer">`
- auth/role: Any authenticated user
- fixtures needed: Existing facility from load-fixtures

### Prerequisites

- Env configured with external link (reuse AC1 setup)
- User logged in and in facility context

### Data setup

- Same as AC1

### Steps

1. **Action:** Follow steps 1-5 from AC1 to view "Documentation" link in sidebar
   **Expect:** Link visible
   **Record through:** yes

2. **Action:** Right-click "Documentation" link and inspect element (browser DevTools)
   **Expect:** Element is `<a href="https://care.ohc.network/" target="_blank" rel="noopener noreferrer">`
   **Record through:** yes
   **Still after:** screenshot of DevTools showing `target="_blank"` and `rel="noopener noreferrer"`

3. **Action:** Click "Documentation" link
   **Expect:** Link opens in new tab (not replacing current page)
   **Record through:** yes

4. **Action:** Verify current care_fe tab remains on facility overview page (not navigated away)
   **Expect:** Original tab still active on `/facility/{facilityId}/overview`
   **Record through:** yes

### Success looks like

- External link HTML includes `target="_blank"` and `rel="noopener noreferrer"`
- Clicking opens new tab without losing current page context
- No opener/referrer leakage (security best practice followed)

---

## AC5 — Empty/invalid env config: no crash, sidebar renders normally

### Research map

- routes: Same as AC1
- components: Same as AC1
- config: `care.config.ts` validation logic catches parse errors, returns empty array/null
- auth/role: Any authenticated user
- fixtures needed: Existing facility from load-fixtures

### Prerequisites

- Test with invalid JSON in env vars:
  ```bash
  export REACT_NAV_LINKS='invalid-json-here'
  export REACT_NABH_LINK='also-invalid'
  npm run build && npm run preview
  ```
- Check browser console for warnings (expected)

### Data setup

- No additional data; just invalid env config

### Steps

1. **Action:** Set invalid env vars (see Prerequisites), build and start app
   **Expect:** Build completes without error
   **Record through:** yes

2. **Action:** Open browser console (F12), check for warnings
   **Expect:** Console shows warnings like "Failed to parse REACT_NAV_LINKS: ..." and "Failed to parse REACT_NABH_LINK: ..."
   **Record through:** yes
   **Still after:** screenshot of console warnings

3. **Action:** Log in and navigate to facility context (steps 1-4 from AC1)
   **Expect:** App loads normally; sidebar opens without crash
   **Record through:** yes

4. **Action:** Scroll through sidebar nav items
   **Expect:** Core nav items (Overview, Patients, Settings, etc.) all present and functional; no env links appear (invalid config filtered out)
   **Record through:** yes
   **Still after:** screenshot showing normal sidebar (no env links, no crash)

5. **Action:** Click "Overview" and "Patients" links
   **Expect:** Navigation works correctly (internal routing unaffected by invalid env config)
   **Record through:** yes

### Success looks like

- Invalid env config logged as warnings in console (not crash)
- Sidebar renders with core nav items intact
- No empty placeholders or broken links
- App remains functional

---

## AC6 — Plugin support for external links (type-level proof; deferred live test)

### Research map

- routes: Any facility nav context
- components: `src/components/ui/sidebar/facility/facility-nav.tsx` (merges `pluginNavItems`)
- types: `src/pluginTypes.ts` `PluginManifest.navItems` array, `NavigationLink` interface with `external?: boolean`
- auth/role: Any authenticated user
- fixtures needed: None (plugins unavailable in QA env)

### Prerequisites

- **This criterion is NOT exercised live in the current QA environment** because care plugins are not loaded.
- Type-level proof: The `NavigationLink` interface now includes `external?: boolean` field, and the plugin manifest type already supports `navItems` arrays.
- Plugin wiring exists: `FacilityNav` merges `pluginNavItems` from `useCareApps()` hook.

### Data setup

- Not applicable (no live plugin test in this QA run)

### Steps

**NOT EXERCISED** — Live plugin test deferred to environment with plugin support.

**Type/code path proof:**

1. **Action (code review):** Open `src/pluginTypes.ts` line 206
   **Expect:** `PluginManifest` interface includes `navItems?: NavigationLink[]`
   **Record through:** no (code inspection, not live QA)

2. **Action (code review):** Open `src/components/ui/sidebar/nav-main.tsx` line 47
   **Expect:** `NavigationLink` interface includes `external?: boolean` field
   **Record through:** no

3. **Action (code review):** Open `src/components/ui/sidebar/facility/facility-nav.tsx` line 217
   **Expect:** `pluginNavItems` merged into links array; external field passed to `NavLink` component
   **Record through:** no

### Success looks like

**Type-level proof complete:**

- `NavigationLink.external` field exists in interface
- Plugin manifests can declare `navItems` with external links
- `FacilityNav` merges plugin links and passes `external` prop to rendering logic
- `NavLink` component handles `external={true}` correctly (proven in AC1-AC4)

**Live plugin test status:**

- **`not-exercised`** due to environment limitation (no plugins loaded in QA env)
- **Blocker category:** `environment-limitation` — plugins unavailable in agent-hq execute environment
- **Retest later:** When plugin context is available, verify a plugin manifest with `navItems: [{ name: "Plugin Docs", url: "https://plugin.example.com", external: true }]` renders in facility sidebar and opens in new tab

---

## AC7 — i18n keys for new UI chrome (if any)

### Research map

- i18n: `public/locale/en.json`
- components: No new UI chrome strings added (operator-configured link labels remain as-is)

### Prerequisites

- None (no new i18n keys required for this ticket)

### Data setup

- Not applicable

### Steps

**NOT APPLICABLE** — This ticket does not introduce new UI chrome strings requiring i18n.

- Env-configured link labels (`name` field in JSON) are free text supplied by operators.
- No section headers or system-generated labels added.

### Success looks like

- No new i18n keys needed; existing nav infrastructure handles operator-supplied labels

---

## Test plan / notes

### Playwright E2E coverage (not live QA criteria)

- Add E2E test for env-configured links appearing in facility nav
- Test external link behavior (new tab, correct `rel` attributes)
- Test invalid env config (no crash, warnings logged)
- Plugin external link support: type-level test acceptable (live plugin E2E deferred)

### CI expectations

- CI lint/format must pass
- No new linter errors introduced
- Build completes successfully with env vars set

### Manual verification checklist (beyond live QA)

- Admin nav context: env links appear in admin sidebar
- User dropdown menu: env links appear in user menu (FacilityNavUser component)
- Mobile/collapsed sidebar: popover menus handle external links correctly
- Accessibility: external links announce "opens in new tab" to screen readers (future enhancement if not already present)

---

## Environment setup notes for QA

### Setting env vars for QA run

**For preview (production build):**

```bash
cd /workspaces/agent_hq/_target/69a14c52eeca9510

# AC1: Single doc link
export REACT_NAV_LINKS='[{"name":"Documentation","url":"https://care.ohc.network/","external":true}]'
npm run build
npm run preview
# Open http://localhost:4173

# AC2: NABH optional (run 1 - with NABH)
export REACT_NAV_LINKS='[{"name":"Documentation","url":"https://care.ohc.network/","external":true}]'
export REACT_NABH_LINK='{"name":"NABH Certification","url":"https://example.com/nabh-cert.pdf","external":true}'
npm run build
npm run preview

# AC2: NABH optional (run 2 - without NABH)
unset REACT_NABH_LINK
npm run build
npm run preview

# AC3: Multiple links
export REACT_NAV_LINKS='[{"name":"Documentation","url":"https://care.ohc.network/","external":true},{"name":"Support Portal","url":"https://github.com/ohcnetwork/care/issues","external":true}]'
export REACT_NABH_LINK='{"name":"NABH Cert","url":"https://example.com/cert.pdf","external":true}'
npm run build
npm run preview

# AC5: Invalid config
export REACT_NAV_LINKS='invalid-json'
export REACT_NABH_LINK='also-invalid'
npm run build
npm run preview
```

**For dev mode:**

```bash
# Edit .env.local file
echo 'REACT_NAV_LINKS=[{"name":"Documentation","url":"https://care.ohc.network/","external":true}]' >> .env.local
npm run dev
# Open http://localhost:4000
```

### Login credentials (from CLAUDE.md)

| Role   | Username      | Password   |
| ------ | ------------- | ---------- |
| Doctor | `care-doctor` | `Ohcn@123` |
| Admin  | `care-admin`  | `Ohcn@123` |
| Nurse  | `care-nurse`  | `Ohcn@123` |

### Facility fixtures

- load-fixtures provides "Dummy Facility" and others
- Use any facility with ID from fixtures (e.g., facility ID can be extracted from URL after navigating to a facility)

---

## Summary of live vs deferred criteria

**Live now (exercised in QA):**

- AC1: Env-configured doc link appears and opens correctly ✅
- AC2: NABH link optional (present when configured, absent when not) ✅
- AC3: Multiple env links render without breaking core nav ✅
- AC4: External links use correct security attributes ✅
- AC5: Invalid env config does not crash app ✅
- AC7: i18n (no new keys required) ✅

**Deferred (not exercised live):**

- AC6: Plugin external link support (`not-exercised` — environment limitation; plugins unavailable in agent-hq QA env; retest later with plugin context)
