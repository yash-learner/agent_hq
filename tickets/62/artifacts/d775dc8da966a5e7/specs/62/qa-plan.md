# QA Plan: Custom Sidebar Links

## AC1 — Custom links appear in sidebar footer via environment config

### Research map

- routes: All routes (applies across all sidebar contexts)
- components: `src/components/ui/sidebar/app-sidebar.tsx`, `src/components/ui/sidebar/custom-links.tsx`
- i18n labels: N/A (labels come from environment config)
- auth/role: tests/setup/auth.setup.ts (admin user)
- permissions: N/A (visible to all authenticated users)
- facility-scoped: No (applies to all sidebar contexts)
- fixtures needed: Authenticated user, facility context

### Prerequisites

- User is logged in (any authenticated user)
- Environment variable `REACT_CUSTOM_SIDEBAR_LINKS` is configured with at least one link

### Data setup

- Configuration method: Set environment variable in `.env.local`:
  ```
  REACT_CUSTOM_SIDEBAR_LINKS=[{"label":"Test Link","url":"https://example.com","type":"external","openInNewTab":true}]
  ```
- Restart the development server after setting the environment variable for changes to take effect
- Provenance: Environment variable parsed in `care.config.ts:426-438`

### Steps

1. **Action:** Start the development server with the custom sidebar links environment variable configured
   **Expect:** Server starts successfully without errors
   **Record through:** no

2. **Action:** Navigate to `/` and click "Log in as staff" → enter credentials (username: `admin`, password: `admin`) → click Login
   **Expect:** Successfully logged in and redirected to homepage
   **Record through:** no

3. **Action:** Navigate to any facility page (e.g., `/facility/{facilityId}/overview` where facilityId from fixture setup)
   **Expect:** Page loads showing the facility sidebar
   **Record through:** yes

4. **Action:** Scroll to the bottom of the sidebar and locate the sidebar footer section
   **Expect:** The custom link "Test Link" appears in the sidebar footer above the user avatar (NavUser component)
   **Record through:** yes

5. **Action:** Verify the link is visible with both icon and label (when sidebar is expanded)
   **Expect:** The external link icon and "Test Link" label are both visible
   **Record through:** yes

### Success looks like

- Custom link appears in the sidebar footer
- Link is positioned above the NavUser component
- External link icon (ExternalLink from lucide-react) is visible
- Link label "Test Link" is visible when sidebar is expanded

---

## AC2 — Links respect openInNewTab configuration

### Research map

- routes: All routes
- components: `src/components/ui/sidebar/custom-links.tsx:43-57`
- i18n labels: N/A
- auth/role: tests/setup/auth.setup.ts (admin user)
- permissions: N/A
- facility-scoped: No
- fixtures needed: Authenticated user

### Prerequisites

- User is logged in
- Two environment-configured links: one with `openInNewTab: true`, one with `openInNewTab: false`

### Data setup

- Configuration method: Set environment variable in `.env.local`:
  ```
  REACT_CUSTOM_SIDEBAR_LINKS=[
    {"label":"External New Tab","url":"https://example.com","type":"external","openInNewTab":true},
    {"label":"External Same Tab","url":"https://example.com/same","type":"external","openInNewTab":false},
    {"label":"Internal New Tab","url":"/","type":"internal","openInNewTab":true},
    {"label":"Internal Same Tab","url":"/","type":"internal","openInNewTab":false}
  ]
  ```
- Restart the development server after configuration

### Steps

1. **Action:** Navigate to any facility page and scroll to sidebar footer
   **Expect:** All four configured links are visible
   **Record through:** yes

2. **Action:** Right-click on "External New Tab" link
   **Expect:** Browser context menu shows "Open link in new tab" option (indicates it will open in new tab when clicked)
   **Record through:** yes

3. **Action:** Click "Internal Same Tab" link
   **Expect:** Navigation occurs in the current tab (URL changes to `/`)
   **Record through:** yes

