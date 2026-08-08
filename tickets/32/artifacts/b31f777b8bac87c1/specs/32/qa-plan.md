# QA Plan: Navbar Documentation and NABH Links

## AC1 — Documentation link appears when REACT_NAV_DOCS_LINK is set

### Research map

- routes: N/A (environment configuration, visible across all authenticated routes)
- components: `src/components/ui/sidebar/facility/facility-nav.tsx`, `src/components/ui/sidebar/admin-nav.tsx`, `src/components/ui/sidebar/nav-user.tsx`
- i18n labels: "Documentation"
- auth/role: tests/.auth/user.json (any authenticated user)
- permissions: N/A (visible to all authenticated users)
- fixtures needed: seeded facility from load-fixtures

### Prerequisites

- Backend running on port 9000
- Frontend running with `.env.local` containing `REACT_NAV_DOCS_LINK=https://care.ohc.network/docs`
- User logged in (any role)
- Facility context active

### Data setup

- Prefer fixtures: load-fixtures provides facility with ID accessible via `getFacilityId()` from tests/support/
- No additional data needed; feature is purely UI-based on environment configuration

### Steps

1. **Action:** Set `REACT_NAV_DOCS_LINK=https://care.ohc.network/docs` in `.env.local` and restart dev server
   **Expect:** Dev server starts successfully
   **Record through:** no

2. **Action:** Log in at http://localhost:4000 using credentials from tests/.auth/user.json (username: `admin`, password: `admin`)
   **Expect:** Login succeeds, redirected to facility list or dashboard
   **Record through:** no

3. **Action:** Navigate to a facility page (e.g., `/facility/{facilityId}/overview`)
   **Expect:** Facility sidebar loads with navigation links
   **Record through:** no

4. **Action:** Scroll through facility sidebar navigation links
   **Expect:** "Documentation" link appears in the sidebar with a book icon, after core facility links and before plugin links (if any)
   **Record through:** yes

5. **Action:** Navigate to `/admin/questionnaire` (admin navigation)
   **Expect:** Admin sidebar loads with navigation links
   **Record through:** no

6. **Action:** Scroll through admin sidebar navigation links
   **Expect:** "Documentation" link appears in the admin sidebar with a book icon, after "Apps" link and before plugin links (if any)
   **Record through:** yes

7. **Action:** Click on user avatar/name in the sidebar to open user dropdown menu
   **Expect:** Dropdown menu opens with Profile, logout, and other options
   **Record through:** no

8. **Action:** Scroll through user dropdown menu items
   **Expect:** "Documentation" link appears in the dropdown menu with a book icon, after profile and plugin items
   **Record through:** yes

### Success looks like

- "Documentation" link visible in facility sidebar, admin sidebar, and user dropdown
- Link displays book icon consistently
- Link positioning: after core links, before plugin links

## AC2 — NABH Certification link appears when REACT_NAV_NABH_LINK is set

### Research map

- routes: N/A (environment configuration, visible across all authenticated routes)
- components: `src/components/ui/sidebar/facility/facility-nav.tsx`, `src/components/ui/sidebar/admin-nav.tsx`, `src/components/ui/sidebar/nav-user.tsx`
- i18n labels: "NABH Certification"
- auth/role: tests/.auth/user.json (any authenticated user)
- permissions: N/A (visible to all authenticated users)
- fixtures needed: seeded facility from load-fixtures

### Prerequisites

- Backend running on port 9000
- Frontend running with `.env.local` containing `REACT_NAV_NABH_LINK=https://www.nabh.co/standards`
- User logged in (any role)
- Facility context active

### Data setup

- Prefer fixtures: load-fixtures provides facility with ID accessible via `getFacilityId()` from tests/support/
- No additional data needed; feature is purely UI-based on environment configuration

### Steps

1. **Action:** Set `REACT_NAV_NABH_LINK=https://www.nabh.co/standards` in `.env.local` and restart dev server
   **Expect:** Dev server starts successfully
   **Record through:** no

2. **Action:** Log in at http://localhost:4000 using credentials from tests/.auth/user.json (username: `admin`, password: `admin`)
   **Expect:** Login succeeds, redirected to facility list or dashboard
   **Record through:** no

3. **Action:** Navigate to a facility page (e.g., `/facility/{facilityId}/overview`)
   **Expect:** Facility sidebar loads with navigation links
   **Record through:** no

4. **Action:** Scroll through facility sidebar navigation links
   **Expect:** "NABH Certification" link appears in the sidebar with an award icon, after "Documentation" link (if configured) and before plugin links (if any)
   **Record through:** yes

5. **Action:** Navigate to `/admin/questionnaire` (admin navigation)
   **Expect:** Admin sidebar loads with navigation links
   **Record through:** no

6. **Action:** Scroll through admin sidebar navigation links
   **Expect:** "NABH Certification" link appears in the admin sidebar with an award icon, after "Documentation" link (if configured) and before plugin links (if any)
   **Record through:** yes

