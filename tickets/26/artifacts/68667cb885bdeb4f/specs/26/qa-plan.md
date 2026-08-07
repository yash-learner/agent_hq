# QA Plan: Add support for inserting links in the left navbar

## AC1 — Environment-configured links in facility and admin sidebars

### Research map

- routes: All facility routes start with `/facility/:facilityId/`, admin routes start with `/admin/`
- components: `src/components/ui/sidebar/facility/facility-nav.tsx`, `src/components/ui/sidebar/admin-nav.tsx`
- config: `care.config.ts` parses `REACT_NAV_LINKS` and exposes via `careConfig.navLinks`
- i18n labels: N/A (link names provided via env config)
- auth/role: tests/.auth/user.json
- permissions / facility-scoped: No special permissions required to view nav links
- fixtures needed: Default facility from load-fixtures (Dummy Facility)

### Prerequisites

- Backend running on port 9000
- Frontend running on port 4000
- Logged in as admin user

### Data setup

- No additional data setup required. Testing uses environment variables only.
- Default fixture facility available via `load-fixtures`

### Steps

#### Test 1: Valid JSON with multiple links

1. **Action:** Stop the dev server if running. Set environment variable:

   ```bash
   export REACT_NAV_LINKS='[{"name":"Documentation","url":"https://care.ohc.network/docs"},{"name":"NABH Certification","url":"https://nabh.example.com"}]'
   npm run dev
   ```

   Navigate to `http://localhost:4000/` and login as admin (username: `admin`, password: `admin`)

   **Expect:** Dev server starts without errors

   **Record through:** yes

2. **Action:** Navigate to any facility (e.g., `/facility/{facilityId}/overview`)

   **Expect:** Sidebar shows "Documentation" and "NABH Certification" links after the core nav items (Overview, Appointments, etc.) and before plugin items

   **Record through:** yes

3. **Action:** Click on "Documentation" link

   **Expect:** Link opens https://care.ohc.network/docs in a new tab (target="_blank")

   **Record through:** yes

4. **Action:** Navigate to admin panel (`/admin`)

   **Expect:** Sidebar shows the same custom links after core admin nav items (Questionnaire, Valuesets, etc.)

   **Record through:** yes

### Success looks like

- Custom links visible in both facility and admin sidebars
- Links positioned after core items but before plugin items
- External links open in new tabs
- No console errors or warnings

## AC2 — Plugin navItems continue to work

### Research map

- routes: Plugin routes injected via `usePluginRoutes()`
- components: `src/hooks/useCareApps.tsx`, `src/pluginTypes.ts`
- Testing: Verify existing plugin nav items still render correctly

### Prerequisites

- Same as AC1
- Plugin configured via `REACT_ENABLED_APPS` (if available in test environment)

### Data setup

- If no plugins are enabled in test environment, this AC is verified by code review showing plugins are merged after env links

### Steps

1. **Action:** Check if any plugins are configured

   ```bash
   echo $REACT_ENABLED_APPS
   ```

   **Expect:** If plugins exist, they should be listed; if not, skip to step 3

   **Record through:** yes

2. **Action:** Navigate to facility sidebar with plugin items present

   **Expect:** Plugin nav items appear after environment-configured links

   **Record through:** yes

3. **Action:** Review code to confirm merge order:
   - Open `src/components/ui/sidebar/facility/facility-nav.tsx`
   - Verify `generateFacilityLinks` returns: `[...links, ...processedEnvLinks, ...pluginLinks]`

   **Expect:** Order confirmed: core → env → plugin

   **Record through:** yes

### Success looks like

- Plugin items still render when plugins are enabled
- Merge order is correct: core items, env links, plugin items

## AC3 — Links display with configured properties (name, url, icon)

### Research map

- components: `src/components/ui/sidebar/nav-main.tsx` handles NavigationLink rendering
- icons: External link icon from `lucide-react` used as default

### Prerequisites

- Same as AC1

### Data setup

- Use JSON with custom icon (if testing icon support) or rely on default ExternalLink icon

### Steps

1. **Action:** Set environment with link using default icon:

   ```bash
   export REACT_NAV_LINKS='[{"name":"Help Center","url":"https://help.example.com"}]'
   npm run dev
   ```

   Navigate to facility sidebar

   **Expect:** "Help Center" link displays with default ExternalLink icon

   **Record through:** yes

2. **Action:** Hover over the link in collapsed sidebar state

   **Expect:** Tooltip shows "Help Center"

   **Record through:** yes

