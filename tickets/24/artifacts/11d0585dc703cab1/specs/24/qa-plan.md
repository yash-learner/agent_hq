# QA Plan: Add support for inserting custom links in left navbar

## AC1 — Env-configured links render in sidebar footer

### Research map

- routes: Any sidebar page (e.g., `/facility/[facilityId]/`)
- components: `src/components/ui/sidebar/app-sidebar.tsx`, `src/components/ui/sidebar/nav-footer.tsx`
- i18n labels: N/A (link names from env config, not translated)
- auth/role: tests/.auth/user.json (any authenticated user)
- permissions / facility-scoped: No special permissions required
- fixtures needed: Seeded facility from load-fixtures

### Prerequisites

- Facility context active (any facility page)
- User authenticated

### Data setup

- Prefer fixtures: load-fixtures provides a facility; no additional data needed
- Environment configuration required:
  1. Stop the dev server if running: `Ctrl+C`
  2. Create/update `.env.local` with:
     ```
     REACT_NAVBAR_LINKS=[{"name":"Documentation","url":"https://docs.example.com"}]
     ```
  3. Restart dev server: `npm run dev`
  4. Wait for server to start (~10 seconds)

### Steps

1. **Action:** Navigate to any facility page (e.g., `/facility/[facilityId]/`)
   **Expect:** Sidebar is visible with footer section containing user menu
   **Record through:** yes

2. **Action:** Scroll to the bottom of the sidebar
   **Expect:** A "Documentation" link appears above the user menu with an external link icon
   **Record through:** yes

3. **Action:** Click the "Documentation" link
   **Expect:** New tab opens with https://docs.example.com (may show connection error, which is expected; verify URL in address bar)
   **Record through:** yes

### Success looks like

- Documentation link visible in sidebar footer above user menu
- Link opens in new tab (new browser tab appears)
- Address bar shows https://docs.example.com

---

## AC2 — Plugin manifest `footerNavItems` render in sidebar footer

### Research map

- routes: Any sidebar page
- components: `src/components/ui/sidebar/nav-footer.tsx`, `src/hooks/useFooterNavLinks.ts`
- auth/role: tests/.auth/user.json
- permissions / facility-scoped: No special permissions required
- fixtures needed: Seeded facility from load-fixtures

### Prerequisites

- Plugin with `footerNavItems` manifest must be loaded
- User authenticated

### Data setup

- This criterion requires a plugin with `footerNavItems` in its manifest
- Since the CARE FE repo doesn't include test plugins with this field by default:
  - **Option 1 (Recommended):** Manual verification through code review that the `useFooterNavLinks` hook correctly extracts `footerNavItems` from plugin manifests (pattern verified in implementation, follows `userNavItems` pattern from `nav-user.tsx:44-46`)
  - **Option 2:** If a test plugin is available, configure it via `REACT_ENABLED_APPS` and verify
- If no test plugin available, this criterion is verified through code review and integration test (AC3 will demonstrate the aggregation logic works)

### Steps

1. **Action:** If test plugin with `footerNavItems` is configured, navigate to any facility page
   **Expect:** Plugin footer links appear in sidebar footer
   **Record through:** if plugin available

### Success looks like

- Plugin-provided footer links visible in sidebar footer
- Links follow same styling as env-configured links

---

## AC3 — Multiple custom links render in order (env first, then plugins)

### Research map

- routes: Any sidebar page
- components: `src/hooks/useFooterNavLinks.ts` (ordering logic)
- auth/role: tests/.auth/user.json
- permissions / facility-scoped: No special permissions required
- fixtures needed: Seeded facility from load-fixtures

### Prerequisites

- Multiple links configured via env
- User authenticated

### Data setup

- Stop dev server if running
- Update `.env.local` with multiple links:
  ```
  REACT_NAVBAR_LINKS=[{"name":"Documentation","url":"https://docs.example.com"},{"name":"NABH","url":"https://nabh.example.com"},{"name":"Support","url":"https://support.example.com"}]
  ```
- Restart dev server: `npm run dev`

### Steps

1. **Action:** Navigate to any facility page
   **Expect:** Sidebar footer shows three custom links above user menu
   **Record through:** yes

2. **Action:** Verify the link order from top to bottom in the footer
   **Expect:** Links appear in order: Documentation, NABH, Support (same order as in env JSON)
   **Record through:** yes

3. **Action:** Click each link (Documentation, NABH, Support)
   **Expect:** Each opens in new tab with correct URL
   **Record through:** yes

### Success looks like

- Three custom links visible in sidebar footer
- Links appear in order matching env configuration
- All links open in new tabs

---

## AC4 — External links open in new tab with security attributes

### Research map

- routes: Any sidebar page
- components: `src/components/ui/sidebar/nav-footer.tsx` (line 44-49: `target="_blank"` and `rel="noopener noreferrer"`)
- auth/role: tests/.auth/user.json
- permissions / facility-scoped: No special permissions required
- fixtures needed: Seeded facility from load-fixtures

### Prerequisites

- At least one custom link configured via env
- User authenticated

### Data setup

- Use env config from AC1:
  ```
  REACT_NAVBAR_LINKS=[{"name":"Documentation","url":"https://docs.example.com"}]
  ```

### Steps

1. **Action:** Navigate to any facility page
   **Expect:** Sidebar footer shows Documentation link
   **Record through:** yes

2. **Action:** Right-click the Documentation link and select "Inspect" (or use browser DevTools)
   **Expect:** The `<a>` element has `target="_blank"` and `rel="noopener noreferrer"` attributes
   **Record through:** yes

3. **Action:** Click the Documentation link (normal left-click)
   **Expect:** Link opens in new tab (verify new tab appears with focus shift or new tab indicator)
   **Record through:** yes

