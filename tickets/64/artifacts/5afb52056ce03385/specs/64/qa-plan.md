# QA Plan: Custom Footer Links in Sidebar

## AC1 — Custom links appear in sidebar footer above NavUser

### Research map

- routes: All sidebars - facility, patient, admin, organization, location, service
- components: `src/components/ui/sidebar/app-sidebar.tsx`, `src/components/ui/sidebar/nav-footer-links.tsx`, `src/components/ui/sidebar/nav-user.tsx`
- config: `care.config.ts` customFooterLinks array
- i18n labels: "care_documentation", "admin_settings"
- auth/role: tests/.auth/user.json (any authenticated user)
- permissions: None required (visibility based only on configuration)
- facility-scoped: No (appears in all contexts)
- fixtures needed: load-fixtures provides authenticated user and facility

### Prerequisites

- User must be logged in (any role)
- care.config.ts must have customFooterLinks configured

### Data setup

- Prefer fixtures: load-fixtures provides authenticated users and facilities
- Configuration: Manually add to care.config.ts before testing:
  ```typescript
  customFooterLinks: [
    {
      name: "care_documentation",
      url: "https://docs.ohc.network",
      target: "_blank",
    },
    {
      name: "admin_settings",
      url: "/admin",
      target: "_self",
    },
  ] as CustomFooterLink[],
  ```
- Restart dev server after config change

### Steps

1. **Action:** Open browser, navigate to http://localhost:4000, log in with username: `admin`, password: `admin`
   **Expect:** Login successful, redirected to facility selection or dashboard
   **Record through:** yes

2. **Action:** Navigate to any facility page (e.g., `/facility/{facilityId}/overview`)
   **Expect:** Facility sidebar renders with links at the bottom above user avatar
   **Record through:** yes

3. **Action:** Scroll to sidebar footer, observe links above user avatar (name/username)
   **Expect:** Two links visible: "CARE Documentation" and "Admin Settings", stacked vertically above user avatar
   **Record through:** yes

4. **Action:** Navigate to `/admin` page
   **Expect:** Admin sidebar renders with the same footer links above user avatar
   **Record through:** yes

5. **Action:** Navigate to `/organization/{organizationId}` page (if user has organization access)
   **Expect:** Organization sidebar renders with footer links above user avatar
   **Record through:** yes

### Success looks like

- Footer links appear in all sidebar contexts (facility, admin, organization)
- Links are positioned directly above the user avatar/NavUser component
- Links are visible and styled consistently with sidebar navigation

---

## AC2 — External links open in new tab with external link icon

### Research map

- components: `src/components/ui/sidebar/nav-footer-links.tsx`
- icons: `ExternalLink` from lucide-react
- config: `target: "_blank"` property in CustomFooterLink

### Prerequisites

- User logged in
- External link configured in care.config.ts (from AC1 setup)

### Data setup

- Use configuration from AC1 with external link:
  ```typescript
  {
    name: "care_documentation",
    url: "https://docs.ohc.network",
    target: "_blank",
  }
  ```

### Steps

1. **Action:** Navigate to facility page, locate "CARE Documentation" link in sidebar footer
   **Expect:** Link displays with external link icon (arrow pointing out of box)
   **Record through:** yes

2. **Action:** Right-click "CARE Documentation" link, inspect element in browser DevTools
   **Expect:** Link is an `<a>` tag with `href="https://docs.ohc.network"`, `target="_blank"`, and `rel="noopener noreferrer"` attributes
   **Record through:** yes

3. **Action:** Click "CARE Documentation" link
   **Expect:** New browser tab opens with https://docs.ohc.network (or shows connection error if URL doesn't exist - this is expected), current tab remains on CARE application
   **Record through:** yes

### Success looks like

- External link icon (arrow out) visible next to link text
- Link opens in new tab when clicked
- Original CARE tab remains active and unchanged
- Link has proper security attributes (noopener noreferrer)

---

## AC3 — Internal routes navigate in current tab with internal route icon

### Research map

- components: `src/components/ui/sidebar/nav-footer-links.tsx`
- icons: `Link2` from lucide-react
- routing: raviger `<Link>` component
- config: `target: "_self"` property in CustomFooterLink

### Prerequisites

- User logged in
- Internal link configured in care.config.ts (from AC1 setup)

### Data setup

- Use configuration from AC1 with internal link:
  ```typescript
  {
    name: "admin_settings",
    url: "/admin",
    target: "_self",
  }
  ```

### Steps

1. **Action:** Navigate to facility page, locate "Admin Settings" link in sidebar footer
   **Expect:** Link displays with internal route icon (chain link icon, not external arrow)
   **Record through:** yes

2. **Action:** Right-click "Admin Settings" link, inspect element in browser DevTools
   **Expect:** Link uses raviger's `<Link>` component (href="/admin", no target attribute)
   **Record through:** yes

3. **Action:** Click "Admin Settings" link from facility page
   **Expect:** Current tab navigates to `/admin` page, URL changes in address bar, no new tab opens
   **Record through:** yes

