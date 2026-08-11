# QA Plan: Custom Links in Sidebar Footer

## AC1 — Custom footer links configured in care.config.ts appear in sidebar footer

### Research map

- routes: src/Routers/routes/ → /facility/:facilityId/* (facility sidebar)
- components: src/components/ui/sidebar/app-sidebar.tsx, footer-links.tsx
- i18n labels: "documentation", "support", "help", "resources", "external_link"
- auth/role: tests/.auth/user.json (any authenticated user)
- permissions / facility-scoped: no (sidebar feature, not facility-specific)
- fixtures needed: authenticated user (from load-fixtures)

### Prerequisites

- User must be logged in
- Application configured with custom footer links via environment variable

### Data setup

- Prefer fixtures: load-fixtures provides authenticated user (`admin`/`admin`)
- Environment configuration: Set `REACT_CUSTOM_FOOTER_LINKS` in `.env.local`
- Configuration format:
  ```json
  [
    {
      "name": "documentation",
      "url": "https://docs.example.com",
      "target": "_blank"
    },
    {
      "name": "support",
      "url": "/help",
      "target": "_self"
    }
  ]
  ```
- UI recipe:
  1. Edit `.env.local` file in project root
  2. Add line: `REACT_CUSTOM_FOOTER_LINKS='[{"name":"documentation","url":"https://docs.example.com","target":"_blank"},{"name":"support","url":"/help"}]'`
  3. Restart dev server: `npm run dev`
  4. Login at http://localhost:4000 with `admin`/`admin`

### Steps

1. **Action:** Open application at http://localhost:4000
   **Expect:** Login page displayed
   **Record through:** no

2. **Action:** Login with username `admin`, password `admin`
   **Expect:** Redirected to dashboard/facility page
   **Record through:** yes

3. **Action:** Observe the sidebar footer area above the user avatar dropdown
   **Expect:** Custom footer links "Documentation" and "Support" are visible with appropriate icons (ExternalLink for docs, ArrowRight for support)
   **Record through:** yes

### Success looks like

- Footer links render above the user avatar component
- Links display translated labels from i18n
- Icons indicate link type (external vs internal)

## AC2 — External links with target="_blank" open in new tab with external link icon

### Research map

- routes: N/A (external navigation)
- components: src/components/ui/sidebar/footer-links.tsx
- i18n labels: "documentation", "external_link"
- auth/role: tests/.auth/user.json
- permissions / facility-scoped: no
- fixtures needed: authenticated user

### Prerequisites

- User logged in
- Custom footer link with `target: "_blank"` configured

### Data setup

- Same as AC1 — ensure at least one link has `"target": "_blank"`
- Example: `{"name":"documentation","url":"https://docs.example.com","target":"_blank"}`

### Steps

1. **Action:** From logged-in state (continuing from AC1), locate the "Documentation" link in sidebar footer
   **Expect:** Link displays with ExternalLink icon (diagonal arrow pointing up-right)
   **Record through:** yes

2. **Action:** Inspect the link element (right-click → Inspect or browser dev tools)
   **Expect:** Link has attributes `target="_blank"` and `rel="noopener noreferrer"`
   **Record through:** yes

3. **Action:** Click the "Documentation" link
   **Expect:** New browser tab opens with the configured URL (https://docs.example.com or configured URL), original tab remains on the same page
   **Record through:** yes

### Success looks like

- ExternalLink icon displayed consistently for external links
- New tab opens without affecting current tab
- Security attributes present on external links

## AC3 — Internal links with target="_self" (or no target) navigate in current tab with internal route icon

### Research map

- routes: /help, /settings, or any internal route
- components: src/components/ui/sidebar/footer-links.tsx
- i18n labels: "support", "help"
- auth/role: tests/.auth/user.json
- permissions / facility-scoped: no
- fixtures needed: authenticated user

### Prerequisites

- User logged in
- Custom footer link with `target: "_self"` or no target specified

### Data setup

- Same as AC1 — ensure at least one link has `"target": "_self"` or omits target
- Example: `{"name":"support","url":"/help"}` (no target defaults to "_self")

### Steps

1. **Action:** From logged-in state, locate the "Support" link in sidebar footer
   **Expect:** Link displays with ArrowRight icon (right-pointing arrow)
   **Record through:** yes

2. **Action:** Note the current URL in the browser address bar
   **Expect:** URL is the current page (e.g., http://localhost:4000/)
   **Record through:** no

3. **Action:** Click the "Support" link
   **Expect:** Navigation occurs in the same tab/window to `/help` route (or configured route), no new tab opens
   **Record through:** yes

### Success looks like

- ArrowRight icon displayed for internal links
- Navigation occurs in same tab
- URL changes to configured route

## AC4 — Links with sidebarFor filter only display in matching sidebar types

### Research map

- routes: /facility/:facilityId/* (facility sidebar), /patients/:patientId/* (patient sidebar), /admin/* (admin sidebar)
- components: src/components/ui/sidebar/app-sidebar.tsx, footer-links.tsx
- i18n labels: "documentation", "support"
- auth/role: tests/.auth/user.json
- permissions / facility-scoped: yes (facility sidebar requires facility access)
- fixtures needed: facility from load-fixtures

### Prerequisites

- User logged in with facility access
- Custom footer links configured with `sidebarFor` filter

### Data setup

- Environment configuration with filtered links:
  ```json
  [
    {
      "name": "documentation",
      "url": "https://docs.example.com",
      "target": "_blank",
      "sidebarFor": ["facility"]
    },
    {
      "name": "support",
      "url": "/help",
      "sidebarFor": ["patient", "admin"]
    }
  ]
  ```
- UI recipe:
  1. Edit `.env.local`: `REACT_CUSTOM_FOOTER_LINKS='[{"name":"documentation","url":"https://docs.example.com","target":"_blank","sidebarFor":["facility"]},{"name":"support","url":"/help","sidebarFor":["patient","admin"]}]'`
  2. Restart dev server
  3. Login with `admin`/`admin`

### Steps

1. **Action:** From logged-in state, navigate to a facility page (e.g., click on a facility from dashboard or go to http://localhost:4000/facility/{facilityId})
   **Expect:** Facility sidebar is displayed
   **Record through:** yes

2. **Action:** Observe sidebar footer above user avatar
   **Expect:** Only "Documentation" link is visible (configured for facility sidebar)
   **Record through:** yes

3. **Action:** Navigate to a patient page (e.g., click on a patient or go to http://localhost:4000/patients/:patientId)
   **Expect:** Patient sidebar is displayed (different sidebar context)
   **Record through:** yes

4. **Action:** Observe sidebar footer above user avatar
   **Expect:** Only "Support" link is visible (configured for patient sidebar), "Documentation" link is NOT visible
   **Record through:** yes

5. **Action:** Navigate to admin page (e.g., go to http://localhost:4000/admin)
   **Expect:** Admin sidebar is displayed
   **Record through:** yes

6. **Action:** Observe sidebar footer above user avatar
   **Expect:** Only "Support" link is visible (configured for admin sidebar), "Documentation" link is NOT visible
   **Record through:** yes

### Success looks like

- Links filtered correctly by sidebar type
- Only matching links appear in each sidebar context
- Non-matching links are hidden

## AC5 — Plugin-provided footer links render alongside configured links

### Research map

- routes: Any route where plugin is active
- components: src/components/ui/sidebar/footer-links.tsx, src/pluginTypes.ts
- i18n labels: Plugin-defined labels
- auth/role: tests/.auth/user.json
- permissions / facility-scoped: depends on plugin
- fixtures needed: authenticated user, plugin loaded

### Prerequisites

- Plugin with `footerNavItems` defined must be installed and loaded
- User logged in

### Data setup

- **Note:** Plugin testing is not included in automated QA per ticket requirements
- This criterion documents expected behavior but will not be verified in live QA
- Plugin manifest example:
  ```typescript
  export const manifest: PluginManifest = {
    plugin: "test-plugin",
    footerNavItems: [
      {
        name: "plugin_link",
        url: "https://plugin.example.com",
        target: "_blank",
      },
    ],
  };
  ```

### Steps

**Manual verification only — not executed in automated QA**

1. Load a plugin with footerNavItems defined
2. Login to application
3. Observe sidebar footer
4. Verify plugin links render alongside config-based links

### Success looks like

- Plugin links merge with config links
- Both sources visible simultaneously
- Plugin links respect sidebarFor filtering

## AC6 — Links without sidebarFor appear in all sidebar types

### Research map

- routes: /facility/:facilityId/_, /patients/:patientId/_, /admin/*
- components: src/components/ui/sidebar/footer-links.tsx
- i18n labels: "help", "resources"
- auth/role: tests/.auth/user.json
- permissions / facility-scoped: no
- fixtures needed: authenticated user, facility

### Prerequisites

- User logged in with facility access
- Custom footer link without sidebarFor specified

### Data setup

- Environment configuration with unfiltered link:
  ```json
  [
    {
      "name": "help",
      "url": "/help"
    }
  ]
  ```
- UI recipe:
  1. Edit `.env.local`: `REACT_CUSTOM_FOOTER_LINKS='[{"name":"help","url":"/help"}]'`
  2. Restart dev server
  3. Login with `admin`/`admin`

### Steps

1. **Action:** From logged-in state, navigate to facility page
   **Expect:** Facility sidebar displayed with "Help" link visible in footer
   **Record through:** yes

2. **Action:** Navigate to patient page
   **Expect:** Patient sidebar displayed with "Help" link visible in footer
   **Record through:** yes

3. **Action:** Navigate to admin page
   **Expect:** Admin sidebar displayed with "Help" link visible in footer
   **Record through:** yes

### Success looks like

- Same link appears in all sidebar contexts
- No filtering applied when sidebarFor is omitted

## AC7 — Multiple custom footer links render in configured order with proper spacing

### Research map

- routes: /facility/:facilityId/* (any facility page)
- components: src/components/ui/sidebar/footer-links.tsx, src/components/ui/sidebar/
- i18n labels: "documentation", "support", "help", "resources"
- auth/role: tests/.auth/user.json
- permissions / facility-scoped: no
- fixtures needed: authenticated user, facility

### Prerequisites

- User logged in
- Multiple custom footer links configured

### Data setup

- Environment configuration with multiple links:
  ```json
  [
    {
      "name": "documentation",
      "url": "https://docs.example.com",
      "target": "_blank"
    },
    {
      "name": "support",
      "url": "https://support.example.com",
      "target": "_blank"
    },
    {
      "name": "help",
      "url": "/help"
    },
    {
      "name": "resources",
      "url": "/resources"
    }
  ]
  ```
- UI recipe:
  1. Edit `.env.local`: `REACT_CUSTOM_FOOTER_LINKS='[{"name":"documentation","url":"https://docs.example.com","target":"_blank"},{"name":"support","url":"https://support.example.com","target":"_blank"},{"name":"help","url":"/help"},{"name":"resources","url":"/resources"}]'`
  2. Restart dev server
  3. Login with `admin`/`admin`

### Steps

1. **Action:** From logged-in state, navigate to a facility page
   **Expect:** Facility sidebar displayed
   **Record through:** yes

2. **Action:** Observe the sidebar footer above user avatar
   **Expect:** Four links visible in order: "Documentation", "Support", "Help", "Resources"
   **Record through:** yes

3. **Action:** Inspect spacing between links and between links and user avatar
   **Expect:** Consistent spacing between links (SidebarMenu default spacing), clear separation from user avatar component
   **Record through:** yes

4. **Action:** Verify visual hierarchy of links
   **Expect:** Links styled consistently with standard sidebar menu items (hover states, font size, icon positioning)
   **Record through:** yes

### Success looks like

- All configured links render in specified order
- Visual consistency with existing sidebar navigation
- Clear separation between footer links and user avatar
- Hover states and interactions match sidebar patterns

## Test plan / notes

### Playwright E2E Coverage

- Add test file: `tests/sidebar/custom-footer-links.spec.ts`
- Test cases:
  1. Footer links render with config
  2. External links open in new tab
  3. Internal links navigate in same tab
  4. Sidebar type filtering works correctly
  5. Links without sidebarFor appear in all sidebars
  6. Multiple links render in order
- Use `beforeEach` to set up config via environment or mock
- Use `page.goto()` to navigate between sidebar contexts
- Use `page.locator()` to find footer link elements
- Use `page.click()` and `expect(page).toHaveURL()` for navigation tests
- Use `page.waitForEvent('popup')` for new tab tests

### CI Requirements

- All Playwright tests must pass
- Build must succeed without errors
- ESLint must pass without new violations
- TypeScript compilation must succeed

### Plugin Testing (Manual Only)

- Plugin footer links cannot be tested in automated QA
- Manual verification required with actual plugin installed
- Test plugin manifest with footerNavItems defined
- Verify merging behavior with config links

### Accessibility Checks

- External links have `rel="noopener noreferrer"`
- External links have `aria-label` indicating new tab
- Keyboard navigation works (Tab, Enter)
- Icon + text provide clear affordance
- Tooltip in collapsed sidebar state

### Edge Cases

- Empty config array → no errors, no links rendered
- Invalid JSON in config → graceful fallback
- Missing i18n keys → display raw key value
- Very long link names → truncate with ellipsis
- Many links (>10) → scrollable footer if needed
