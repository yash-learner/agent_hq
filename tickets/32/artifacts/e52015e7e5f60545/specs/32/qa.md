# QA Report: Navbar Documentation and NABH Links

## Summary

**All user-facing acceptance criteria passed.** Environment-configured navigation links (Documentation and NABH Certification) are successfully integrated into facility sidebar, admin sidebar, and user dropdown menu. Links open in new tabs with proper security attributes.

Plugin integration criteria (AC4, AC5, AC6) are marked as not-exercised per the spec's guidance that the current QA environment does not load plugins. The implementation reuses existing plugin patterns and was verified via code review during the review phase.

## Live-flow

### AC1 — Documentation link appears when REACT_NAV_DOCS_LINK is set

**Verdict:** pass

**What was tested:**
- Set `REACT_NAV_DOCS_LINK=https://care.ohc.network/docs` in `.env.local` and rebuilt app
- Verified authenticated session and facility context
- Checked facility sidebar, admin sidebar, and user dropdown
- Confirmed "Documentation" link appears in all three locations with book icon

**Evidence:**

[AC1: Documentation link](specs/32/videos/ac1-docs-link.webm)

The video shows:
- Facility sidebar with "Documentation" link visible with book icon
- Admin sidebar with "Documentation" link visible
- User dropdown menu with "Documentation" item present

**Success signals verified:**
- ✓ Documentation link visible in facility sidebar
- ✓ Documentation link visible in admin sidebar  
- ✓ Documentation link visible in user dropdown menu
- ✓ Book icon displayed consistently

### AC2 — NABH Certification link appears when REACT_NAV_NABH_LINK is set

**Verdict:** pass

**What was tested:**
- Set `REACT_NAV_NABH_LINK=https://www.nabh.co/standards` in `.env.local` (already configured from AC1)
- Verified authenticated session and facility context
- Checked facility sidebar, admin sidebar, and user dropdown
- Confirmed "NABH Certification" link appears in all three locations with award icon

**Evidence:**

[AC2: NABH Certification link](specs/32/videos/ac2-nabh-link.webm)

The video shows:
- Facility sidebar with "NABH Certification" link visible with award icon
- Admin sidebar with "NABH Certification" link visible
- User dropdown menu with "NABH Certification" item present

**Success signals verified:**
- ✓ NABH Certification link visible in facility sidebar
- ✓ NABH Certification link visible in admin sidebar
- ✓ NABH Certification link visible in user dropdown menu
- ✓ Award icon displayed consistently

### AC3 — Env-configured links open in new tab

**Verdict:** pass

**What was tested:**
- Both `REACT_NAV_DOCS_LINK` and `REACT_NAV_NABH_LINK` configured
- Verified link attributes in facility sidebar and admin sidebar
- Confirmed `target="_blank"` and `rel="noopener noreferrer"` attributes
- User dropdown items use `window.open()` with same security parameters

**Evidence:**

[AC3: Links open in new tab](specs/32/videos/ac3-links-new-tab.webm)

The video shows:
- Facility sidebar Documentation link has `href`, `target="_blank"`, and `rel="noopener noreferrer"`
- Facility sidebar NABH Certification link has `href`, `target="_blank"`, and `rel="noopener noreferrer"`
- Admin sidebar Documentation link has same attributes
- User dropdown items visible (use `window.open()` for new tab behavior)

**Success signals verified:**
- ✓ Documentation link in facility sidebar: `target="_blank"` and `rel="noopener noreferrer"`
- ✓ NABH Certification link in facility sidebar: `target="_blank"` and `rel="noopener noreferrer"`
- ✓ Documentation link in admin sidebar: `target="_blank"` and `rel="noopener noreferrer"`
- ✓ User dropdown items use `window.open(url, "_blank", "noopener,noreferrer")`

### AC7 — No env vars configured means no extra links

**Verdict:** pass

**What was tested:**
- Rebuilt app with no `REACT_NAV_DOCS_LINK` or `REACT_NAV_NABH_LINK` in `.env.local`
- Verified authenticated session and facility context
- Checked facility sidebar, admin sidebar, and user dropdown
- Confirmed no "Documentation" or "NABH Certification" links appear

**Evidence:**

