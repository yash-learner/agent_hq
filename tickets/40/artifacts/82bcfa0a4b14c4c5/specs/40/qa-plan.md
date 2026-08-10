# QA Plan: Custom Links in Sidebar/Navbar

## AC1 — Custom links from care.config.ts appear in SidebarFooter

### Research map

- routes: All facility routes (e.g., `/facility/:facilityId/overview`)
- components: `src/components/ui/sidebar/app-sidebar.tsx`, `src/components/ui/sidebar/custom-footer-links.tsx`
- config: `care.config.ts` - `customLinks` array from `REACT_CUSTOM_LINKS` environment variable
- auth/role: tests/.auth/user.json
- permissions: No specific permissions required
- facility-scoped: Yes (test in facility context)
- fixtures needed: Seeded facility from load-fixtures

### Prerequisites

- Backend running on port 9000
- Production build created (`npm run build`)
- Browser dev tools open to inspect environment configuration

### Data setup

- Prefer fixtures: load-fixtures provides a default facility (ID retrievable via `getFacilityId()`)
- Configuration: Test requires environment variable configuration before build
  - Set `REACT_CUSTOM_LINKS='[{"name":"Support Portal","url":"https://support.example.com","isExternal":true,"openInNewTab":true}]'` in `.env.local`
  - Run `npm run build` to apply config
  - Run `npm run preview` to test production build with custom links
- Verification: Custom links are read from `care.config.ts` at build time

### Steps

1. **Action:** Configure custom link in environment and build
   - Create `.env.local` with `REACT_CUSTOM_LINKS='[{"name":"Support Portal","url":"https://support.example.com","isExternal":true,"openInNewTab":true}]'`
   - Run `npm run build` (takes ~2 minutes)
   - Run `npm run preview` to start preview server
     **Expect:** Build succeeds without errors
     **Record through:** no (build step)

2. **Action:** Navigate to `http://localhost:4173/` and login with `admin` / `admin`
   **Expect:** Login succeeds, dashboard loads
   **Record through:** yes

3. **Action:** Click on any facility from the facilities list to enter facility context
   **Expect:** Facility sidebar appears on the left with facility switcher at top
   **Record through:** yes

4. **Action:** Scroll to bottom of sidebar to view the SidebarFooter section (below user profile/NavUser component)
   **Expect:** "Support Portal" link appears in footer below the user profile section with external link icon
   **Record through:** yes

### Success looks like

- Custom link from care.config.ts renders in sidebar footer
- Link appears below NavUser component, not above it
- Link displays external link icon (ExternalLink from lucide-react)

## AC2 — Internal route links display internal link icon

### Research map

- routes: All facility routes
- components: `src/components/ui/sidebar/custom-footer-links.tsx` - renders Link2 icon for internal routes
- i18n labels: Link name from configuration (no translation needed for this test)
- auth/role: tests/.auth/user.json
- permissions: No specific permissions required
- facility-scoped: Yes
- fixtures needed: Seeded facility from load-fixtures

### Prerequisites

- Backend running on port 9000
- Production build with custom internal link configuration

### Data setup

- Prefer fixtures: load-fixtures provides a default facility
- Configuration: Set internal route link in environment
  - Set `REACT_CUSTOM_LINKS='[{"name":"Dashboard","url":"/","isExternal":false,"openInNewTab":false}]'` in `.env.local`
  - Run `npm run build`
  - Run `npm run preview`

### Steps

1. **Action:** Configure internal link in environment and build
   - Update `.env.local` with `REACT_CUSTOM_LINKS='[{"name":"Dashboard","url":"/","isExternal":false,"openInNewTab":false}]'`
   - Run `npm run build`
   - Run `npm run preview`
     **Expect:** Build succeeds
     **Record through:** no (build step)

2. **Action:** Navigate to `http://localhost:4173/` and login
   **Expect:** Login succeeds
   **Record through:** yes

3. **Action:** Enter facility context by clicking on a facility
   **Expect:** Facility sidebar appears
   **Record through:** yes

4. **Action:** Scroll to sidebar footer and locate "Dashboard" link
   **Expect:** Link displays with Link2 icon (internal route icon), not ExternalLink icon
   **Record through:** yes

### Success looks like

- Internal route link renders with Link2 icon
- Icon is distinct from external link icon

## AC3 — External URL links display external link icon

### Research map

- Same as AC1
- Icon: ExternalLink from lucide-react

### Prerequisites

- Same as AC1

### Data setup

- Same as AC1 (external link configuration already tests this)

### Steps

