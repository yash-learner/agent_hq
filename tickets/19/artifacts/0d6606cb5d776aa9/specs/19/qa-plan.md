# QA Plan: Add support for inserting links in the left navbar

## AC1 — Custom links render in navbar alongside existing navigation

### Research map

- routes: `/facility/:facilityId/*` (facility context)
- components: `src/components/ui/sidebar/facility/facility-nav.tsx`, `src/components/ui/sidebar/nav-main.tsx`
- i18n labels: N/A (custom link names come from env config)
- auth/role: `tests/.auth/user.json` (admin user)
- permissions: No special permissions required
- facility-scoped: Yes
- fixtures needed: Facility from load-fixtures

### Prerequisites

- Logged in as admin user (`tests/.auth/user.json`)
- Facility context active (any facility from fixtures)

### Data setup

- Set environment variable before starting the app:
  ```bash
  export REACT_NAV_LINKS='[{"name":"Documentation","url":"https://docs.care.ohc.network","icon":{"type":"lucide","icon":"ExternalLink"},"target":"_blank"},{"name":"Internal Link","url":"/custom-page"}]'
  ```
- Restart the app to pick up the new environment variable

### Steps

1. **Action:** Navigate to any facility page (e.g., `/facility/{facilityId}/overview`)
   **Expect:** Facility sidebar is visible on the left
   **Record through:** yes

2. **Action:** Scroll through the facility sidebar navigation items
   **Expect:**
   - Two custom links appear in the sidebar: "Documentation" and "Internal Link"
   - Custom links appear after all built-in navigation items (Overview, Appointments, Patients, Services, etc.)
   - "Documentation" link has an ExternalLink icon (Lucide)
   - "Internal Link" appears without a custom icon (shows default Avatar with "I")
     **Record through:** yes

### Success looks like

- Custom links visible in facility sidebar
- Custom links positioned after built-in navigation items
- Icons render correctly where specified

---

## AC2 — Links with target="_blank" open in new tab

### Research map

- routes: `/facility/:facilityId/*` (facility context)
- components: `src/components/ui/sidebar/facility/facility-nav.tsx`, `src/components/ui/sidebar/nav-main.tsx`
- i18n labels: N/A
- auth/role: `tests/.auth/user.json` (admin user)
- permissions: No special permissions required
- facility-scoped: Yes
- fixtures needed: Facility from load-fixtures

### Prerequisites

- Logged in as admin user (`tests/.auth/user.json`)
- Facility context active
- REACT_NAV_LINKS environment variable set with a link that has `target="_blank"`

### Data setup