4. **Action:** Use browser back button
   **Expect:** Returns to previous facility page
   **Record through:** yes

### Success looks like

- Internal route icon (Link2/chain) visible next to link text
- Link navigates in same tab using SPA routing
- Browser history works correctly (back button returns)
- No new tabs opened

---

## AC4 — visibleIn property filters links by sidebar context

### Research map

- components: `src/components/ui/sidebar/nav-footer-links.tsx`
- enum: `SidebarFor` from `src/components/ui/sidebar/app-sidebar.tsx`
- contexts: FACILITY, PATIENT, ADMIN
- config: `visibleIn?: SidebarFor[]` property in CustomFooterLink

### Prerequisites

- User logged in with access to multiple contexts (facility, admin)

### Data setup

- Configuration: Update care.config.ts with context-filtered links:
  ```typescript
  customFooterLinks: [
    {
      name: "care_documentation",
      url: "https://docs.ohc.network",
      target: "_blank",
      visibleIn: [SidebarFor.FACILITY],
    },
    {
      name: "admin_settings",
      url: "/admin",
      target: "_self",
      visibleIn: [SidebarFor.ADMIN],
    },
  ] as CustomFooterLink[],
  ```
- Restart dev server after config change

### Steps

1. **Action:** Navigate to facility page (e.g., `/facility/{facilityId}/overview`), observe sidebar footer
   **Expect:** Only "CARE Documentation" link visible above user avatar (admin_settings is hidden)
   **Record through:** yes

2. **Action:** Navigate to `/admin` page, observe sidebar footer
   **Expect:** Only "Admin Settings" link visible above user avatar (care_documentation is hidden)
   **Record through:** yes

3. **Action:** Update config to make documentation visible in both contexts:

   ```typescript
   visibleIn: [SidebarFor.FACILITY, SidebarFor.ADMIN],
   ```

   Restart dev server, navigate to facility page
   **Expect:** "CARE Documentation" link now visible
   **Record through:** yes

4. **Action:** Navigate to admin page
   **Expect:** Both "CARE Documentation" and "Admin Settings" links visible (both match ADMIN context)
   **Record through:** yes

5. **Action:** Update config to remove visibleIn property from documentation link:
   ```typescript
   {
     name: "care_documentation",
     url: "https://docs.ohc.network",
     target: "_blank",
     // no visibleIn property
   }
   ```
   Restart dev server, navigate to facility and admin pages
   **Expect:** "CARE Documentation" link appears in all sidebar contexts (default behavior)
   **Record through:** yes

### Success looks like

- Links with visibleIn property only appear in specified contexts
- Links without visibleIn property appear in all contexts
- Context filtering works correctly for FACILITY and ADMIN contexts
- Sidebar footer adapts dynamically based on current context

---

## AC5 — Plugin footer links appear alongside configuration-defined links

### Research map

- plugin types: `src/pluginTypes.ts` PluginManifest.footerNavItems
- hook: `src/hooks/useCareApps.tsx` useCareApps
- components: `src/components/ui/sidebar/nav-footer-links.tsx`

### Prerequisites

- User logged in
- Configuration links set up (from AC1)

### Data setup

**Note:** Plugin testing cannot be performed in live QA as no test plugins are available with footerNavItems. This acceptance criterion validates the implementation exists and handles plugin links correctly, but full plugin integration testing will occur when plugins adopt the feature.

For code verification:

- Component correctly calls `useCareApps()` hook
- Component extracts `footerNavItems` from loaded plugins
- Component merges config links and plugin links in correct order
- Type support exists in PluginManifest interface

### Steps

1. **Action:** Open `src/components/ui/sidebar/nav-footer-links.tsx` in editor
   **Expect:** Code shows `useCareApps()` call and `footerNavItems` extraction from plugins
   **Record through:** yes

2. **Action:** Review line ~38-41 of nav-footer-links.tsx:

   ```typescript
   const pluginFooterLinks = careApps.flatMap((app) =>
     !app.isLoading && app.footerNavItems ? app.footerNavItems : [],
   ) as NavigationLink[];
   ```

   **Expect:** Code correctly extracts footerNavItems from loaded care apps
   **Record through:** yes

3. **Action:** Review line ~44-47 showing link merging:

   ```typescript
   const allLinks: (CustomFooterLink | NavigationLink)[] = [
     ...careConfig.customFooterLinks,
     ...pluginFooterLinks,
   ];
   ```

   **Expect:** Configuration links appear first, followed by plugin links (maintains predictable ordering)
   **Record through:** yes

4. **Action:** Open `src/pluginTypes.ts`, verify `PluginManifest` interface includes `footerNavItems?: NavigationLink[]`
   **Expect:** Type definition exists at line ~209, allowing plugins to declare footer links
   **Record through:** yes

### Success looks like

- Implementation correctly integrates plugin footer links
- Type support exists for plugins to declare footerNavItems
- Configuration links render first, then plugin links (stable ordering)
- Code handles loading state and missing footerNavItems gracefully
- **Live plugin testing deferred** until plugins implement footerNavItems

---

## AC6 — Tooltip on hover when sidebar collapsed