1. **Action:** Use configuration from AC1 with external URL
   **Expect:** Link displays with ExternalLink icon
   **Record through:** yes (covered in AC1 step 4)

### Success looks like

- External URL link renders with ExternalLink icon
- Icon is distinct from internal link icon (Link2)

## AC4 — Links with openInNewTab: true open in new tab

### Research map

- routes: Any route
- components: `src/components/ui/sidebar/custom-footer-links.tsx` - sets `target="_blank"` and `rel="noopener noreferrer"`
- auth/role: tests/.auth/user.json
- facility-scoped: Yes
- fixtures needed: Seeded facility

### Prerequisites

- Backend running on port 9000
- Production build with external link configured with `openInNewTab: true`

### Data setup

- Configuration: External link with new tab behavior
  - Set `REACT_CUSTOM_LINKS='[{"name":"Documentation","url":"https://docs.example.com","isExternal":true,"openInNewTab":true}]'` in `.env.local`
  - Run `npm run build`
  - Run `npm run preview`

### Steps

1. **Action:** Configure external link with openInNewTab: true
   - Update `.env.local` with config above
   - Build and start preview
     **Expect:** Build succeeds
     **Record through:** no (build step)

2. **Action:** Login and navigate to facility sidebar
   **Expect:** Sidebar appears with custom link
   **Record through:** yes

3. **Action:** Right-click on "Documentation" link in sidebar footer and inspect the link element
   **Expect:** Element has `target="_blank"` and `rel="noopener noreferrer"` attributes
   **Record through:** yes

4. **Action:** Click on "Documentation" link
   **Expect:** Link opens in a new browser tab (current tab remains on facility page)
   **Record through:** yes

### Success looks like

- Link opens in new tab when clicked
- Original tab remains on current page
- Link element has correct security attributes (`rel="noopener noreferrer"`)

## AC5 — Links with openInNewTab: false open in current tab

### Research map

- routes: Internal routes
- components: `src/components/ui/sidebar/custom-footer-links.tsx` - uses raviger Link component without target attribute for internal routes
- auth/role: tests/.auth/user.json
- facility-scoped: Yes
- fixtures needed: Seeded facility

### Prerequisites

- Backend running on port 9000
- Production build with internal link configured with `openInNewTab: false`

### Data setup

- Configuration: Internal link without new tab behavior
  - Set `REACT_CUSTOM_LINKS='[{"name":"Home","url":"/","isExternal":false,"openInNewTab":false}]'` in `.env.local`
  - Run `npm run build`
  - Run `npm run preview`

### Steps

1. **Action:** Configure internal link with openInNewTab: false
   - Update `.env.local` with config above
   - Build and start preview
     **Expect:** Build succeeds
     **Record through:** no (build step)

2. **Action:** Login and navigate to facility context
   **Expect:** Facility sidebar appears
   **Record through:** yes

3. **Action:** Click on "Home" link in sidebar footer
   **Expect:** Navigation occurs in current tab, user goes to dashboard page
   **Record through:** yes

4. **Action:** Verify browser tab count remains same (no new tab opened)
   **Expect:** Only one tab remains open
   **Record through:** yes

### Success looks like

- Link navigates in current tab
- No new tab opens
- Navigation completes successfully to target route

## AC6 — Plugin custom footer links appear in sidebar

### Research map

- routes: All routes with sidebar
- components: `src/components/ui/sidebar/app-sidebar.tsx` - merges plugin links via `useCareApps()` hook
- pluginTypes: `src/pluginTypes.ts` - PluginManifest.customFooterLinks property
- auth/role: tests/.auth/user.json
- permissions: No specific permissions
- facility-scoped: Yes
- fixtures needed: Seeded facility

### Prerequisites

- Backend running on port 9000
- Plugin system configured (via `REACT_ENABLED_APPS` environment variable)

### Data setup

- **Note:** This criterion cannot be fully tested in QA as of now because we cannot configure and test a real plugin in the local environment without deploying an actual plugin application. The implementation is in place (`PluginManifest.customFooterLinks` property and merging logic in `app-sidebar.tsx`), but live verification requires a deployed plugin.
- Configuration verification:
  - Check `src/pluginTypes.ts` line 211: `customFooterLinks?: CustomLink[];` exists in PluginManifest
  - Check `src/components/ui/sidebar/app-sidebar.tsx` lines 116-127: Plugin links are merged with config links
- Manual code verification: Implementation is complete but not testable without deployed plugin

### Steps

1. **Action:** Review plugin manifest type definition
   - Open `src/pluginTypes.ts`
   - Locate PluginManifest interface (around line 203-222)
     **Expect:** `customFooterLinks?: CustomLink[];` property exists in PluginManifest interface
     **Record through:** yes (screenshot of code)

