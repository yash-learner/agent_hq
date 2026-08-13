# QA Plan: Custom Footer Links in Sidebar

## AC1 — Custom footer links appear in all sidebar contexts

### Research map

- routes: Various sidebar contexts (facility, organization, patient, admin)
- components: `src/components/ui/sidebar/app-sidebar.tsx`, `src/components/ui/sidebar/nav-footer-links.tsx`
- i18n labels: Link names from configuration (dynamic)
- auth/role: tests/.auth/user.json
- permissions: N/A (configuration-based feature)
- fixtures needed: Facility from load-fixtures

### Prerequisites

- Backend running on port 9000
- Frontend built with `npm run build` and running with `npm run dev` or `npm run preview`
- Authenticated as admin user

### Data setup

**Environment variable configuration (reproducible method):**

1. Create a test environment file `.env.test.local` in the project root:

   ```bash
   REACT_CARE_API_URL=http://127.0.0.1:9000
   REACT_CUSTOM_FOOTER_LINKS='[{"name":"test_doc_link","url":"https://docs.ohc.network","target":"_blank"},{"name":"test_admin_link","url":"/admin","target":"_self"}]'
   ```

2. Add i18n keys to `public/locale/en.json` (for QA only - revert after testing):

   ```json
   "test_doc_link": "Test Documentation",
   "test_admin_link": "Test Admin Panel"
   ```

3. Restart the development server to pick up the environment variable:

   ```bash
   npm run dev
   ```

4. Verify configuration loaded: Open browser console and run:
   ```javascript
   // This would require exposing config for debugging, or verify via UI
   ```

**Alternative: Manual configuration (for local testing only):**

If environment variable approach doesn't work, edit `care.config.ts` temporarily:

```typescript
customFooterLinks: [
  {
    name: "test_doc_link",
    url: "https://docs.ohc.network",
    target: "_blank",
  },
  {
    name: "test_admin_link",
    url: "/admin",
    target: "_self",
  }
] as CustomFooterLink[],
```

**Provenance:**

- Configuration format from `care.config.ts` CustomFooterLink interface (lines 18-29)
- Environment variable support from `care.config.ts` (line 465+)
- Example URLs from commented examples in `care.config.ts`

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/overview`
   **Expect:** Sidebar footer displays two custom links above the user avatar: "Test Documentation" and "Test Admin Panel"
   **Record through:** yes

2. **Action:** Navigate to `/admin`
   **Expect:** Same two custom links appear in the admin sidebar footer
   **Record through:** yes

3. **Action:** Navigate to `/organization/{organizationId}/members` (if organization context available)
   **Expect:** Same two custom links appear in the organization sidebar footer
   **Record through:** yes

### Success looks like

- Custom footer links visible in all sidebar contexts
- Links appear above the user avatar component
- Link names are properly translated
- Links are clickable and styled consistently

---

## AC2 — External link opens in new tab with external link icon

### Research map

- components: `src/components/ui/sidebar/nav-footer-links.tsx` (lines 82-102)
- icons: ExternalLink from lucide-react
- auth/role: tests/.auth/user.json
- permissions: N/A
- fixtures needed: Facility from load-fixtures

### Prerequisites

- Backend running
- Environment configured with test links (from AC1 setup)
- Authenticated as admin user

### Data setup

Same as AC1 - uses the "test_doc_link" configured with `target: "_blank"`

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/overview`
   **Expect:** Sidebar footer displays "Test Documentation" link with an external link icon (arrow pointing out)
   **Record through:** yes

2. **Action:** Right-click the "Test Documentation" link and inspect element
   **Expect:** Link element has attributes: `target="_blank"` and `rel="noopener noreferrer"`
   **Record through:** yes

3. **Action:** Click the "Test Documentation" link
   **Expect:** New browser tab opens with the URL https://docs.ohc.network
   **Record through:** yes

### Success looks like

- External link icon visible next to link text
- Link opens in new tab
- Security attributes (`rel="noopener noreferrer"`) present
- Original tab remains on the same page

---

## AC3 — Internal link navigates in current tab with internal route icon

### Research map

- components: `src/components/ui/sidebar/nav-footer-links.tsx` (lines 106-125)
- icons: Link2 from lucide-react
- auth/role: tests/.auth/user.json
- permissions: N/A (admin route requires admin role)
- fixtures needed: Facility from load-fixtures

### Prerequisites

- Backend running
- Environment configured with test links (from AC1 setup)
- Authenticated as admin user

### Data setup

