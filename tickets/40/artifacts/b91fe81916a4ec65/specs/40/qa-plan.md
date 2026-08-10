# QA Plan: Custom Links in Sidebar/Navbar

## AC1 — Custom links appear in SidebarFooter from care.config.ts

### Research map

- routes: n/a (configuration-driven, no new routes)
- components: src/components/ui/sidebar/app-sidebar.tsx → SidebarFooter, src/components/ui/sidebar/custom-footer-links.tsx
- i18n labels: Link names use existing i18n system (any key can be used)
- auth/role: tests/.auth/user.json (any authenticated user)
- permissions / facility-scoped: no (custom links are configuration-based)
- fixtures needed: load-fixtures provides authenticated user and facility

### Prerequisites

- Backend running on port 9000
- Production build exists (`npm run build`)
- Authenticated user (fixture user available)

### Data setup

- Prefer fixtures: load-fixtures provides authenticated users and facilities
- Configuration setup required: Add `REACT_CUSTOM_LINKS` environment variable
  ```bash
  # Add to .env.local or export before running the app:
  export REACT_CUSTOM_LINKS='[{"name":"support","url":"https://support.example.com","isExternal":true,"openInNewTab":true},{"name":"documentation","url":"/docs","isExternal":false,"openInNewTab":false}]'
  ```
- Restart the development server after setting the environment variable

### Steps

1. **Action:** Set REACT_CUSTOM_LINKS environment variable with two test links (one external, one internal)
   **Expect:** Environment variable is set
   **Record through:** no

2. **Action:** Start the app with `npm run dev` and navigate to http://localhost:4000
   **Expect:** App loads successfully
   **Record through:** no

3. **Action:** Log in using credentials: username `admin`, password `admin`
   **Expect:** Successfully logged in and redirected to dashboard
   **Record through:** no

4. **Action:** Navigate to any facility by clicking on a facility from the dashboard or going to `/facility/{facilityId}/overview`
   **Expect:** Facility sidebar is visible on the left
   **Record through:** yes

5. **Action:** Scroll to the bottom of the sidebar
   **Expect:** Two custom links appear above the user profile dropdown: "support" with an external link icon and "documentation" with an internal link icon
   **Record through:** yes
   **Still after:** yes

6. **Action:** Click the "support" link (external link with openInNewTab: true)
   **Expect:** Link opens in a new browser tab pointing to https://support.example.com
   **Record through:** yes