4. **Action:** Navigate back to facility page, then click "Internal New Tab" link
   **Expect:** New browser tab opens with the internal route
   **Record through:** yes

### Success looks like

- Links with `openInNewTab: true` open in a new browser tab
- Links with `openInNewTab: false` navigate in the current tab
- Both external and internal links respect the openInNewTab configuration

---

## AC3 — External and internal links display correct icons

### Research map

- routes: All routes
- components: `src/components/ui/sidebar/custom-links.tsx:68-72`
- icons: ExternalLink, Link2 from lucide-react
- auth/role: tests/setup/auth.setup.ts (admin user)
- permissions: N/A
- facility-scoped: No
- fixtures needed: Authenticated user

### Prerequisites

- User is logged in
- Environment-configured links with both `type: "external"` and `type: "internal"`

### Data setup

- Configuration method: Set environment variable in `.env.local`:
  ```
  REACT_CUSTOM_SIDEBAR_LINKS=[
    {"label":"External Link","url":"https://example.com","type":"external","openInNewTab":true},
    {"label":"Internal Link","url":"/","type":"internal","openInNewTab":false}
  ]
  ```
- Restart the development server after configuration

### Steps

1. **Action:** Navigate to any facility page and scroll to sidebar footer
   **Expect:** Two custom links are visible
   **Record through:** yes

2. **Action:** Inspect the "External Link" icon using browser DevTools
   **Expect:** Icon uses the ExternalLink component from lucide-react (class name contains "lucide-external-link" or svg path data matches ExternalLink icon)
   **Record through:** yes

3. **Action:** Inspect the "Internal Link" icon using browser DevTools
   **Expect:** Icon uses the Link2 component from lucide-react (class name contains "lucide-link-2" or svg path data matches Link2 icon)
   **Record through:** yes

### Success looks like

- External links display the ExternalLink icon (arrow pointing out of box)
- Internal links display the Link2 icon (chain link symbol)
- Icons are clearly distinguishable from each other

---

## AC4 — Links filter by sidebarContext

### Research map

- routes:
  - Facility context: `/facility/{facilityId}/overview`
  - Admin context: `/admin/users`
  - Organization context: `/organization/{orgId}`
  - Patient context: N/A (requires patient login flow - not testing in this plan)
- components:
  - `src/components/ui/sidebar/app-sidebar.tsx:101-121` (context determination)
  - `src/components/ui/sidebar/custom-links.tsx:32-37` (filtering logic)
- auth/role: tests/setup/auth.setup.ts (admin user with organization membership)
- permissions: N/A
- facility-scoped: Partially (applies to specific contexts)
- fixtures needed: Authenticated user with facility and organization access

### Prerequisites

- User is logged in with both facility and organization access
- Multiple links configured with different `contexts` arrays

### Data setup

- Configuration method: Set environment variable in `.env.local`:
  ```
  REACT_CUSTOM_SIDEBAR_LINKS=[
    {"label":"Facility Only","url":"https://example.com/facility","type":"external","openInNewTab":true,"contexts":["facility"]},
    {"label":"Admin Only","url":"https://example.com/admin","type":"external","openInNewTab":true,"contexts":["admin"]},
    {"label":"Org Only","url":"https://example.com/org","type":"external","openInNewTab":true,"contexts":["organization"]},
    {"label":"All Contexts","url":"https://example.com/all","type":"external","openInNewTab":true}
  ]
  ```
- Note: Link with no `contexts` property or empty array is visible in all contexts
- Restart the development server after configuration

### Steps

1. **Action:** Navigate to facility page `/facility/{facilityId}/overview` and scroll to sidebar footer
   **Expect:** "Facility Only" and "All Contexts" links are visible; "Admin Only" and "Org Only" are not visible
   **Record through:** yes

2. **Action:** Navigate to admin page `/admin/users` and scroll to sidebar footer
   **Expect:** "Admin Only" and "All Contexts" links are visible; "Facility Only" and "Org Only" are not visible
   **Record through:** yes

