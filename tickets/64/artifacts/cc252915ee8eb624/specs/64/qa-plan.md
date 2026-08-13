# QA Plan: Custom Footer Links in Sidebar

## Environment Setup

### Prerequisites

- Backend running at http://127.0.0.1:9000 (local Django server)
- Frontend dev server running at http://localhost:4000
- Authenticated user: `admin` / `admin` (from `tests/.auth/user.json`)
- Facility context: Fixture facility from `load_fixtures` (ID available via `getFacilityId()`)

### Configuration Method

Custom footer links are configured via environment variable `REACT_CUSTOM_FOOTER_LINKS` which is parsed by `care.config.ts` at line 469. The env variable is exposed via Vite's `import.meta.env` (configured with `envPrefix: "REACT_"` in `vite.config.mts`).

**To configure test links for QA:**

1. Create `.env.local` file in repository root:

```bash
REACT_CUSTOM_FOOTER_LINKS='[{"name":"CARE Documentation","url":"https://docs.ohc.network","target":"_blank"},{"name":"Admin Panel","url":"/admin","target":"_self","visibleIn":["facility"]}]'
```

2. Restart dev server (required for env vars to take effect):

```bash
npm run dev
```

3. Verify configuration loaded:
   - Open browser console at http://localhost:4000
   - Check sidebar footer for the configured links

