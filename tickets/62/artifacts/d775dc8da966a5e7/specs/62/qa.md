# QA Report: Custom Sidebar Links

## Summary

All acceptance criteria could not be exercised via live application due to a technical blocker in the test environment. Chromium/Playwright consistently fails to connect to the preview server (`ERR_CONNECTION_REFUSED`) despite the server being accessible via curl and the backend API functioning normally. Multiple mitigation attempts were made including:
- Different base URLs (localhost, 127.0.0.1, container IP 172.17.0.2)
- Additional browser launch arguments (--no-sandbox, --disable-setuid-sandbox)
- Both headed and headless mode configurations

The implementation has been verified through code inspection, which confirms all structural requirements are met, but **code inspection cannot back a pass verdict**. All criteria are marked `not-exercised` with blocker category `app-not-loading`.

## Limits

### Environment Blocker: Browser Connectivity

The test environment exhibits a systematic networking issue where:
1. The Vite preview server starts successfully on port 4000
2. The backend API on port 9000 is accessible
3. curl can retrieve pages from the preview server
4. JWT token refresh succeeds (status 200)
5. **Chromium browser launched by Playwright cannot establish TCP connection to any tested address**

This is a container/network isolation issue, not an application defect. The following were attempted without success:
- `http://localhost:4000` → ERR_CONNECTION_REFUSED
- `http://127.0.0.1:4000` → ERR_CONNECTION_REFUSED  
- `http://172.17.0.2:4000` (container interface) → ERR_CONNECTION_REFUSED

Log excerpt from AC1 attempt:
```
[qa-auth] refreshJwt: status 200
[qa-auth] openAuthedContext: refresh ok=true status=200
[AC1] ERROR: page.goto: net::ERR_CONNECTION_REFUSED at http://172.17.0.2:4000/facility/...
```

### Plugin Testing Limitation

AC5 (plugin sidebar links) cannot be tested in this environment as noted in the QA plan — no plugin infrastructure is available in the test fixture environment. This is a known and expected limitation, not a defect.

## Live-flow

### AC1 — Custom links appear in sidebar footer via environment config

**Verdict:** `not-exercised`  
**Blocker:** Cannot load application in browser - Playwright Chromium repeatedly fails with ERR_CONNECTION_REFUSED when attempting to navigate to the preview server, despite server being accessible via curl. Attempted multiple base URLs (localhost, 127.0.0.1, 172.17.0.2) and browser configurations without success.  
**Blocker Category:** `app-not-loading`

**Plan steps attempted:**
1. ✓ Configured environment variable `REACT_CUSTOM_SIDEBAR_LINKS` in `.env.local`
2. ✓ Rebuilt application with `npm run build`
3. ✓ Started preview server (confirmed running via curl)
4. ✗ Browser navigation failed before authentication could be established

**Code inspection note (does not constitute pass):**
- `care.config.ts` lines 426-438 correctly parse `REACT_CUSTOM_SIDEBAR_LINKS` with error handling
- `src/components/ui/sidebar/custom-links.tsx` exists and implements rendering logic
- Integration in sidebar footer confirmed in code review

---

### AC2 — Links respect openInNewTab configuration

**Verdict:** `not-exercised`  
**Blocker:** Cannot load application in browser - same networking blocker as AC1. Unable to interact with links to verify target behavior.  
**Blocker Category:** `app-not-loading`

**Plan steps attempted:**
1. ✓ Configured test links with varying `openInNewTab` values
2. ✓ Rebuilt application  
3. ✓ Preview server running
4. ✗ Browser unable to reach application

**Code inspection note (does not constitute pass):**
- Lines 41-55 of `custom-links.tsx` implement distinct handling: external links use `window.open(url, "_blank", ...)` or `window.location.href`, internal links use `window.open(url, "_blank")` or `navigate(url)` based on `openInNewTab` boolean

---

### AC3 — External and internal links display correct icons

**Verdict:** `not-exercised`  
**Blocker:** Cannot load application in browser to observe icon rendering.  
**Blocker Category:** `app-not-loading`

**Code inspection note (does not constitute pass):**
- Lines 66-70 of `custom-links.tsx` conditionally render `ExternalLink` (lucide-react) for external type, `Link2` for internal type
- Icons have `aria-hidden="true"` for accessibility
- Icon size set to `size-4` (16px) for consistency

---

### AC4 — Links filter by sidebarContext

**Verdict:** `not-exercised`  
**Blocker:** Cannot navigate to different sidebar contexts (facility, admin, organization) to verify filtering behavior.  
**Blocker Category:** `app-not-loading`

**Code inspection note (does not constitute pass):**
- Lines 30-35 of `custom-links.tsx` implement filtering: links with no `contexts` or empty array appear everywhere; links with `contexts` array only appear when current context is included
- Early return (line 37-39) when no links match the context

---

### AC5 — Plugin sidebar links merge with environment links

**Verdict:** `not-exercised`  
**Blocker:** This criterion has dual blockers: (1) app-not-loading prevents any live testing, and (2) no plugin infrastructure exists in the test environment as documented in QA plan section for AC5. Plugin testing requires production environment with `REACT_ENABLED_APPS` configured and external plugin applications available.  
**Blocker Category:** `app-not-loading`

**Code inspection note (does not constitute pass):**
- Lines 24-28 of `custom-links.tsx` implement plugin link merging: `pluginLinks` extracted from `useCareApps()`, concatenated after `envLinks` to maintain ordering
- `src/pluginTypes.ts` line 210 adds `sidebarLinks?: import("@careConfig").SidebarLink[]` to `PluginManifest` interface
- Structural verification complete; functional verification requires plugin-enabled environment

---

### AC6 — Links maintain consistent ordering

**Verdict:** `not-exercised`  
**Blocker:** Cannot load application to verify visual link ordering.  
**Blocker Category:** `app-not-loading`

**Code inspection note (does not constitute pass):**
- Line 28: `allLinks` array spreads `envLinks` first, then `pluginLinks`, establishing ordering
- Lines 59-74: `filteredLinks.map()` preserves array order when rendering
- Key generation (line 60) uses index to maintain stable ordering

---

### AC7 — Links adapt to collapsed/expanded sidebar states

**Verdict:** `not-exercised`  
**Blocker:** Cannot interact with sidebar collapse/expand controls to verify responsive behavior.  
**Blocker Category:** `app-not-loading`

**Code inspection note (does not constitute pass):**
- Line 19: component consumes `open` and `isMobile` state from `useSidebar()` hook
- Line 64: tooltip only shown when sidebar closed (desktop) — `tooltip={open || isMobile ? undefined : link.label}`
- Line 71: label text only rendered when sidebar open or mobile — `{(open || isMobile) && <span>{link.label}</span>}`
- Icon always rendered (lines 66-70), ensuring icon-only mode in collapsed state

---

## Code inspection

All acceptance criteria are structurally implemented in the codebase with the expected React component patterns, TypeScript types, and configuration parsing. The implementation correctly handles:

1. Environment variable parsing with error handling and fallback
2. Icon differentiation (ExternalLink vs Link2)
3. Target behavior (_blank vs current window)
4. Context filtering with empty-array wildcard behavior
5. Plugin manifest extension and array concatenation ordering
6. Responsive sidebar state with conditional label/tooltip rendering

However, **code inspection alone cannot constitute a pass**. Live application verification is required and was blocked by the environment networking issue described above.