### Research map

- components: `src/components/ui/sidebar/nav-footer-links.tsx`
- sidebar state: `useSidebar()` hook, `state === "collapsed"`
- tooltip: `SidebarMenuButton` tooltip prop

### Prerequisites

- User logged in
- Footer links configured (from AC1 setup)

### Data setup

- Use configuration from AC1 with links

### Steps

1. **Action:** Navigate to facility page, ensure sidebar is expanded (default state)
   **Expect:** Sidebar shows full link text: "CARE Documentation", "Admin Settings"
   **Record through:** yes

2. **Action:** Click sidebar collapse button (icon at top left of sidebar)
   **Expect:** Sidebar collapses to icon-only mode, link text disappears
   **Record through:** yes

3. **Action:** Hover mouse over the external link icon (first footer link) in collapsed sidebar
   **Expect:** Tooltip appears showing "CARE Documentation" text next to icon
   **Record through:** yes

4. **Action:** Move mouse away, then hover over the internal link icon (second footer link)
   **Expect:** Tooltip appears showing "Admin Settings" text next to icon
   **Record through:** yes

5. **Action:** Click expand button to restore sidebar
   **Expect:** Sidebar expands, full link text visible, tooltips no longer needed
   **Record through:** yes

### Success looks like

- Collapsed sidebar shows only icons for footer links
- Hovering over icons displays tooltip with link name
- Tooltip positioned correctly next to icon
- Expanded sidebar shows full text, no tooltips appear

---

## AC7 — Links render in configuration order, stacked vertically

### Research map

- components: `src/components/ui/sidebar/nav-footer-links.tsx`
- layout: `SidebarMenu` and `SidebarMenuItem` components
- config: `customFooterLinks` array order in care.config.ts

### Prerequisites

- User logged in

### Data setup

- Configuration: Add multiple links in specific order:
  ```typescript
  customFooterLinks: [
    {
      name: "care_documentation",
      url: "https://docs.ohc.network",
      target: "_blank",
    },
    {
      name: "admin_settings",
      url: "/admin",
      target: "_self",
    },
    // Add a third for clarity
    {
      name: "support",
      url: "https://support.example.com",
      target: "_blank",
    },
  ] as CustomFooterLink[],
  ```
- Add i18n key: `"support": "Support"` to `public/locale/en.json`
- Restart dev server after changes

### Steps

1. **Action:** Navigate to facility page, scroll to sidebar footer
   **Expect:** Three links visible above user avatar, stacked vertically
   **Record through:** yes

2. **Action:** Observe link order from top to bottom in sidebar footer
   **Expect:** Links appear in exact configuration order:
   1. CARE Documentation (external, top)
   2. Admin Settings (internal, middle)
   3. Support (external, bottom)
      **Record through:** yes

3. **Action:** Verify links are positioned directly above user avatar
   **Expect:** User avatar (with username/name) appears below all footer links, at very bottom of sidebar
   **Record through:** yes

4. **Action:** Update care.config.ts to reverse link order:
   ```typescript
   customFooterLinks: [
     { name: "support", url: "https://support.example.com", target: "_blank" },
     { name: "admin_settings", url: "/admin", target: "_self" },
     { name: "care_documentation", url: "https://docs.ohc.network", target: "_blank" },
   ],
   ```
   Restart dev server, refresh page
   **Expect:** Links now appear in new order: Support, Admin Settings, CARE Documentation (top to bottom)
   **Record through:** yes

### Success looks like

- Links stacked vertically (one per row)
- Order matches configuration array order exactly
- All links positioned above user avatar component
- Reordering config changes visual order immediately

---

## Test plan / notes

### Playwright E2E Test Coverage

- Add test file: `tests/sidebar/customFooterLinks.spec.ts`
- Test suite should cover:
  1. Footer links render with configuration
  2. External link opens in new tab
  3. Internal link navigates in same tab
  4. visibleIn filtering works for different contexts
  5. Tooltip appears when sidebar collapsed
  6. Links render in configuration order
  7. Empty config renders no footer links section

### CI Requirements

- `npm run lint` must pass (no ESLint errors)
- `npm run build` must complete successfully
- `npm run playwright:test` should include new sidebar tests
- Type checking passes (`tsc --noEmit`)

### Manual Testing Notes

- Test with different user roles (admin, nurse, doctor) to ensure no permission issues
- Test responsive behavior on mobile sidebar
- Test with very long link names to verify truncation/ellipsis
- Test with many links (5+) to verify scrolling behavior if needed
- Verify no console errors or warnings when rendering footer links
- Test i18n key fallback (raw string display if translation missing)

### Known Limitations

- Plugin footer links cannot be tested in QA environment (no test plugins available)
- Plugin testing will occur when real plugins adopt footerNavItems feature
- Configuration changes require server restart (not hot-reloadable)

### Accessibility Validation

- Verify links are keyboard navigable (Tab through sidebar footer)
- Test with screen reader to ensure link purpose is clear
- Confirm focus indicators are visible on footer links
- Validate color contrast for link text meets WCAG AA standards