**Alternative: Manual care.config.ts edit** (if env var doesn't work):
Uncomment example links at `care.config.ts` lines 473-484 and restart dev server.

---

## AC1 — Custom footer links appear above NavUser in all sidebar contexts

### Research map

- Routes: `src/Routers/AppRouter.tsx` → facility, admin, organization sidebars
- Components: `src/components/ui/sidebar/app-sidebar.tsx` line 193-204 (SidebarFooter with NavFooterLinks)
- i18n labels: "CARE Documentation", "Admin Panel" (from test config)
- Auth: `tests/.auth/user.json` (admin/admin)
- Permissions: None required (visibility is context-based, not permission-based)
- Fixtures: Seeded facility from `load_fixtures`

### Prerequisites

- Environment variable configured per setup above
- Dev server restarted

### Data setup

- Prefer fixtures: Facility from `load_fixtures` (ID from `getFacilityId()`)
- Provenance: Configuration links from `.env.local` setup above
- No additional UI or API setup required — links are config-driven

### Steps

1. **Action:** Navigate to facility overview page at `/facility/{facilityId}/overview`
   **Expect:** Sidebar visible with custom footer links appearing above the user avatar (FacilityNavUser)
   **Record through:** yes

2. **Action:** Navigate to admin page at `/admin`
   **Expect:** Sidebar visible with custom footer links appearing above the user avatar (FacilityNavUser)
   **Record through:** yes

3. **Action:** Scroll sidebar footer to view the NavUser component
   **Expect:** Custom footer links are positioned directly above the user avatar section
   **Record through:** yes

### Success looks like

- Custom footer links visible in sidebar footer
- Links appear above NavUser component in all contexts
- Links render with appropriate icons (external link icon for `_blank`, internal link icon for `_self`)

---

## AC2 — External links open in new tab with external link icon

### Research map

- Component: `src/components/ui/sidebar/nav-footer-links.tsx` lines 89-110 (external link rendering)
- Icon: `lucide-react` ExternalLink icon
- Target attribute: `_blank` with `rel="noopener noreferrer"`

### Prerequisites

- Environment variable configured with at least one external link (target: "_blank")
- Dev server restarted

### Data setup

- Same as AC1 — configuration includes:
  ```json
  {
    "name": "CARE Documentation",
    "url": "https://docs.ohc.network",
    "target": "_blank"
  }
  ```

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/overview`
   **Expect:** Sidebar footer shows "CARE Documentation" link with external link icon (arrow pointing up-right)
   **Record through:** yes

2. **Action:** Right-click the "CARE Documentation" link and inspect element
   **Expect:** Link has attributes `target="_blank"` and `rel="noopener noreferrer"`
   **Record through:** yes

3. **Action:** Click the "CARE Documentation" link
   **Expect:** New browser tab opens to `https://docs.ohc.network` (or 404 if domain unreachable — new tab is the success criterion)
   **Record through:** yes

### Success looks like

- External link displays ExternalLink icon (lucide-react)
- Link opens in new tab
- Original tab remains on current page

---

## AC3 — Internal links navigate in current tab with internal route icon

### Research map

- Component: `src/components/ui/sidebar/nav-footer-links.tsx` lines 114-132 (internal link rendering)
- Icon: `lucide-react` Link2 icon
- Routing: `raviger` Link component (client-side navigation)

### Prerequisites

- Environment variable configured with at least one internal link (target: "_self")
- Dev server restarted

### Data setup

- Same as AC1 — configuration includes:
  ```json
  { "name": "Admin Panel", "url": "/admin", "target": "_self" }
  ```

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/overview`
   **Expect:** Sidebar footer shows "Admin Panel" link with internal link icon (link chain icon)
   **Record through:** yes

2. **Action:** Right-click the "Admin Panel" link and inspect element
   **Expect:** Link is a raviger `<Link>` element (no `target="_blank"` attribute), href is `/admin`
   **Record through:** yes

3. **Action:** Click the "Admin Panel" link
   **Expect:** Page navigates to `/admin` in the current tab (same window), admin page loads
   **Record through:** yes

### Success looks like

- Internal link displays Link2 icon (lucide-react)
- Link navigates in current tab (no new tab opened)
- Browser history updated with `/admin` route

---

## AC4 — Links filtered by visibleIn sidebar context

### Research map

- Component: `src/components/ui/sidebar/nav-footer-links.tsx` lines 42-49 (context filtering)
- SidebarFor enum: `src/components/ui/sidebar/app-sidebar.tsx` (facility, admin, organization, patient, etc.)
- Test link: `visibleIn: ["facility"]` restricts to facility sidebar only

### Prerequisites

- Environment variable configured with context-specific link
- Dev server restarted

### Data setup

- Configuration includes:
  ```json
  {
    "name": "Admin Panel",
    "url": "/admin",
    "target": "_self",
    "visibleIn": ["facility"]
  }
  ```
- This link should appear only in facility context, not in admin sidebar

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/overview`
   **Expect:** Sidebar footer shows "Admin Panel" link (visibleIn includes "facility")
   **Record through:** yes

2. **Action:** Navigate to `/admin`
   **Expect:** Sidebar footer does NOT show "Admin Panel" link (visibleIn excludes "admin" context)
   **Record through:** yes

3. **Action:** Navigate back to `/facility/{facilityId}/overview`
   **Expect:** "Admin Panel" link reappears in sidebar footer (context filter working)
   **Record through:** yes

### Success looks like

- Link visible only in configured contexts (facility sidebar)
- Link hidden in non-configured contexts (admin sidebar)
- Context filtering is dynamic (appears/disappears on navigation)

---

## AC5 — Plugin footer links appear alongside config links

**Note:** This AC cannot be verified in live QA. Plugin testing requires:

1. A test plugin with `footerNavItems` in its manifest
2. Plugin loading infrastructure (module federation, manifest parsing)
3. Plugin dev environment setup

**Code review verification:**

- `src/pluginTypes.ts` line 210: `footerNavItems?: NavigationLink[]` added to PluginManifest
- `src/components/ui/sidebar/nav-footer-links.tsx` lines 32-39: Plugin links merged with config links
- `useCareApps()` hook provides plugin manifests with footerNavItems

**Test plan note:** This AC will be verified via code review, not live QA. When a plugin defines `footerNavItems` in its manifest, the NavFooterLinks component will merge them with `careConfig.customFooterLinks` and render them in the same footer section.

---

## AC6 — Tooltip displays link name when sidebar is collapsed

### Research map

- Component: `src/components/ui/sidebar/nav-footer-links.tsx` lines 94, 118 (tooltip prop)
- Sidebar state: `useSidebar()` hook, `state === "collapsed"`
- Trigger: SidebarTrigger component at `src/components/ui/sidebar.tsx` line 259 (`data-sidebar="trigger"`)

### Prerequisites

- Environment variable configured with at least one link
- Dev server restarted
- Desktop viewport (sidebar collapse trigger only available on desktop)

### Data setup

- Same as AC1 — any configured link will have tooltip when sidebar is collapsed

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/overview` in desktop viewport (width > 768px)
   **Expect:** Sidebar expanded, collapse trigger button visible in header
   **Record through:** yes

2. **Action:** Click the sidebar collapse trigger (`data-sidebar="trigger"`)
   **Expect:** Sidebar collapses to icon-only mode (link names hidden)
   **Record through:** yes

3. **Action:** Hover over a custom footer link (e.g., "CARE Documentation")
   **Expect:** Tooltip appears displaying the link name ("CARE Documentation")
   **Record through:** yes

4. **Action:** Move mouse away from the link
   **Expect:** Tooltip disappears
   **Record through:** yes

### Success looks like

- Sidebar collapses when trigger clicked
- Link icons remain visible in collapsed state
- Tooltip appears on hover with link name
- Tooltip disappears on mouse leave

---

## AC7 — Links appear in configuration order, stacked vertically

### Research map

- Component: `src/components/ui/sidebar/nav-footer-links.tsx` lines 60-134 (map rendering)
- Ordering: Array order from `careConfig.customFooterLinks` preserved in rendering

### Prerequisites

- Environment variable configured with multiple links in specific order
- Dev server restarted

### Data setup

- Configuration with 3+ links in specific order:
  ```json
  [
    {
      "name": "First Link",
      "url": "https://first.example",
      "target": "_blank"
    },
    {
      "name": "Second Link",
      "url": "https://second.example",
      "target": "_blank"
    },
    { "name": "Third Link", "url": "/admin", "target": "_self" }
  ]
  ```

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/overview`
   **Expect:** Sidebar footer shows all three links stacked vertically
   **Record through:** yes

2. **Action:** Inspect the sidebar footer DOM order
   **Expect:** Links appear in DOM order matching configuration order (First, Second, Third)
   **Record through:** yes

3. **Action:** Visually verify vertical stacking
   **Expect:** Links are stacked vertically (one per row), not horizontally
   **Record through:** yes

### Success looks like

- Links appear in the exact order defined in configuration
- Links are vertically stacked (SidebarMenu default layout)
- No horizontal wrapping or reordering

---

## Test plan / notes

### Playwright E2E Coverage

The following test file was added: `tests/sidebar/customFooterLinks.spec.ts`

**Test cases implemented:**

1. Empty config verification (no links rendered)
2. Tooltip display when collapsed (requires manual config)
3. External link attributes (target="_blank", rel="noopener noreferrer")
4. Internal link navigation (raviger Link component)
5. Context filtering (visibleIn property)
6. Link ordering (config order preserved)
7. Plugin integration (skipped — cannot test without plugin dev setup)
8. Sidebar render without custom links (baseline test)

**Tests requiring manual config:**
Most tests are skipped by default (`test.skip(true)`) because they require environment variable configuration. To run these tests:

1. Set `REACT_CUSTOM_FOOTER_LINKS` in `.env.local`
2. Build app: `npm run build`
3. Unskip tests and run: `npm run playwright:test tests/sidebar/customFooterLinks.spec.ts`

**CI expectations:**

- CI should pass with default config (no custom links) — baseline tests run
- Feature tests are documentation for manual verification

### Manual Verification Checklist

- [ ] Custom links appear in all sidebar contexts (facility, admin, org, patient)
- [ ] External links open in new tabs with ExternalLink icon
- [ ] Internal links navigate in current tab with Link2 icon
- [ ] Context filtering works (visibleIn property)
- [ ] Tooltips appear when sidebar is collapsed
- [ ] Links appear in configuration order
- [ ] Empty config does not break sidebar
- [ ] Long link names are handled gracefully (truncation/wrapping)
- [ ] Icons are consistently sized and aligned
- [ ] Hover states match sidebar style (gray-200 background, green-700 text)

### Known Limitations

- Plugin footer links cannot be tested in local QA without a test plugin
- Environment variable changes require dev server restart
- Tests are skipped by default to avoid CI failures on empty config