7. **Action:** Click on user avatar/name in the sidebar to open user dropdown menu
   **Expect:** Dropdown menu opens with Profile, logout, and other options
   **Record through:** no

8. **Action:** Scroll through user dropdown menu items
   **Expect:** "NABH Certification" link appears in the dropdown menu with an award icon, after "Documentation" link (if configured)
   **Record through:** yes

### Success looks like

- "NABH Certification" link visible in facility sidebar, admin sidebar, and user dropdown
- Link displays award icon consistently
- Link positioning: after "Documentation" (if present), before plugin links

## AC3 — Env-configured links open in new tab

### Research map

- routes: N/A (link behavior test)
- components: `src/components/ui/sidebar/nav-main.tsx` (external link handling), facility/admin navs, user dropdown
- i18n labels: N/A
- auth/role: tests/.auth/user.json (any authenticated user)
- permissions: N/A
- fixtures needed: seeded facility from load-fixtures

### Prerequisites

- Backend running on port 9000
- Frontend running with both `REACT_NAV_DOCS_LINK=https://care.ohc.network/docs` and `REACT_NAV_NABH_LINK=https://www.nabh.co/standards` set in `.env.local`
- User logged in (any role)
- Facility context active

### Data setup

- Prefer fixtures: load-fixtures provides facility with ID accessible via `getFacilityId()` from tests/support/
- No additional data needed; feature is purely UI-based

### Steps

1. **Action:** Set both `REACT_NAV_DOCS_LINK=https://care.ohc.network/docs` and `REACT_NAV_NABH_LINK=https://www.nabh.co/standards` in `.env.local` and restart dev server
   **Expect:** Dev server starts successfully
   **Record through:** no

2. **Action:** Log in and navigate to facility page `/facility/{facilityId}/overview`
   **Expect:** Facility sidebar loads with both "Documentation" and "NABH Certification" links visible
   **Record through:** no

3. **Action:** Right-click on "Documentation" link in facility sidebar and inspect the link element
   **Expect:** Link has `target="_blank"` and `rel="noopener noreferrer"` attributes
   **Record through:** yes

4. **Action:** Click on "Documentation" link in facility sidebar
   **Expect:** Link opens in a new browser tab/window, current tab remains on facility page
   **Record through:** yes

5. **Action:** Close the newly opened tab and return to facility page
   **Expect:** Facility page still active and unchanged
   **Record through:** no

6. **Action:** Click on "NABH Certification" link in facility sidebar
   **Expect:** Link opens in a new browser tab/window, current tab remains on facility page
   **Record through:** yes

7. **Action:** Navigate to `/admin/questionnaire` and click "Documentation" link in admin sidebar
   **Expect:** Link opens in new tab, admin page remains active in current tab
   **Record through:** yes

8. **Action:** Open user dropdown menu and click "Documentation" link
   **Expect:** Link opens in new tab, current page remains active
   **Record through:** yes

9. **Action:** Open user dropdown menu and click "NABH Certification" link
   **Expect:** Link opens in new tab, current page remains active
   **Record through:** yes

### Success looks like

- All environment-configured links open in new tabs
- Current page/context remains active after clicking links
- Links have proper security attributes (`rel="noopener noreferrer"`)
- No navigation occurs in the current tab

## AC4 — Plugin navItems integrate with facility navigation (already supported)

### Research map

- routes: Plugin routes defined in plugin manifest
- components: `src/components/ui/sidebar/facility/facility-nav.tsx` (lines 217-219, 206-209)
- i18n labels: Plugin-provided names
- auth/role: tests/.auth/user.json
- permissions: Facility-scoped
- fixtures needed: Care plugin with navItems defined in manifest

### Prerequisites

- Backend running on port 9000
- Frontend running with a plugin that declares `navItems` in its manifest
- NOTE: Per spec, current QA environment does not load plugins

### Data setup

- N/A — Plugin testing deferred per QA note in spec

### Steps

**DEFERRED:** Plugin integration for `navItems` is already implemented (see `facility-nav.tsx` lines 217-219 extracting `pluginNavItems` from `useCareApps()`, and lines 206-209 integrating them into the links array). The implementation uses the existing plugin pattern (`useCareApps()` hook) and no new code was needed beyond what already existed.

Live QA testing will be performed when the QA environment has plugin support configured.

### Success looks like

- Plugin-declared nav items appear in facility sidebar after env-configured links
- Plugin nav items are prefixed with facility base URL

## AC5 — Plugin adminNavItems integrate with admin navigation (already supported)

### Research map

- routes: Plugin admin routes defined in plugin manifest
- components: `src/components/ui/sidebar/admin-nav.tsx` (lines 84-87, 75)
- i18n labels: Plugin-provided names
- auth/role: tests/.auth/user.json (admin role)
- permissions: Admin-level
- fixtures needed: Care plugin with adminNavItems defined in manifest

### Prerequisites

- Backend running on port 9000
- Frontend running with a plugin that declares `adminNavItems` in its manifest
- NOTE: Per spec, current QA environment does not load plugins

### Data setup