Same as AC1 - uses the "test_admin_link" configured with `target: "_self"`

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/overview`
   **Expect:** Sidebar footer displays "Test Admin Panel" link with an internal link icon (chain link icon)
   **Record through:** yes

2. **Action:** Right-click the "Test Admin Panel" link and inspect element
   **Expect:** Link element is a raviger `Link` component without `target="_blank"` attribute
   **Record through:** yes

3. **Action:** Click the "Test Admin Panel" link
   **Expect:** Navigation occurs in the current tab to `/admin` page, URL changes, sidebar updates to admin context
   **Record through:** yes

### Success looks like

- Internal link icon visible next to link text
- Navigation happens in same tab (no new tab opened)
- Admin page loads with admin sidebar
- URL bar shows `/admin`

---

## AC4 — Links filtered by sidebar context using visibleIn property

### Research map

- components: `src/components/ui/sidebar/nav-footer-links.tsx` (lines 42-49)
- types: `SidebarFor` enum from `src/components/ui/sidebar/app-sidebar.tsx` (lines 49-53)
- auth/role: tests/.auth/user.json
- permissions: N/A
- fixtures needed: Facility from load-fixtures

### Prerequisites

- Backend running
- Authenticated as admin user

### Data setup

**Environment variable configuration with visibleIn property:**

1. Update `.env.test.local` with context-filtered links:

   ```bash
   REACT_CUSTOM_FOOTER_LINKS='[{"name":"facility_only_link","url":"https://facility.example.com","target":"_blank","visibleIn":["facility"]},{"name":"admin_only_link","url":"https://admin.example.com","target":"_blank","visibleIn":["admin"]}]'
   ```

2. Add i18n keys:

   ```json
   "facility_only_link": "Facility Only Link",
   "admin_only_link": "Admin Only Link"
   ```

3. Restart dev server

**Provenance:**

- `visibleIn` property from CustomFooterLink interface (line 26)
- `SidebarFor` enum values: "facility", "patient", "admin" (lines 50-52)
- Filtering logic in NavFooterLinks component (lines 42-49)

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/overview`
   **Expect:** Sidebar footer shows "Facility Only Link" but NOT "Admin Only Link"
   **Record through:** yes

2. **Action:** Navigate to `/admin`
   **Expect:** Sidebar footer shows "Admin Only Link" but NOT "Facility Only Link"
   **Record through:** yes

3. **Action:** Click the visible link in each context
   **Expect:** Links work correctly in their respective contexts
   **Record through:** yes

### Success looks like

- Facility sidebar shows only facility-scoped link
- Admin sidebar shows only admin-scoped link
- Links without visibleIn property appear in all contexts (from AC1)
- Context filtering is accurate and dynamic

---

## AC5 — Plugin footer links appear alongside configuration links

### Research map

- components: `src/components/ui/sidebar/nav-footer-links.tsx` (lines 32-40)
- types: `PluginManifest.footerNavItems` from `src/pluginTypes.ts` (line 210)
- hooks: `useCareApps` from `src/hooks/useCareApps`
- auth/role: tests/.auth/user.json
- permissions: N/A
- fixtures needed: N/A (plugin testing)

### Prerequisites

- This criterion will be **verified via code review only**, not live QA
- Plugin system requires plugin infrastructure that cannot be easily mocked in QA

### Data setup

**Code review verification points:**

1. Check `src/components/ui/sidebar/nav-footer-links.tsx` lines 32-34:
   - Verify `useCareApps` hook retrieves plugin apps
   - Verify `footerNavItems` are extracted from loaded apps

2. Check `src/pluginTypes.ts` line 210:
   - Verify `PluginManifest` interface includes `footerNavItems?: NavigationLink[]`

3. Check `src/components/ui/sidebar/nav-footer-links.tsx` lines 37-40:
   - Verify plugin links are combined with config links: `[...careConfig.customFooterLinks, ...pluginFooterLinks]`
   - Verify combined links are filtered by context

4. Review implementation of `NavigationLink` interface in `src/components/ui/sidebar/nav-main.tsx`:
   - Verify compatibility with plugin-provided links

### Steps

**This AC is verified through code review, not live browser testing.**

Code reviewers should verify:

1. Plugin footerNavItems are properly typed in PluginManifest
2. NavFooterLinks component fetches and merges plugin links
3. Plugin links render with the same styling and behavior as config links
4. Plugin links respect visibility filtering like config links

### Success looks like

- Code review confirms plugin integration is implemented correctly
- useCareApps hook integration is present
- Plugin links and config links are combined in the correct order
- Both types of links undergo the same visibility filtering

---

## AC6 — Tooltip displays link name when sidebar is collapsed

### Research map

