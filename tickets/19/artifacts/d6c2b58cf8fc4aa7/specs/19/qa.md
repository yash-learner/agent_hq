# QA Report: Add support for inserting links in the left navbar

## Summary

**Status:** All acceptance criteria marked as `not-exercised` due to rendering/auth blocker.

During QA execution, the application loaded successfully but the facility sidebar failed to render despite valid auth state and correct URL navigation. The environment variable `REACT_NAV_LINKS` was properly configured and the application was rebuilt, but the sidebar element (`[data-sidebar="sidebar"]`) was not present in the DOM, preventing verification of custom link functionality.

**Blocker:** The sidebar component did not render during automated testing, making it impossible to verify custom navigation links. This appears to be an authentication state issue or a rendering problem specific to the automated browser context, as the page loads correctly but interactive elements do not appear.

## Limits

### Auth/Rendering Blocker

All acceptance criteria could not be exercised due to a fundamental rendering issue:

- Environment variable `REACT_NAV_LINKS` was set in `.env` with valid JSON configuration
- Application was rebuilt with `npm run build` to bake in environment variables
- Preview server started successfully on `http://localhost:4000`
- Auth state loaded from `tests/.auth/user.json`
- Page navigated to facility overview (`/facility/53bf3de7-2346-4343-8eba-8114c2f2f72d/overview`)
- Page URL correct, title "CARE" displayed
- **Blocker:** Sidebar element not visible/present in DOM
- Custom links could not be verified without sidebar rendering

### Attempted Solutions

1. **Rebuilt application** with environment variable in `.env` file
2. **Used valid auth state** from `tests/.auth/user.json` (setup-provided credentials)
3. **Verified backend connectivity** - backend running on port 9000
4. **Confirmed page loading** - correct URL, no redirect to login
5. **Multiple navigation attempts** - tried direct navigation and home-then-facility approaches
6. **Extended wait times** - allowed up to 5 seconds for DOM stabilization

Despite these attempts, the sidebar did not render in the automated browser context, preventing validation of the custom navigation links feature.

## Not Exercised

### AC1 — Custom links render in navbar alongside existing navigation

**Verdict:** `not-exercised`

**Blocker Category:** `auth-failure` / `navigation-mismatch`

**Reason:** The facility sidebar component did not render during test execution. While the page loaded with the correct URL and title, the sidebar element (`[data-sidebar="sidebar"]`) was not present in the DOM, making it impossible to verify that custom links from `REACT_NAV_LINKS` appeared in the navigation.

**Seed Attempt:**
- Method: `ui`
- Summary: Environment variable `REACT_NAV_LINKS` set with two test links (Documentation and Internal Link). Application rebuilt with `npm run build`. Auth state loaded from `tests/.auth/user.json`. Navigation to facility overview successful but sidebar did not render.

**Steps Attempted:**
1. Set `REACT_NAV_LINKS` environment variable in `.env`:
   ```json
   [{"name":"Documentation","url":"https://docs.care.ohc.network","icon":{"type":"lucide","icon":"ExternalLink"},"target":"_blank"},{"name":"Internal Link","url":"/custom-page"}]
   ```
2. Rebuilt application to bake in environment variables
3. Started preview server
4. Loaded auth state from `tests/.auth/user.json`
5. Navigated to `/facility/53bf3de7-2346-4343-8eba-8114c2f2f72d/overview`
6. **Blocker:** Sidebar did not render, could not verify custom links

[ac1-rendering-issue](specs/19/videos/ac1-custom-links-render.webm)

---

### AC2 — Links with target="_blank" open in new tab

**Verdict:** `not-exercised`

**Blocker Category:** `auth-failure`

**Reason:** Depends on AC1. Could not reach custom links to test `target="_blank"` behavior due to sidebar not rendering.

**Seed Attempt:**
- Method: `ui`
- Summary: Same environment variable configuration as AC1. Unable to interact with custom links due to sidebar rendering failure.

---

### AC3 — Links with icon display specified icon

**Verdict:** `not-exercised`

**Blocker Category:** `auth-failure`

**Reason:** Depends on AC1. Could not verify icon rendering (CareIcon vs Lucide vs default Avatar) due to sidebar not rendering.