3. **Action:** Click the link

   **Expect:** Opens https://help.example.com in new tab

   **Record through:** yes

### Success looks like

- Link name displays correctly
- External links have ExternalLink icon
- Links open in new tabs with target="_blank" and rel="noopener noreferrer"

## AC4 — Environment links appear after core items but before plugin items

### Research map

- components: Order defined in `generateFacilityLinks` and `generateAdminLinks`
- Testing: Visual verification in sidebar

### Prerequisites

- Same as AC1

### Data setup

- Same as AC1

### Steps

1. **Action:** With `REACT_NAV_LINKS` configured, open facility sidebar and scroll through nav items

   **Expect:** Order is:
   - Core items (Overview, Appointments, Queues, Patients, Services, Resource, Users, Billing, Settings)
   - Environment links (Documentation, NABH Certification)
   - Plugin items (if any)

   **Record through:** yes

2. **Action:** Open admin sidebar and verify order

   **Expect:** Order is:
   - Core items (Questionnaire, Valuesets, Patient Identifier Config, Tag Config, RBAC, Organizations, Apps)
   - Environment links (Documentation, NABH Certification)
   - Plugin items (if any)

   **Record through:** yes

### Success looks like

- Consistent ordering across facility and admin sidebars
- Environment links positioned correctly

## AC5 — Invalid JSON or missing fields logged with warnings

### Research map

- config: `care.config.ts` handles JSON parsing and validation
- Testing: Check browser console for warnings

### Prerequisites

- Same as AC1

### Data setup

- Test various invalid configurations

### Steps

#### Test 1: Invalid JSON

1. **Action:** Stop dev server, set invalid JSON:

   ```bash
   export REACT_NAV_LINKS='[{"name":"Docs","url":"https://example.com"'
   npm run dev
   ```

   **Expect:** Dev server starts successfully

   **Record through:** yes

2. **Action:** Open browser console and check for warnings

   **Expect:** Console shows: "REACT_NAV_LINKS: Invalid JSON format. Navigation links will not be rendered."

   **Record through:** yes

3. **Action:** Open facility sidebar

   **Expect:** No custom links displayed, only core nav items

   **Record through:** yes

#### Test 2: Missing required fields

1. **Action:** Stop dev server, set JSON with missing 'url':

   ```bash
   export REACT_NAV_LINKS='[{"name":"Docs"}]'
   npm run dev
   ```

   **Expect:** Dev server starts successfully

   **Record through:** yes

2. **Action:** Open browser console

   **Expect:** Console warning: "REACT_NAV_LINKS: Each link must have 'name' and 'url' properties. Skipping invalid link:"

   **Record through:** yes

3. **Action:** Check facility sidebar

   **Expect:** No custom links displayed

   **Record through:** yes

#### Test 3: Non-array value

1. **Action:** Stop dev server, set non-array JSON:

   ```bash
   export REACT_NAV_LINKS='{"name":"Docs","url":"https://example.com"}'
   npm run dev
   ```

   **Expect:** Dev server starts successfully

   **Record through:** yes

2. **Action:** Open browser console

   **Expect:** Console warning: "REACT_NAV_LINKS must be a JSON array. Navigation links will not be rendered."

   **Record through:** yes

3. **Action:** Check facility sidebar

   **Expect:** No custom links displayed

   **Record through:** yes

### Success looks like

- App remains stable with invalid configuration
- Appropriate console warnings logged
- Navbar renders without custom links when configuration is invalid

## Test plan / notes

### Playwright E2E Coverage

The implementation should have E2E test coverage for:

1. Rendering custom nav links in facility and admin sidebars
2. Verifying external links open in new tabs
3. Testing link ordering (core → env → plugin)
4. Edge cases: empty array, undefined env var

Test file location: `tests/sidebar/navLinks.spec.ts`

### CI Requirements

- All existing CI checks must pass
- Build completes successfully (verified in implementation)
- No new lint errors introduced
- TypeScript compilation successful

### Manual Testing Notes

- Test with both collapsed and expanded sidebar states
- Verify on mobile viewport (sidebar drawer behavior)
- Test with different user roles (admin, nurse, facility admin)
- Confirm behavior when no `REACT_NAV_LINKS` is set (defaults to empty array)

### Known Limitations

- Icons in nav links are not configurable via JSON (React components can't be serialized)
- Default ExternalLink icon used for all environment-configured links
- Links do not support nested children (only top-level links)