- components: `src/components/ui/sidebar/nav-footer-links.tsx` (line 86, 110)
- UI components: `SidebarMenuButton` with tooltip support
- auth/role: tests/.auth/user.json
- permissions: N/A
- fixtures needed: Facility from load-fixtures

### Prerequisites

- Backend running
- Environment configured with test links (from AC1 setup)
- Authenticated as admin user

### Data setup

Same as AC1 - uses existing test links

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/overview`
   **Expect:** Sidebar is expanded, custom footer links visible with text labels
   **Record through:** yes

2. **Action:** Click the sidebar collapse toggle (hamburger icon or sidebar trigger)
   **Expect:** Sidebar collapses to icon-only mode, link text hidden
   **Record through:** yes

3. **Action:** Hover mouse over the "Test Documentation" link icon in collapsed sidebar
   **Expect:** Tooltip appears displaying "Test Documentation" text
   **Record through:** yes

4. **Action:** Hover over the "Test Admin Panel" link icon
   **Expect:** Tooltip appears displaying "Test Admin Panel" text
   **Record through:** yes

### Success looks like

- Collapsed sidebar shows only icons for footer links
- Hovering each link icon displays correct tooltip with link name
- Tooltip disappears when mouse moves away
- Tooltip positioning is correct (not overlapping content)

---

## AC7 — Links appear in configuration order, stacked vertically

### Research map

- components: `src/components/ui/sidebar/nav-footer-links.tsx` (lines 59-126)
- layout: Vertical stacking via SidebarMenu component
- auth/role: tests/.auth/user.json
- permissions: N/A
- fixtures needed: Facility from load-fixtures

### Prerequisites

- Backend running
- Authenticated as admin user

### Data setup

**Environment configuration with multiple links in specific order:**

1. Update `.env.test.local` with 4 links in specific order:

   ```bash
   REACT_CUSTOM_FOOTER_LINKS='[{"name":"link_one","url":"https://one.example.com","target":"_blank"},{"name":"link_two","url":"https://two.example.com","target":"_blank"},{"name":"link_three","url":"/route-three","target":"_self"},{"name":"link_four","url":"/route-four","target":"_self"}]'
   ```

2. Add i18n keys in order:

   ```json
   "link_one": "First Link",
   "link_two": "Second Link",
   "link_three": "Third Link",
   "link_four": "Fourth Link"
   ```

3. Restart dev server

**Provenance:**

- Array order preservation from `customFooterLinks` config
- Rendering order from `.map()` iteration (line 60)

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/overview`
   **Expect:** Sidebar footer shows 4 custom links in vertical stack above user avatar
   **Record through:** yes

2. **Action:** Verify link order from top to bottom
   **Expect:** Links appear in exact order: "First Link", "Second Link", "Third Link", "Fourth Link"
   **Record through:** yes

3. **Action:** Inspect the vertical spacing between links
   **Expect:** Consistent spacing between each link, proper alignment
   **Record through:** yes

4. **Action:** Verify all links are above the user avatar component
   **Expect:** User avatar (with username/facility) appears below all custom footer links
   **Record through:** yes

### Success looks like

- All 4 links visible and vertically stacked
- Order matches configuration array order exactly
- Visual hierarchy: custom links → user avatar
- No horizontal layout or wrapping
- Consistent spacing and alignment

---

## Test plan / notes

**Playwright E2E Test Coverage:**

- Test file created: `tests/sidebar/customFooterLinks.spec.ts`
- Tests verify default behavior (empty config)
- Tests for configured links are implemented but skipped pending manual config
- Tests document expected behavior for all ACs
- Tests should pass when environment variables are properly set

**CI Requirements:**

- `npm run lint` must pass
- `npm run format` should be run before commit
- Playwright tests in `tests/sidebar/customFooterLinks.spec.ts` should pass when links are configured
- TypeScript compilation (`npx tsc --noEmit`) should succeed

**Manual QA Requirements:**

- All 7 acceptance criteria must be verified with video evidence
- Environment variable configuration method must be used for reproducibility
- Each AC should have clear before/after screenshots showing the feature
- Special focus on cross-context testing (facility, admin, organization)

**Known Limitations:**

- AC5 (Plugin integration) cannot be fully tested in live QA without a test plugin
- AC5 will be verified through code review instead of browser testing
- Environment variable must be set before server start (no hot reload)
- Vite server must be restarted to pick up env var changes

**Cleanup After QA:**

- Remove test i18n keys (`test_doc_link`, `test_admin_link`, etc.) from `public/locale/en.json`
- Remove or comment out `REACT_CUSTOM_FOOTER_LINKS` from `.env.test.local`
- Restart dev server to clear test configuration