**Seed Attempt:**
- Method: `none`
- Summary: Planned to set `REACT_NAV_LINKS` with different icon types after resolving AC1 rendering issue.

---

### AC4 — Links with visibility: false do not appear

**Verdict:** `not-exercised`

**Blocker Category:** `auth-failure`

**Reason:** Depends on AC1. Could not verify visibility filtering due to sidebar not rendering.

**Seed Attempt:**
- Method: `none`
- Summary: Planned to test with `visibility: false` configuration after resolving AC1 rendering issue.

---

### AC5 — Plugin and custom links render without conflicts

**Verdict:** `not-exercised`

**Blocker Category:** `auth-failure`

**Reason:** Depends on AC1. Could not verify coexistence of built-in, plugin, and custom links due to sidebar not rendering.

**Seed Attempt:**
- Method: `none`
- Summary: Planned to test with both `REACT_ENABLED_APPS` and `REACT_NAV_LINKS` set after resolving AC1 rendering issue.

---

### AC6 — Collapsed sidebar shows tooltip on hover

**Verdict:** `not-exercised`

**Blocker Category:** `auth-failure`

**Reason:** Depends on AC1. Could not test sidebar collapse/tooltip behavior due to sidebar not rendering.

**Seed Attempt:**
- Method: `none`
- Summary: Planned to collapse sidebar and verify tooltips after resolving AC1 rendering issue.

---

### AC7 — Invalid JSON logs error, app continues without custom links

**Verdict:** `not-exercised`

**Blocker Category:** `auth-failure`

**Reason:** While this acceptance criterion tests error handling (not sidebar rendering), verification requires checking the sidebar to confirm no custom links appear after invalid configuration. Due to the sidebar not rendering in the automated context, could not definitively verify the absence of custom links.

**Seed Attempt:**
- Method: `none`
- Summary: Planned to test with invalid JSON configurations (`malformed syntax`, `missing required fields`, `not an array`) and verify console errors plus absence of custom links in sidebar.

## Technical Investigation

### Environment Configuration

The implementation correctly reads `REACT_NAV_LINKS` from environment variables via `care.config.ts`:

```typescript
customNavLinks: parseCustomNavLinks(import.meta.env.REACT_NAV_LINKS)
```

The parsing function includes proper error handling for invalid JSON, missing required fields, and non-array values, logging descriptive console errors while allowing the app to continue.

### Code Review Observations

Based on review of `src/components/ui/sidebar/facility/facility-nav.tsx`:

1. **Custom link transformation** - `transformCustomLink()` converts `CustomNavLink` to `NavigationLink` format
2. **Icon resolution** - `resolveCustomLinkIcon()` handles both "care" and "lucide" icon types, with fallback to Avatar
3. **Visibility filtering** - Links with `visibility: false` are filtered out
4. **Integration point** - Custom links append after plugin links in the facility nav array
5. **Tooltip support** - `tooltip` prop passed to `SidebarMenuButton` for collapsed state

The implementation appears sound based on code inspection, but could not be verified through live-flow testing due to the rendering blocker.

### Attempted Debugging

- Verified page URL matches expected facility overview route
- Confirmed page title is "CARE" (not error page)
- Checked for login redirect (none detected)
- Verified backend API is running and responding
- Extended DOM stabilization waits up to 5 seconds
- Attempted both direct navigation and multi-step navigation (home → facility)
- Loaded auth state from setup-provided `tests/.auth/user.json`

Despite these efforts, the sidebar DOM element remained absent during automated browser execution.

## Next Steps

To unblock QA verification:

1. **Investigate auth token expiry** - The `tests/.auth/user.json` tokens may have expired (token generated during setup, QA run happening later)
2. **Manual browser testing** - Test in a live browser with fresh login to verify implementation works correctly
3. **Review sidebar rendering conditions** - Check if sidebar has conditional rendering based on user roles, permissions, or facility context
4. **Setup script enhancement** - Ensure setup generates fresh auth tokens before QA execution
5. **Alternative test approach** - Consider E2E tests that perform fresh login rather than relying on stored auth state

The implementation code appears correct based on review findings, and the environment variable configuration was properly set and rebuilt. The blocker appears to be environmental (auth/rendering) rather than a code defect.