### Success looks like

- Link element has correct security attributes in DOM inspection
- Link opens in new tab (not replacing current page)
- Browser tab count increases by 1

---

## AC5 — Collapsed sidebar shows tooltips for footer links

### Research map

- routes: Any sidebar page
- components: `src/components/ui/sidebar/nav-footer.tsx` (tooltip support via `SidebarMenuButton` tooltip prop)
- auth/role: tests/.auth/user.json
- permissions / facility-scoped: No special permissions required
- fixtures needed: Seeded facility from load-fixtures

### Prerequisites

- At least one custom link configured via env
- User authenticated
- Desktop view (sidebar collapse feature)

### Data setup

- Use env config from AC1:
  ```
  REACT_NAVBAR_LINKS=[{"name":"Documentation","url":"https://docs.example.com"}]
  ```

### Steps

1. **Action:** Navigate to any facility page
   **Expect:** Sidebar is visible in expanded state
   **Record through:** yes

2. **Action:** Click the sidebar collapse button (usually at top or bottom of sidebar)
   **Expect:** Sidebar collapses to icon-only mode, showing only icons
   **Record through:** yes

3. **Action:** Hover mouse over the Documentation link icon in the collapsed sidebar
   **Expect:** Tooltip appears showing "Documentation" text
   **Record through:** yes

### Success looks like

- Sidebar collapses to icon-only mode
- Footer link icon remains visible
- Tooltip displays link name on hover

---

## AC6 — No custom links → no change to current behavior

### Research map

- routes: Any sidebar page
- components: `src/components/ui/sidebar/nav-footer.tsx` (returns null when links empty)
- auth/role: tests/.auth/user.json
- permissions / facility-scoped: No special permissions required
- fixtures needed: Seeded facility from load-fixtures

### Prerequisites

- No custom links configured (default state)
- User authenticated

### Data setup

- Stop dev server if running
- Remove or comment out `REACT_NAVBAR_LINKS` from `.env.local`:
  ```
  # REACT_NAVBAR_LINKS=[...]
  ```
- Or ensure `.env.local` doesn't have `REACT_NAVBAR_LINKS` set
- Restart dev server: `npm run dev`

### Steps

1. **Action:** Navigate to any facility page
   **Expect:** Sidebar footer shows only user menu (no custom links visible)
   **Record through:** yes

2. **Action:** Verify sidebar footer contains only user menu section (username/avatar and logout button area)
   **Expect:** No additional links or sections appear above user menu
   **Record through:** yes

### Success looks like

- Sidebar footer shows only user menu
- No custom link section visible
- Behavior matches pre-feature state

---

## AC7 — Links visible and clickable on mobile

### Research map

- routes: Any sidebar page
- components: `src/components/ui/sidebar/app-sidebar.tsx` (mobile sidebar support inherited)
- auth/role: tests/.auth/user.json
- permissions / facility-scoped: No special permissions required
- fixtures needed: Seeded facility from load-fixtures

### Prerequisites

- At least one custom link configured via env
- User authenticated
- Mobile viewport or responsive mode

### Data setup

- Use env config from AC1:
  ```
  REACT_NAVBAR_LINKS=[{"name":"Documentation","url":"https://docs.example.com"}]
  ```

### Steps

1. **Action:** Navigate to any facility page in desktop view
   **Expect:** Sidebar visible with Documentation link
   **Record through:** yes

2. **Action:** Open browser DevTools and switch to mobile/responsive mode (e.g., iPhone viewport, width < 768px)
   **Expect:** Sidebar collapses to hamburger menu icon (mobile behavior)
   **Record through:** yes

3. **Action:** Click hamburger menu icon to open mobile sidebar
   **Expect:** Sidebar slides in from left showing navigation content
   **Record through:** yes

4. **Action:** Scroll to bottom of mobile sidebar
   **Expect:** Documentation link visible above user menu with same styling as desktop
   **Record through:** yes

5. **Action:** Click the Documentation link in mobile sidebar
   **Expect:** Link opens in new tab (or new window on mobile), mobile sidebar may close
   **Record through:** yes

### Success looks like

- Mobile sidebar opens/closes correctly
- Documentation link visible in mobile sidebar footer
- Link is tappable and opens in new tab
- Styling consistent with desktop view

---

## Test plan / notes

### Playwright E2E Coverage (not live QA criteria)

- Add E2E test in `tests/sidebar.spec.ts` or similar to verify:
  - NavFooter renders when env links configured
  - Links have correct `target` and `rel` attributes
  - Empty state (no links) renders nothing
  - Collapsed sidebar tooltip behavior
- Use environment variable mocking or test-specific config to set `REACT_NAVBAR_LINKS`

### CI Expectations

- `npm run lint` passes
- `npm run format` applied to all changed files
- `npx tsc --noEmit` type checks pass (ignoring pre-existing errors)
- Build succeeds: `npm run build`

### Manual Testing Checklist

- [ ] AC1: Env links render
- [ ] AC2: Plugin links render (if plugin available, else code review)
- [ ] AC3: Multiple links in correct order
- [ ] AC4: External link security attributes
- [ ] AC5: Collapsed sidebar tooltips
- [ ] AC6: Empty state (no links)
- [ ] AC7: Mobile responsiveness
- [ ] Keyboard navigation works for footer links
- [ ] Focus states visible
- [ ] Links don't break existing sidebar functionality

### Known Limitations

- Plugin testing (AC2) requires a plugin with `footerNavItems` in manifest; if unavailable, verify through code review and hook implementation pattern
- External URLs may show connection errors (expected if URLs don't exist)
- Mobile testing requires DevTools responsive mode or actual mobile device