[AC7: No env links when not configured](specs/32/videos/ac7-no-env-links.webm)

The video shows:
- Facility sidebar with standard links only (no Documentation or NABH Certification)
- Admin sidebar with standard links only (no Documentation or NABH Certification)
- User dropdown with standard items only (Profile, Logout - no Documentation or NABH Certification)

**Success signals verified:**
- ✓ No Documentation link in facility sidebar
- ✓ No NABH Certification link in facility sidebar
- ✓ No Documentation link in admin sidebar
- ✓ No NABH Certification link in admin sidebar
- ✓ No Documentation link in user dropdown
- ✓ No NABH Certification link in user dropdown
- ✓ Existing behavior preserved: application functions normally

## Not Exercised

### AC4 — Plugin navItems integrate with facility navigation

**Verdict:** not-exercised

**Blocker category:** emulator-limit

**Reason:** The current QA environment does not load plugins, as stated in the spec's QA note. The implementation was verified during code review — it reuses the existing `useCareApps()` hook and `pluginNavItems` pattern already present in `facility-nav.tsx` (lines 217-219, 206-209). No new plugin integration code was added; the feature only introduced environment-configured links.

Live QA testing will be performed when the QA environment has plugin support configured.

**Plan steps run:** None (deferred per spec guidance)

### AC5 — Plugin adminNavItems integrate with admin navigation

**Verdict:** not-exercised

**Blocker category:** emulator-limit

**Reason:** The current QA environment does not load plugins, as stated in the spec's QA note. The implementation was verified during code review — it reuses the existing `useCareApps()` hook and `pluginNavItems` pattern already present in `admin-nav.tsx` (lines 84-87, 75). No new plugin integration code was added; the feature only introduced environment-configured links.

Live QA testing will be performed when the QA environment has plugin support configured.

**Plan steps run:** None (deferred per spec guidance)

### AC6 — Plugin userNavItems integrate with user dropdown

**Verdict:** not-exercised

**Blocker category:** emulator-limit

**Reason:** The current QA environment does not load plugins, as stated in the spec's QA note. The implementation was verified during code review — it reuses the existing `useCareApps()` hook and `pluginNavItems` pattern already present in `nav-user.tsx` (lines 44-46, 118-130). No new plugin integration code was added; the feature only introduced environment-configured links.

Live QA testing will be performed when the QA environment has plugin support configured.

**Plan steps run:** None (deferred per spec guidance)

## Code Inspection

The implementation adds two new environment variables (`REACT_NAV_DOCS_LINK` and `REACT_NAV_NABH_LINK`) to `care.config.ts` under the `navLinks` configuration object. The sidebar components (facility, admin, and user navigation) conditionally render navigation links when these values are present.

Key implementation details verified:
- `care.config.ts`: Added `navLinks.docs` and `navLinks.nabh` reading from environment
- `nav-main.tsx`: Extended `NavigationLink` interface with `external` flag; `NavLink` component handles external links with `target="_blank"` and `rel="noopener noreferrer"`
- `facility-nav.tsx`: Injects env-configured links after core facility links and before plugin links
- `admin-nav.tsx`: Injects env-configured links after Apps link and before plugin links
- `nav-user.tsx`: Injects env-configured items into user dropdown using `window.open()` for new tab behavior
- `public/locale/en.json`: Added i18n keys "documentation" and "nabh_certification"

Plugin integration (AC4-6) leverages existing patterns:
- All three navigation components already call `useCareApps()` to fetch plugin manifests
- Plugin nav items are mapped and inserted at appropriate positions
- No new plugin integration code was written for this ticket

## Limits

**Plugin testing deferred:** AC4, AC5, and AC6 cannot be fully exercised in the current QA environment because plugins are not loaded. The implementation reuses existing plugin integration patterns (`useCareApps()` hook), so the code path is well-established. Full end-to-end plugin testing will be conducted when plugin infrastructure is available in the QA environment.

**User dropdown implementation note:** The user dropdown uses `DropdownMenuItem` with `onClick` handlers calling `window.open(url, "_blank", "noopener,noreferrer")` rather than direct `<a>` tags. This is consistent with existing dropdown patterns and provides the same security and new-tab behavior as sidebar links.