- Same as AC1 (Documentation link has `target="_blank"`)

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/overview`
   **Expect:** Facility sidebar visible with custom links
   **Record through:** yes

2. **Action:** Right-click on the "Documentation" link in the sidebar
   **Expect:** Browser context menu appears with "Open in new tab" option
   **Record through:** yes

3. **Action:** Click the "Documentation" link
   **Expect:**
   - Link opens in a new browser tab
   - Original CARE tab remains on the facility overview page
     **Record through:** yes

### Success looks like

- External link opens in new tab
- Original tab stays on current page
- Browser treats link as target="_blank"

---

## AC3 — Links with icon display specified icon

### Research map

- routes: `/facility/:facilityId/*` (facility context)
- components: `src/components/ui/sidebar/facility/facility-nav.tsx`, icon resolution in `resolveCustomLinkIcon()`
- i18n labels: N/A
- auth/role: `tests/.auth/user.json` (admin user)
- permissions: No special permissions required
- facility-scoped: Yes
- fixtures needed: Facility from load-fixtures

### Prerequisites

- Logged in as admin user (`tests/.auth/user.json`)
- Facility context active

### Data setup

- Set environment variable with links using different icon types:
  ```bash
  export REACT_NAV_LINKS='[{"name":"CareIcon Example","url":"/test1","icon":{"type":"care","icon":"d-hospital"}},{"name":"Lucide Example","url":"/test2","icon":{"type":"lucide","icon":"BookOpen"}},{"name":"No Icon","url":"/test3"}]'
  ```
- Restart the app

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/overview`
   **Expect:** Facility sidebar visible
   **Record through:** yes

2. **Action:** Locate the three custom links in the sidebar: "CareIcon Example", "Lucide Example", "No Icon"
   **Expect:**
   - "CareIcon Example" displays the d-hospital CareIcon (hospital building icon)
   - "Lucide Example" displays the BookOpen Lucide icon (open book icon)
   - "No Icon" displays a default Avatar with the letter "N"
     **Record through:** yes

### Success looks like

- CareIcon renders correctly for `type: "care"`
- Lucide icon renders correctly for `type: "lucide"`
- Default Avatar appears when no icon specified

---

## AC4 — Links with visibility: false do not appear

### Research map

- routes: `/facility/:facilityId/*` (facility context)
- components: `src/components/ui/sidebar/facility/facility-nav.tsx`, `src/components/ui/sidebar/nav-main.tsx` (visibility filtering)
- i18n labels: N/A
- auth/role: `tests/.auth/user.json` (admin user)
- permissions: No special permissions required
- facility-scoped: Yes
- fixtures needed: Facility from load-fixtures

### Prerequisites

- Logged in as admin user (`tests/.auth/user.json`)
- Facility context active

### Data setup

- Set environment variable with visible and hidden links:
  ```bash
  export REACT_NAV_LINKS='[{"name":"Visible Link","url":"/visible"},{"name":"Hidden Link","url":"/hidden","visibility":false},{"name":"Another Visible","url":"/visible2"}]'
  ```
- Restart the app

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/overview`
   **Expect:** Facility sidebar visible
   **Record through:** yes

2. **Action:** Scroll through all navigation items in the facility sidebar
   **Expect:**
   - "Visible Link" appears in the sidebar
   - "Another Visible" appears in the sidebar
   - "Hidden Link" does NOT appear anywhere in the sidebar
     **Record through:** yes

3. **Action:** Use browser DevTools to search page source for "Hidden Link"
   **Expect:** Text "Hidden Link" does not appear in rendered DOM
   **Record through:** no

### Success looks like

- Only links with `visibility: true` or unspecified visibility render
- Links with `visibility: false` are completely filtered out

---

## AC5 — Plugin and custom links render without conflicts

### Research map

- routes: `/facility/:facilityId/*` (facility context)
- components: `src/components/ui/sidebar/facility/facility-nav.tsx` (plugin and custom link injection)
- i18n labels: N/A
- auth/role: `tests/.auth/user.json` (admin user)
- permissions: No special permissions required
- facility-scoped: Yes
- fixtures needed: Facility from load-fixtures

### Prerequisites

- Logged in as admin user (`tests/.auth/user.json`)
- Facility context active
- Plugin apps configured via REACT_ENABLED_APPS (if available)

### Data setup

- Set both plugin apps and custom nav links:
  ```bash
  export REACT_ENABLED_APPS="ohcnetwork/care_teleicu_devices_fe@localhost:10120"
  export REACT_NAV_LINKS='[{"name":"Custom Link 1","url":"/custom1"},{"name":"Custom Link 2","url":"/custom2"}]'
  ```
- Restart the app
- Note: If plugin apps are not configured or not loading, this criterion validates that custom links still render correctly alongside built-in links

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/overview`
   **Expect:** Facility sidebar visible
   **Record through:** yes

2. **Action:** Scroll through all navigation items in the sidebar from top to bottom
   **Expect:**
   - Built-in links appear first (Overview, Appointments, Queues, Patients, Services, etc.)
   - Plugin links appear after built-in links (if plugins are configured and loaded)
   - Custom links "Custom Link 1" and "Custom Link 2" appear after plugin links (or after built-in links if no plugins)
   - No duplicate links
   - No missing standard navigation items
     **Record through:** yes

### Success looks like

- All three types of links coexist: built-in, plugin, custom
- Render order: built-in → plugin → custom
- No conflicts or missing items

---

## AC6 — Collapsed sidebar shows tooltip on hover

### Research map

- routes: `/facility/:facilityId/*` (facility context)
- components: `src/components/ui/sidebar/nav-main.tsx` (tooltip prop on SidebarMenuButton)
- i18n labels: N/A
- auth/role: `tests/.auth/user.json` (admin user)
- permissions: No special permissions required
- facility-scoped: Yes
- fixtures needed: Facility from load-fixtures

### Prerequisites

- Logged in as admin user (`tests/.auth/user.json`)
- Facility context active

### Data setup

- Set environment variable with custom links:
  ```bash
  export REACT_NAV_LINKS='[{"name":"Documentation Portal","url":"https://docs.example.com","target":"_blank"}]'
  ```
- Restart the app

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/overview`
   **Expect:** Facility sidebar visible in expanded state
   **Record through:** yes

2. **Action:** Click the sidebar collapse button (typically a chevron or hamburger icon at the top of the sidebar)
   **Expect:** Sidebar collapses to show only icons, link names hidden
   **Record through:** yes

3. **Action:** Hover mouse over the custom "Documentation Portal" link icon in the collapsed sidebar
   **Expect:**
   - Tooltip appears showing "Documentation Portal"
   - Tooltip positioned near the icon
     **Record through:** yes

4. **Action:** Hover over several built-in navigation link icons (e.g., Overview, Patients)
   **Expect:** Tooltips appear for built-in links as well (confirming tooltip behavior is consistent)
   **Record through:** yes

### Success looks like

- Collapsed sidebar displays only icons
- Tooltip shows link name on hover
- Custom links behave identically to built-in links

---

## AC7 — Invalid JSON logs error, app continues without custom links

### Research map

- routes: N/A (config parsing, no UI validation needed)
- components: `care.config.ts` (customNavLinks parsing)
- i18n labels: N/A
- auth/role: `tests/.auth/user.json` (admin user)
- permissions: No special permissions required
- facility-scoped: No (app-level config)
- fixtures needed: None

### Prerequisites

- Logged in as admin user (`tests/.auth/user.json`)

### Data setup

- Test Case 1: Invalid JSON syntax

  ```bash
  export REACT_NAV_LINKS='[{"name":"Test","url":"/test"'  # Missing closing brackets
  ```

- Test Case 2: Missing required fields

  ```bash
  export REACT_NAV_LINKS='[{"name":"Test"}]'  # Missing "url" field
  ```

- Test Case 3: Not an array

  ```bash
  export REACT_NAV_LINKS='{"name":"Test","url":"/test"}'  # Object instead of array
  ```

- Restart the app after setting each test case

### Steps (Test Case 1: Invalid JSON)

1. **Action:** Open browser DevTools Console tab before loading the app
   **Expect:** Console is visible
   **Record through:** no

2. **Action:** Navigate to the app homepage or any facility page
   **Expect:**
   - App loads successfully (not broken)
   - Console shows error message: "REACT_NAV_LINKS parse error: [error details] App will continue without custom navigation links."
     **Record through:** yes

3. **Action:** Navigate to `/facility/{facilityId}/overview` and check the sidebar
   **Expect:**
   - No custom links appear in the sidebar
   - All built-in navigation items render normally
     **Record through:** yes

### Steps (Test Case 2: Missing required fields)

1. **Action:** Set REACT_NAV_LINKS with missing required field, restart app, open Console
   **Expect:** Console visible
   **Record through:** no

2. **Action:** Load the app
   **Expect:**
   - App loads successfully
   - Console shows error: "REACT_NAV_LINKS: Each link requires 'name' and 'url' fields (non-empty strings). App will continue without custom navigation links."
     **Record through:** yes

3. **Action:** Check facility sidebar
   **Expect:** No custom links, built-in links render normally
   **Record through:** yes

### Steps (Test Case 3: Not an array)

1. **Action:** Set REACT_NAV_LINKS with object instead of array, restart app, open Console
   **Expect:** Console visible
   **Record through:** no

2. **Action:** Load the app
   **Expect:**
   - App loads successfully
   - Console shows error: "REACT_NAV_LINKS must be a JSON array. App will continue without custom navigation links."
     **Record through:** yes

3. **Action:** Check facility sidebar
   **Expect:** No custom links, built-in links render normally
   **Record through:** yes

### Success looks like

- Invalid config logs appropriate console error
- App does not crash or break
- Sidebar continues to function with built-in links only
- Error messages are descriptive and helpful

---

## Test plan / notes

### Playwright E2E Coverage

The implementation should include Playwright tests covering:

- Custom link rendering with various icon types (CareIcon, Lucide, none)
- Links with `target="_blank"` have correct attribute in DOM
- Links with `visibility: false` are filtered from render
- Config parsing with invalid JSON returns empty array
- Config parsing with missing required fields returns empty array

### CI Requirements

- CI must pass all existing tests
- TypeScript compilation must succeed
- ESLint must pass without new warnings

### Manual Testing Considerations

- Test with different facility contexts to ensure baseUrl prefixing works
- Test with both relative and absolute URLs
- Test nested children links (not explicitly required by spec but supported)
- Test sidebar collapse/expand transitions with custom links
- Verify no console errors on happy path with valid config