- N/A — Plugin testing deferred per QA note in spec

### Steps

**DEFERRED:** Plugin integration for `adminNavItems` is already implemented (see `admin-nav.tsx` lines 84-87 extracting `pluginNavItems` from `useCareApps()`, and line 75 integrating them into the links array). The implementation uses the existing plugin pattern and no new code was needed beyond what already existed.

Live QA testing will be performed when the QA environment has plugin support configured.

### Success looks like

- Plugin-declared admin nav items appear in admin sidebar after env-configured links
- Plugin admin nav items use their declared URLs directly (no prefix)

## AC6 — Plugin userNavItems integrate with user dropdown (already supported)

### Research map

- routes: Plugin user routes defined in plugin manifest
- components: `src/components/ui/sidebar/nav-user.tsx` (lines 44-46, 118-130)
- i18n labels: Plugin-provided names
- auth/role: tests/.auth/user.json
- permissions: User-level
- fixtures needed: Care plugin with userNavItems defined in manifest

### Prerequisites

- Backend running on port 9000
- Frontend running with a plugin that declares `userNavItems` in its manifest
- NOTE: Per spec, current QA environment does not load plugins

### Data setup

- N/A — Plugin testing deferred per QA note in spec

### Steps

**DEFERRED:** Plugin integration for `userNavItems` is already implemented (see `nav-user.tsx` lines 44-46 extracting `pluginNavItems` from `useCareApps()`, and lines 118-130 rendering them in the dropdown menu). The implementation uses the existing plugin pattern and no new code was needed beyond what already existed.

Live QA testing will be performed when the QA environment has plugin support configured.

### Success looks like

- Plugin-declared user nav items appear in user dropdown menu after profile link and before env-configured links
- Plugin user nav items are prefixed with user profile URL path

## AC7 — No env vars configured means no extra links

### Research map

- routes: N/A (environment configuration test)
- components: All navigation components
- i18n labels: N/A
- auth/role: tests/.auth/user.json
- permissions: N/A
- fixtures needed: seeded facility from load-fixtures

### Prerequisites

- Backend running on port 9000
- Frontend running with NO `REACT_NAV_DOCS_LINK` or `REACT_NAV_NABH_LINK` environment variables set
- User logged in (any role)
- Facility context active

### Data setup

- Prefer fixtures: load-fixtures provides facility with ID accessible via `getFacilityId()` from tests/support/
- No additional data needed

### Steps

1. **Action:** Ensure `.env.local` does NOT contain `REACT_NAV_DOCS_LINK` or `REACT_NAV_NABH_LINK`, restart dev server
   **Expect:** Dev server starts successfully
   **Record through:** no

2. **Action:** Log in and navigate to facility page `/facility/{facilityId}/overview`
   **Expect:** Facility sidebar loads with standard facility navigation links
   **Record through:** no

3. **Action:** Scroll through entire facility sidebar
   **Expect:** No "Documentation" or "NABH Certification" links appear; only standard facility links (Overview, Appointments, Queues, Patients, Services, Resource, Users, Billing, Settings) are visible
   **Record through:** yes

4. **Action:** Navigate to `/admin/questionnaire`
   **Expect:** Admin sidebar loads with standard admin navigation links
   **Record through:** no

5. **Action:** Scroll through entire admin sidebar
   **Expect:** No "Documentation" or "NABH Certification" links appear; only standard admin links (Questionnaire, Valuesets, Patient Identifier Config, Tag Config, RBAC, Organizations, Apps) are visible
   **Record through:** yes

6. **Action:** Open user dropdown menu
   **Expect:** Dropdown menu opens with standard options
   **Record through:** no

7. **Action:** Scroll through user dropdown menu
   **Expect:** No "Documentation" or "NABH Certification" links appear; only Profile and Logout options are visible (plus any plugin items if plugins are loaded)
   **Record through:** yes

### Success looks like

- No extra navigation links appear when environment variables are not configured
- Existing behavior preserved: standard navigation items only
- Application functions normally without the optional environment configuration

## Test plan / notes

### Playwright E2E Coverage

- **Environment variable testing:** E2E tests should verify behavior with and without env vars set. Consider using Playwright's `test.use()` to inject environment config.
- **External link behavior:** Add test to verify `target="_blank"` and `rel="noopener noreferrer"` attributes on env-configured links.
- **Link visibility:** Tests should confirm links appear in correct locations (facility sidebar, admin sidebar, user dropdown).
- **Click behavior:** Verify clicking env-configured links does not navigate current page/tab.

### CI Expectations

- `npm run lint` must pass with no new errors
- `npm run build` must complete successfully
- TypeScript compilation must pass (ignoring pre-existing errors unrelated to this feature)
- No new console errors or warnings in development mode

### Plugin Testing Note

Plugin integration testing (AC4, AC5, AC6) is deferred per the spec's QA note. The code implementing plugin support was already present and unchanged; this ticket only added environment-configured links. Full plugin testing will be conducted in a future iteration with proper plugin infrastructure.