3. **Action:** Navigate to organization page (click organization from user menu or navigate to `/organization/{orgId}`) and scroll to sidebar footer
   **Expect:** "Org Only" and "All Contexts" links are visible; "Facility Only" and "Admin Only" are not visible
   **Record through:** yes

### Success looks like

- Links with `contexts: ["facility"]` only appear in facility sidebar
- Links with `contexts: ["admin"]` only appear in admin sidebar
- Links with `contexts: ["organization"]` only appear in organization sidebar
- Links with no contexts property appear in all sidebars
- Context filtering works correctly across all sidebar types

---

## AC5 — Plugin sidebar links merge with environment links

### Research map

- routes: All routes
- components:
  - `src/components/ui/sidebar/custom-links.tsx:26-30` (plugin link merging)
  - `src/hooks/useCareApps.ts` (plugin loading)
- type definitions: `src/pluginTypes.ts:210` (PluginManifest.sidebarLinks)
- auth/role: tests/setup/auth.setup.ts
- permissions: N/A
- facility-scoped: No
- fixtures needed: N/A (no plugin infrastructure in test environment)

### Prerequisites

- This acceptance criterion cannot be tested in the current QA environment because:
  - Plugin infrastructure requires external plugin applications configured via `REACT_ENABLED_APPS`
  - No test plugins are available in the fixture/test data
  - Plugin federation requires separate micro-frontend builds

### Data setup

N/A - Structural verification only

### Steps

**Note:** This criterion validates the implementation structure is correct, not live functionality.

1. **Action:** Review implementation in `src/components/ui/sidebar/custom-links.tsx:26-30`
   **Expect:** Code correctly merges plugin links: `const pluginLinks = careApps.flatMap((app) => (!app.isLoading && app.sidebarLinks) || []);` and `const allLinks: SidebarLink[] = [...envLinks, ...pluginLinks];`
   **Record through:** no

2. **Action:** Review type definition in `src/pluginTypes.ts:210`
   **Expect:** PluginManifest interface includes `sidebarLinks?: import("@careConfig").SidebarLink[];` property
   **Record through:** no

3. **Action:** Verify environment links work correctly (covered in AC1-AC4)
   **Expect:** Environment-configured links function correctly, demonstrating the rendering pipeline is working
   **Record through:** no

### Success looks like

- **Structural verification complete:** Plugin sidebar links are properly typed in PluginManifest interface
- **Merging logic implemented:** Custom links component correctly merges plugin links with environment links
- **Rendering order maintained:** Environment links appear first, then plugin links (implementation shows correct array concatenation)
- **Note:** Live plugin testing requires production environment with actual plugin apps configured

---

## AC6 — Links maintain consistent ordering

### Research map

- routes: All routes
- components: `src/components/ui/sidebar/custom-links.tsx:30` (link ordering)
- auth/role: tests/setup/auth.setup.ts
- permissions: N/A
- facility-scoped: No
- fixtures needed: Authenticated user

### Prerequisites

- User is logged in
- Multiple links configured via environment variable (plugin links cannot be tested per AC5 note)

### Data setup

- Configuration method: Set environment variable in `.env.local`:
  ```
  REACT_CUSTOM_SIDEBAR_LINKS=[
    {"label":"First Link","url":"https://example.com/1","type":"external","openInNewTab":true},
    {"label":"Second Link","url":"https://example.com/2","type":"external","openInNewTab":true},
    {"label":"Third Link","url":"https://example.com/3","type":"external","openInNewTab":true}
  ]
  ```
- Restart the development server after configuration

### Steps

1. **Action:** Navigate to any facility page and scroll to sidebar footer
   **Expect:** Three custom links are visible in the sidebar footer
   **Record through:** yes

