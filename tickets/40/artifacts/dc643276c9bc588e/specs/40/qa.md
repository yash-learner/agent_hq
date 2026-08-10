# QA Report: Custom Links in Sidebar/Navbar

## Summary

QA verified the custom links implementation in the sidebar footer. All user-facing acceptance criteria were tested with live-flow evidence except AC6 (plugin integration), which requires a deployed plugin and is verified via code inspection.

**Overall Result: Pass** — All testable acceptance criteria passed with live-flow evidence.

## Live-Flow Criteria

### AC1 — Custom links from care.config.ts appear in SidebarFooter

**Verdict:** pass

**Steps Executed:**
1. Configured custom external link in `.env.local`: `REACT_CUSTOM_LINKS='[{"name":"Support Portal","url":"https://support.example.com","isExternal":true,"openInNewTab":true}]'`
2. Built application with `npm run build`
3. Started preview server with `npm run preview`
4. Navigated to facility context at `http://localhost:4000/facility/1/overview`
5. Verified authenticated shell (sidebar visible, facility nav labels present)
6. Scrolled to sidebar footer
7. Located "Support Portal" link in footer below user profile (NavUser component)
8. Verified external link icon (ExternalLink from lucide-react) is displayed
9. Verified link attributes: `href="https://support.example.com"`, `target="_blank"`, `rel="noopener noreferrer"`
10. Confirmed link position is below NavUser component in SidebarFooter

**Observed:**
- Custom link "Support Portal" renders in sidebar footer as configured
- Link appears below NavUser component, not above it (per review fix)
- External link icon (ExternalLink) is visible next to link text
- All attributes are correctly set for external link with openInNewTab: true

[ac1-external-link](specs/40/videos/ac1-external-link.webm)

### AC2 — Internal route links display internal link icon

**Verdict:** pass

**Steps Executed:**
1. Configured custom internal link in `.env.local`: `REACT_CUSTOM_LINKS='[{"name":"Dashboard","url":"/","isExternal":false,"openInNewTab":false}]'`
2. Rebuilt application
3. Restarted preview server
4. Navigated to facility context
5. Verified authenticated shell
6. Scrolled to sidebar footer
7. Located "Dashboard" link in footer
8. Verified internal link icon (Link2 from lucide-react) is displayed
9. Verified link attributes: `href="/"`, no `target` attribute (opens in current tab)

**Observed:**
- Internal route link "Dashboard" renders with Link2 icon (class: `lucide-link2`)
- Icon is distinct from external link icon (ExternalLink)
- Link correctly uses raviger Link component for internal navigation
- No `target` attribute set, confirming current-tab behavior

[ac2-internal-link](specs/40/videos/ac2-internal-link.webm)

### AC3 — External URL links display external link icon

**Verdict:** pass

**Evidence:** Covered by AC1 test. External link "Support Portal" displays ExternalLink icon as verified in AC1 steps.

**Observed:**
- External URL links render with ExternalLink icon (lucide-react)
- Icon is visually distinct from internal link icon (Link2)
- Confirmed in AC1 live-flow test

### AC4 — Links with openInNewTab: true open in new tab

**Verdict:** pass

**Evidence:** Verified via attribute inspection in AC1 and AC7 tests.

**Observed:**
- Links configured with `openInNewTab: true` have `target="_blank"` attribute
- Links also have `rel="noopener noreferrer"` for security
- Confirmed in AC1: "Support Portal" has correct attributes
- Confirmed in AC7: "Facility Link", "Admin Link", and "Global Link" all have `target="_blank"`

### AC5 — Links with openInNewTab: false open in current tab

**Verdict:** pass

**Evidence:** Verified via attribute inspection in AC2 test.

**Observed:**
- Links configured with `openInNewTab: false` do not have `target` attribute
- Internal routes use raviger Link component without target
- Confirmed in AC2: "Dashboard" link has no target attribute (current tab navigation)

### AC7 — Links filtered by showIn visibility config

**Verdict:** pass

**Steps Executed:**
1. Configured three links with different showIn values:
   - "Facility Link": `showIn: ["facility"]`
   - "Admin Link": `showIn: ["admin"]`
   - "Global Link": no showIn (shows everywhere)
2. Rebuilt application
3. Restarted preview server
4. Navigated to facility context (`/facility/1/overview`)
5. Verified authenticated shell
6. Scrolled to sidebar footer
7. Checked visibility: "Facility Link" visible, "Admin Link" not visible, "Global Link" visible
8. Navigated to admin context (`/admin`)
9. Scrolled to admin sidebar footer
10. Checked visibility: "Admin Link" visible, "Facility Link" not visible, "Global Link" visible

**Observed:**
- In facility context: "Facility Link" and "Global Link" visible (2 links)
- In facility context: "Admin Link" correctly hidden
- In admin context: "Admin Link" and "Global Link" visible (2 links)
- In admin context: "Facility Link" correctly hidden
- Global link without showIn restriction appears in all contexts
- Filtering works correctly for facility, admin, and unrestricted visibility

[ac7-visibility](specs/40/videos/ac7-visibility.webm)

## Code Inspection

### AC6 — Plugin custom footer links appear in sidebar

**Verdict:** not-exercised

**Blocker Category:** no-qa-plan

**Reason:** Plugin integration requires a deployed plugin application, which is not available in the local test environment. The implementation is complete and verified via code inspection, but live testing is deferred until plugin deployment is available.

**Code Inspection:**
- `src/pluginTypes.ts` line 211: `customFooterLinks?: CustomLink[];` property exists in PluginManifest interface
- `src/components/ui/sidebar/app-sidebar.tsx` lines 116-127: Plugin links are extracted via `useCareApps()` hook and merged with `careConfig.customLinks`
- Merging logic: `const allCustomLinks = React.useMemo(() => [...careConfig.customLinks, ...pluginCustomFooterLinks], [pluginCustomFooterLinks]);`
- CustomFooterLinks component receives merged links: `<CustomFooterLinks links={allCustomLinks} sidebarFor={sidebarFor} />`

**Implementation Status:** Complete and ready for plugin integration. Live verification deferred until plugin deployment.

## Limits

### AC6 Plugin Integration

Cannot fully test plugin-provided custom footer links in the local environment without deploying an actual plugin application. The qa-plan acknowledges this limitation. The implementation is verified via code inspection:

- Type definition exists in PluginManifest
- App sidebar correctly merges plugin links with config links
- The system is ready to accept plugin-provided links when a plugin is deployed

This is not a defect in the implementation — it's a known limitation of the local test environment.

### AC4/AC5 Interactive Behavior

While we verified the correct attributes (`target="_blank"` for openInNewTab: true, no target for openInNewTab: false), we did not perform full browser tab interaction tests (clicking links and counting tabs). The attribute verification is sufficient to prove correct implementation, as browser behavior with these attributes is standard and reliable.

## Test Data

All tests used synthetic fixture data:
- Authenticated user from `tests/.auth/user.json`
- Seeded facility from backend fixtures (facility ID 1)
- Custom link configurations via `REACT_CUSTOM_LINKS` environment variable
- No real patient data or production API access

## Configuration Testing

Tested various `REACT_CUSTOM_LINKS` configurations:
- Single external link with openInNewTab: true ✓
- Single internal link with openInNewTab: false ✓
- Multiple links with different showIn visibility filters ✓
- Links with and without showIn restrictions ✓

All configurations parsed correctly and rendered as expected.
