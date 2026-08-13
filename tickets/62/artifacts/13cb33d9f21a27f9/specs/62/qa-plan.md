# QA Plan: Custom Sidebar Links

## AC1 — Custom links appear in sidebar footer via environment variable

### Research map

- routes: Facility sidebar at `/facility/:facilityId/*`
- components: `src/components/ui/sidebar/app-sidebar.tsx`, `src/components/ui/sidebar/custom-links.tsx`
- config: `care.config.ts` - `customSidebarLinks` from `REACT_CUSTOM_SIDEBAR_LINKS`
- i18n labels: N/A (link labels come from configuration)
- auth/role: tests/.auth/user.json (any authenticated user)
- permissions: None required
- facility-scoped: No (sidebar links available in all contexts)
- fixtures needed: Seeded facility (from load-fixtures)

### Prerequisites

- Backend running on port 9000
- Production build exists (`npm run build`)
- User authenticated (any role)
- Environment variable set in `.env.local`

### Data setup

- No additional data needed beyond fixtures
- Configuration via `.env.local`:
  ```
  REACT_CUSTOM_SIDEBAR_LINKS=[{"label":"Test External Link","url":"https://github.com","type":"external","openInNewTab":true},{"label":"Test Internal Link","url":"/","type":"internal","openInNewTab":false}]
  ```
- Restart dev server after adding environment variable

### Steps

1. **Action:** Set `REACT_CUSTOM_SIDEBAR_LINKS` in `.env.local` with the configuration above
   **Expect:** Environment variable is set
   **Record through:** no

2. **Action:** Restart dev server (`npm run dev`) and navigate to `/`
   **Expect:** App loads successfully
   **Record through:** no

3. **Action:** Log in with username `care-admin` and password `Ohcn@123`
   **Expect:** Login successful, redirected to dashboard
   **Record through:** no

4. **Action:** Navigate to `/facility/{facilityId}` (use any facility from fixtures)
   **Expect:** Facility dashboard loads
   **Record through:** no

5. **Action:** Scroll to bottom of sidebar and locate the footer section above the user avatar
   **Expect:** Two custom links visible: "Test External Link" with external link icon and "Test Internal Link" with internal link icon
   **Record through:** yes

### Success looks like

- Custom links visible in sidebar footer above user avatar
- External link shows ExternalLink icon
- Internal link shows Link2 icon
- Links maintain proper spacing and styling

---

## AC2 — Links open in new tab or current tab based on configuration

### Research map

- routes: Same as AC1
- components: `src/components/ui/sidebar/custom-links.tsx`
- config: `openInNewTab` property in sidebar link configuration
- auth/role: tests/.auth/user.json
- permissions: None required
- fixtures needed: Seeded facility

### Prerequisites

- Same as AC1
- Custom links configured with different `openInNewTab` values

### Data setup

- Use configuration from AC1 (one link with `openInNewTab: true`, one with `openInNewTab: false`)

### Steps

1. **Action:** Click "Test External Link" (configured with `openInNewTab: true`)
   **Expect:** GitHub opens in a new browser tab
   **Record through:** yes

2. **Action:** Close the GitHub tab and return to CARE
   **Expect:** Original CARE tab still shows facility dashboard
   **Record through:** no

3. **Action:** Click "Test Internal Link" (configured with `openInNewTab: false`)
   **Expect:** Navigation to `/` (dashboard) in the current tab
   **Record through:** yes

### Success looks like

- External link with `openInNewTab: true` opens in new tab
- Internal link with `openInNewTab: false` navigates in current tab
- Original tab remains accessible after external link opens

---

## AC3 — External and internal link icons display correctly

### Research map

- routes: Same as AC1
- components: `src/components/ui/sidebar/custom-links.tsx`
- icons: `ExternalLink` and `Link2` from lucide-react
- auth/role: tests/.auth/user.json
- permissions: None required
- fixtures needed: Seeded facility

### Prerequisites

- Same as AC1
- Custom links configured with both `type: "external"` and `type: "internal"`

### Data setup

- Use configuration from AC1 (one external, one internal link)

### Steps

1. **Action:** Navigate to `/facility/{facilityId}` and locate custom links in sidebar footer
   **Expect:** Sidebar footer visible with custom links
   **Record through:** no

2. **Action:** Observe the icon for "Test External Link"
   **Expect:** ExternalLink icon (arrow pointing out of square) displayed
   **Record through:** yes

3. **Action:** Observe the icon for "Test Internal Link"
   **Expect:** Link2 icon (two connected links) displayed
   **Record through:** yes

### Success looks like

- External links show ExternalLink icon
- Internal links show Link2 icon
- Icons are visually distinct and appropriate for link type

---

## AC4 — Links filter by sidebar context

### Research map

- routes: Facility `/facility/:facilityId`, Admin `/admin`, Patient `/patient`
- components: `src/components/ui/sidebar/app-sidebar.tsx`, `src/components/ui/sidebar/custom-links.tsx`
- config: `contexts` property in sidebar link configuration
- auth/role: tests/.auth/user.json (admin), tests/.auth/facilityAdmin.json
- permissions: Admin access for `/admin` route
- fixtures needed: Seeded facility, admin user

### Prerequisites

- Backend running
- Production build exists
- Multiple custom links configured with different context filters
- Admin user authenticated

### Data setup

- Configuration via `.env.local`:
  ```
  REACT_CUSTOM_SIDEBAR_LINKS=[{"label":"Facility Only","url":"https://example.com","type":"external","openInNewTab":true,"contexts":["facility"]},{"label":"Admin Only","url":"https://example.com","type":"external","openInNewTab":true,"contexts":["admin"]},{"label":"All Contexts","url":"https://example.com","type":"external","openInNewTab":true}]
  ```