7. **Action:** Click the "documentation" link (internal link with openInNewTab: false)
   **Expect:** Navigation happens in the current tab to `/docs` route (may show 404 as route doesn't exist in test setup, which is expected)
   **Record through:** yes

### Success looks like

- Custom links render in SidebarFooter above NavUser
- External link shows ExternalLink icon, internal link shows Link2 icon
- External link with openInNewTab opens in new tab
- Internal link without openInNewTab navigates in current tab

## AC2 — Internal route link displays internal icon

### Research map

- components: src/components/ui/sidebar/custom-footer-links.tsx
- icons: lucide-react Link2 icon for internal routes

### Prerequisites

- Same as AC1 (authenticated user, custom links configured)

### Data setup

- Same as AC1 configuration with at least one internal link (isExternal: false)

### Steps

1. **Action:** With custom links configured from AC1, observe the "documentation" link in the sidebar footer
   **Expect:** Link displays with Link2 icon (internal link icon from lucide-react)
   **Record through:** yes
   **Still after:** yes

### Success looks like

- Internal link (isExternal: false) displays Link2 icon
- Icon is visually distinct from external link icon

## AC3 — External URL link displays external icon

### Research map

- components: src/components/ui/sidebar/custom-footer-links.tsx
- icons: lucide-react ExternalLink icon for external URLs

### Prerequisites

- Same as AC1 (authenticated user, custom links configured)

### Data setup

- Same as AC1 configuration with at least one external link (isExternal: true)

### Steps

1. **Action:** With custom links configured from AC1, observe the "support" link in the sidebar footer
   **Expect:** Link displays with ExternalLink icon (external link icon from lucide-react)
   **Record through:** yes
   **Still after:** yes

### Success looks like

- External link (isExternal: true) displays ExternalLink icon
- Icon clearly indicates the link goes to an external URL

## AC4 — Link with openInNewTab: true opens in new tab

### Research map

- components: src/components/ui/sidebar/custom-footer-links.tsx
- behavior: Uses HTML target="_blank" and rel="noopener noreferrer" for security

### Prerequisites

- Same as AC1 (authenticated user, custom links configured)

### Data setup

- Same as AC1 configuration with external link having openInNewTab: true

### Steps

1. **Action:** Click the "support" link (configured with openInNewTab: true)
   **Expect:** Link opens in a new browser tab, original tab stays on current page
   **Record through:** yes

2. **Action:** Verify the new tab opened to https://support.example.com
   **Expect:** New tab shows the external URL (may show connection error if domain doesn't exist, which is expected for test)
   **Record through:** yes

### Success looks like

- Link with openInNewTab: true opens in new tab
- Original tab remains on the same page
- External links use rel="noopener noreferrer" for security

## AC5 — Link with openInNewTab: false opens in current tab

### Research map

- components: src/components/ui/sidebar/custom-footer-links.tsx
- behavior: Uses standard navigation without target="_blank"

### Prerequisites

- Same as AC1 (authenticated user, custom links configured)

### Data setup

- Same as AC1 configuration with internal link having openInNewTab: false

### Steps

1. **Action:** From facility overview page, click the "documentation" link (configured with openInNewTab: false)
   **Expect:** Navigation occurs in the current tab to `/docs` route
   **Record through:** yes

2. **Action:** Verify no new tab was opened
   **Expect:** Current tab navigated, no new tabs opened
   **Record through:** yes

### Success looks like

- Link with openInNewTab: false navigates in current tab
- No new browser tabs are created

## AC6 — Plugin-provided custom links appear in sidebar footer

### Research map

- components: src/components/ui/sidebar/app-sidebar.tsx
- plugin system: src/pluginTypes.ts → PluginManifest.customFooterLinks
- hooks: src/hooks/useCareApps.tsx

### Prerequisites

- Backend running on port 9000
- Authenticated user

### Data setup

- Plugin configuration: This requires a plugin to be configured via REACT_ENABLED_APPS environment variable
- Note: As mentioned in the spec, we cannot test this in QA agent plan as plugins aren't available in the test environment
- Manual testing only: A plugin would need to provide customFooterLinks in its manifest

### Steps

**Note:** This criterion requires a plugin with customFooterLinks in its manifest. Since plugins are not available in the QA test environment, this will be verified through code review and manual testing in environments where plugins are configured.

1. **Code verification:** Confirm AppSidebar component merges plugin customFooterLinks with config links
   **Expect:** Code review shows useCareApps is called and customFooterLinks are extracted from plugin manifests
   **Record through:** no

### Success looks like

- Code shows plugin customFooterLinks are collected via useCareApps hook
- Plugin links are merged with care.config.ts links
- Implementation allows plugins to inject custom footer links

## AC7 — Custom links filter by sidebar context (facility/patient/admin)

### Research map

- components: src/components/ui/sidebar/custom-footer-links.tsx
- types: src/types/customLink.ts → showIn field, src/components/ui/sidebar/app-sidebar.tsx → SidebarFor enum

### Prerequisites

- Backend running on port 9000
- Authenticated user with facility access
- Patient login enabled (or use admin for facility/admin context testing)

### Data setup

- Configuration with context-filtered links:
  ```bash
  export REACT_CUSTOM_LINKS='[{"name":"facility_only","url":"/facility-help","isExternal":false,"openInNewTab":false,"showIn":["facility"]},{"name":"admin_only","url":"/admin-help","isExternal":false,"openInNewTab":false,"showIn":["admin"]},{"name":"everywhere","url":"/general-help","isExternal":false,"openInNewTab":false}]'
  ```

### Steps

1. **Action:** Set REACT_CUSTOM_LINKS with context-filtered links (facility_only, admin_only, everywhere)
   **Expect:** Environment variable is set
   **Record through:** no

2. **Action:** Restart app and log in, navigate to facility sidebar (e.g., `/facility/{facilityId}/overview`)
   **Expect:** Facility sidebar is active
   **Record through:** yes

3. **Action:** Scroll to sidebar footer and observe custom links
   **Expect:** "facility_only" and "everywhere" links are visible, "admin_only" link is NOT visible
   **Record through:** yes
   **Still after:** yes

4. **Action:** Navigate to admin sidebar by going to `/admin` or clicking admin link in navigation
   **Expect:** Admin sidebar is active (sidebarFor = admin)
   **Record through:** yes

5. **Action:** Scroll to sidebar footer and observe custom links
   **Expect:** "admin_only" and "everywhere" links are visible, "facility_only" link is NOT visible
   **Record through:** yes
   **Still after:** yes

### Success looks like

- Links with showIn: ["facility"] only appear in facility sidebar
- Links with showIn: ["admin"] only appear in admin sidebar
- Links without showIn or with empty array appear in all sidebars
- Filtering is correctly applied based on sidebarFor context

## Test plan / notes

### Additional verification (not live QA)

- Playwright E2E tests should be added to cover:
  - Custom link rendering from care.config.ts
  - Icon selection (external vs internal)
  - Link behavior (new tab vs current tab)
  - Context filtering (showIn property)
  - Plugin integration (when test plugins are available)

### CI expectations

- `npm run lint` passes
- `npm run build` completes successfully
- TypeScript compilation succeeds
- No console errors related to custom links

### Known limitations

- Plugin custom footer links cannot be tested in QA agent environment as plugins are not available
- Plugin testing requires manual verification in environments with configured plugins
- External URLs in test examples may show connection errors (expected for non-existent domains)