2. **Action:** Review plugin link merging logic
   - Open `src/components/ui/sidebar/app-sidebar.tsx`
   - Locate lines 116-127 where pluginCustomFooterLinks are extracted and merged
     **Expect:** Code shows `useCareApps()` hook retrieves plugin links and merges with `careConfig.customLinks`
     **Record through:** yes (screenshot of code)

### Success looks like

- PluginManifest type includes customFooterLinks property
- App sidebar merges plugin links with config links
- Implementation ready for plugin integration (live testing deferred until plugin deployment available)

## AC7 — Links filtered by showIn visibility config

### Research map

- routes: Facility routes (`/facility/:facilityId/...`), admin routes (`/admin/...`), patient routes
- components: `src/components/ui/sidebar/custom-footer-links.tsx` - filters links by `showIn` property matching current `sidebarFor` context
- sidebar contexts: `SidebarFor.FACILITY`, `SidebarFor.PATIENT`, `SidebarFor.ADMIN` enum in `app-sidebar.tsx`
- auth/role: tests/.auth/user.json
- permissions: Admin permission to access admin pages
- facility-scoped: Test across multiple sidebar contexts
- fixtures needed: Seeded facility

### Prerequisites

- Backend running on port 9000
- Production build with multiple custom links configured for different contexts

### Data setup

- Configuration: Multiple links with different showIn values
  - Set `REACT_CUSTOM_LINKS='[{"name":"Facility Link","url":"https://facility.example.com","isExternal":true,"openInNewTab":true,"showIn":["facility"]},{"name":"Admin Link","url":"https://admin.example.com","isExternal":true,"openInNewTab":true,"showIn":["admin"]},{"name":"Global Link","url":"https://global.example.com","isExternal":true,"openInNewTab":true}]'` in `.env.local`
  - Run `npm run build`
  - Run `npm run preview`

### Steps

1. **Action:** Configure multiple links with different showIn contexts
   - Update `.env.local` with config above (3 links: facility-only, admin-only, global with no showIn)
   - Build and start preview
     **Expect:** Build succeeds
     **Record through:** no (build step)

2. **Action:** Login as admin user and navigate to a facility page (e.g., `/facility/{facilityId}/overview`)
   **Expect:** Facility sidebar appears with facility context
   **Record through:** yes

3. **Action:** Scroll to sidebar footer and count visible custom links
   **Expect:** Two links visible: "Facility Link" and "Global Link" (Admin Link is hidden because sidebar context is facility)
   **Record through:** yes

4. **Action:** Navigate to admin section by clicking on the user menu > Admin or go to `/admin`
   **Expect:** Admin sidebar appears
   **Record through:** yes

5. **Action:** Scroll to admin sidebar footer and count visible custom links
   **Expect:** Two links visible: "Admin Link" and "Global Link" (Facility Link is hidden because sidebar context is admin)
   **Record through:** yes

6. **Action:** Verify "Global Link" appears in both contexts
   **Expect:** "Global Link" is visible in both facility and admin sidebars because it has no showIn restriction
   **Record through:** yes

### Success looks like

- Links with showIn filter only appear in matching sidebar contexts
- Links without showIn (or empty showIn array) appear in all contexts
- Filtering works correctly for facility, admin, and global visibility

## Test plan / notes

### Playwright E2E Testing

- Add E2E test in `tests/facility/custom-sidebar-links.spec.ts` to verify:
  - Custom links render in sidebar footer
  - Links display correct icons (internal vs external)
  - Link ordering and positioning below NavUser
  - Visibility filtering by sidebar context
- Use `@playwright/test` fixtures and authenticated storage state (`tests/.auth/user.json`)
- Test against production build (`npm run build` + `npm run preview`)

### CI Expectations

- Build must succeed with custom links configuration
- Lint must pass (no TypeScript errors in custom-footer-links.tsx or type definitions)
- All existing E2E tests must continue to pass (custom links should not break existing functionality)
- New E2E test for custom links should pass in CI pipeline

### Configuration Testing

- Test various REACT_CUSTOM_LINKS configurations:
  - Empty array (no links)
  - Single link (internal and external)
  - Multiple links with mixed visibility
  - Invalid configurations (should not break build)
- Verify environment variable parsing in care.config.ts

### Plugin Integration Testing (Future)

- Once plugin deployment is available, test:
  - Plugin-provided links merge with config links
  - Plugin links respect showIn visibility filters
  - Multiple plugins can provide custom links simultaneously
  - Plugin links render in correct order relative to config links