2. **Action:** Verify the order of links from top to bottom
   **Expect:** Links appear in the order they were configured: "First Link", "Second Link", "Third Link" (above NavUser component)
   **Record through:** yes

3. **Action:** Collapse the sidebar by clicking the collapse button
   **Expect:** Links remain in the same order, showing only icons
   **Record through:** yes

4. **Action:** Expand the sidebar again
   **Expect:** Links still maintain the same order with both icons and labels visible
   **Record through:** yes

### Success looks like

- Environment-configured links appear in the order they are defined in the configuration array
- Link order is consistent between collapsed and expanded sidebar states
- All links appear above the NavUser component in the footer

---

## AC7 — Links adapt to collapsed/expanded sidebar states

### Research map

- routes: All routes
- components:
  - `src/components/ui/sidebar/custom-links.tsx:21,66,73` (sidebar state handling)
  - `src/components/ui/sidebar/sidebar.tsx` (useSidebar hook provides open state)
- auth/role: tests/setup/auth.setup.ts
- permissions: N/A
- facility-scoped: No
- fixtures needed: Authenticated user

### Prerequisites

- User is logged in
- At least one custom link configured

### Data setup

- Configuration method: Set environment variable in `.env.local`:
  ```
  REACT_CUSTOM_SIDEBAR_LINKS=[
    {"label":"Test Custom Link","url":"https://example.com","type":"external","openInNewTab":true}
  ]
  ```
- Restart the development server after configuration

### Steps

1. **Action:** Navigate to any facility page with sidebar expanded (default state)
   **Expect:** Sidebar is expanded showing full navigation menu
   **Record through:** yes

2. **Action:** Scroll to sidebar footer and locate the custom link
   **Expect:** Custom link displays both the external link icon AND the label "Test Custom Link"
   **Record through:** yes

3. **Action:** Click the sidebar collapse button (usually in header or footer)
   **Expect:** Sidebar collapses to icon-only mode
   **Record through:** yes

4. **Action:** Scroll to sidebar footer and locate the custom link
   **Expect:** Custom link displays only the icon (no label text visible); hovering shows tooltip with "Test Custom Link"
   **Record through:** yes

5. **Action:** Click the sidebar expand button to re-expand the sidebar
   **Expect:** Sidebar expands back to full width
   **Record through:** yes

6. **Action:** Verify the custom link in footer
   **Expect:** Custom link again displays both icon and label "Test Custom Link"
   **Record through:** yes

### Success looks like

- When sidebar is expanded: custom links show both icon and label
- When sidebar is collapsed: custom links show only icon with tooltip on hover
- Transition between states is smooth and consistent
- Link functionality works in both collapsed and expanded states

---

## Test plan / notes

### Playwright E2E Coverage

- Add E2E test in `tests/admin/customSidebarLinks.spec.ts` to verify:
  - Environment-configured links appear in sidebar footer
  - Links open in correct target (new tab vs current tab)
  - Icons display correctly for external vs internal links
  - Context filtering works across facility/admin/organization sidebars
  - Collapsed/expanded states show correct icon/label combinations
  - Link ordering is maintained

### CI Requirements

- All existing tests must continue to pass
- Linting must pass: `npm run lint`
- TypeScript compilation must succeed: `npx tsc --noEmit`
- Build must succeed: `npm run build`

### Manual Testing Notes

- Test with various screen sizes (desktop, tablet, mobile) to ensure responsive behavior
- Test with screen readers to verify accessibility (aria-hidden on icons, proper link semantics)
- Test keyboard navigation (Tab to focus links, Enter to activate)
- Test with long link labels to verify text truncation/wrapping behavior
- Test with many links (10+) to verify scrolling behavior in footer

### Plugin Integration (Production Environment Only)

- Once plugins are available in production:
  - Verify plugin-provided links merge correctly with environment links
  - Confirm environment links appear before plugin links
  - Test that plugin links respect the same context filtering
  - Verify plugin links can have different types (external/internal) and openInNewTab settings