- Restart dev server after configuration

### Steps

1. **Action:** Navigate to `/facility/{facilityId}` and scroll to sidebar footer
   **Expect:** Sidebar footer visible
   **Record through:** no

2. **Action:** Locate custom links in sidebar footer
   **Expect:** "Facility Only" and "All Contexts" links visible, "Admin Only" not visible
   **Record through:** yes

3. **Action:** Navigate to `/admin` route
   **Expect:** Admin dashboard loads with admin sidebar
   **Record through:** no

4. **Action:** Scroll to sidebar footer and locate custom links
   **Expect:** "Admin Only" and "All Contexts" links visible, "Facility Only" not visible
   **Record through:** yes

### Success looks like

- Links with `contexts: ["facility"]` only appear in facility sidebar
- Links with `contexts: ["admin"]` only appear in admin sidebar
- Links without `contexts` property appear in all sidebars
- Context filtering works correctly across different sidebar types

---

## AC6 — Links appear in correct order (environment first, then plugins)

### Research map

- routes: Same as AC1
- components: `src/components/ui/sidebar/custom-links.tsx`
- config: Environment links from `care.config.ts`, plugin links from `PluginManifest`
- auth/role: tests/.auth/user.json
- permissions: None required
- fixtures needed: Seeded facility

### Prerequisites

- Same as AC1
- Custom links configured via environment variable
- Note: Plugin links cannot be tested in this QA plan (plugins not available in test environment)

### Data setup

- Use configuration from AC1 (environment links only)
- Plugin link ordering verification is covered by implementation but not testable in QA

### Steps

1. **Action:** Navigate to `/facility/{facilityId}` and scroll to sidebar footer
   **Expect:** Sidebar footer visible with custom links
   **Record through:** no

2. **Action:** Observe the order of custom links in sidebar footer
   **Expect:** Links appear in the order defined in `REACT_CUSTOM_SIDEBAR_LINKS` array (external link first, then internal link)
   **Record through:** yes

3. **Action:** Verify links are positioned above the user avatar component
   **Expect:** Custom links render above NavUser component in footer
   **Record through:** yes

### Success looks like

- Environment-configured links appear in specified order
- Links positioned above user avatar
- Footer layout maintains proper vertical spacing

---

## AC7 — Collapsed and expanded sidebar states

### Research map

- routes: Same as AC1
- components: `src/components/ui/sidebar/custom-links.tsx`, `src/components/ui/sidebar/app-sidebar.tsx`
- sidebar state: Controlled by `useSidebar()` hook
- auth/role: tests/.auth/user.json
- permissions: None required
- fixtures needed: Seeded facility

### Prerequisites

- Same as AC1
- Custom links configured

### Data setup

- Use configuration from AC1

### Steps

1. **Action:** Navigate to `/facility/{facilityId}` with sidebar in expanded state
   **Expect:** Sidebar expanded, showing full link labels
   **Record through:** no

2. **Action:** Observe custom links in sidebar footer
   **Expect:** Links show both icon and label text ("Test External Link", "Test Internal Link")
   **Record through:** yes

3. **Action:** Click the sidebar collapse button (usually in top-left or sidebar header)
   **Expect:** Sidebar collapses to icon-only mode
   **Record through:** no

4. **Action:** Observe custom links in collapsed sidebar footer
   **Expect:** Links show icon only, no label text visible
   **Record through:** yes

5. **Action:** Hover over a custom link in collapsed mode
   **Expect:** Tooltip appears showing the link label
   **Record through:** yes

6. **Action:** Click the sidebar expand button
   **Expect:** Sidebar expands, showing full link labels again
   **Record through:** yes

### Success looks like

- Expanded sidebar: icons + labels visible
- Collapsed sidebar: icons only, labels hidden
- Tooltips appear on hover in collapsed mode
- Layout responsive to sidebar state changes

---

## AC5 — Plugin sidebar links support

**Note:** Plugin sidebar links are structurally supported through the `PluginManifest.sidebarLinks` property extension, but cannot be tested in this QA environment as plugins are not available. The implementation includes:

- Plugin type extension (`src/pluginTypes.ts`)
- Plugin link merging in `CustomSidebarLinks` component
- Proper ordering (environment links first, then plugin links)

This feature will need to be verified in a production environment with actual plugins deployed.

---

## Test plan / notes

### Implementation completeness

- All acceptance criteria implemented per spec
- Type definitions in place for `SidebarLink` and `SidebarContext`
- Plugin support structure complete (not testable in QA)
- Error handling for invalid JSON configuration
- Accessibility features (tooltips, ARIA labels)

### CI expectations

- Build must succeed (`npm run build`)
- Linter must pass (`npm run lint`)
- Type check must pass (`npx tsc --noEmit`)
- No Playwright E2E tests added (UI feature, manual verification sufficient)

### Configuration examples

Valid `REACT_CUSTOM_SIDEBAR_LINKS` format:

```json
[
  {
    "label": "Help Documentation",
    "url": "https://docs.example.com",
    "type": "external",
    "openInNewTab": true,
    "contexts": ["facility", "admin"]
  },
  {
    "label": "Dashboard",
    "url": "/",
    "type": "internal",
    "openInNewTab": false
  }
]
```

### Known limitations

- Plugin sidebar links structure implemented but untestable without deployed plugins
- Links without `contexts` property appear in all sidebar types (expected behavior)
- Invalid JSON in environment variable falls back to empty array with console warning
