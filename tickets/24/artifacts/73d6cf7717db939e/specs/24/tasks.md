# Implementation Tasks: Add support for inserting custom links in left navbar

## Overview

This ticket adds custom external link support to the left navigation sidebar through environment configuration and plugin manifests. All changes are frontend-only in the `yash-learner/care_fe_agent_hq` repository.

## Task 1: Implement custom footer navigation links

**Repository:** yash-learner/care_fe_agent_hq

**Size Estimate:** ~200-250 lines (within single-session limit)

**Dependencies:** None

**Acceptance Criteria Coverage:**
- ✅ AC1: Env-configured links render in sidebar footer
- ✅ AC2: Plugin manifest `footerNavItems` render in sidebar footer
- ✅ AC3: Multiple custom links render in order (env first, then plugins)
- ✅ AC4: External links open in new tab with security attributes
- ✅ AC5: Collapsed sidebar shows tooltips for footer links
- ✅ AC6: No custom links → no change to current behavior
- ✅ AC7: Links visible and clickable on mobile

**Changes Required:**

### 1. Configuration Layer (`care.config.ts`)
- Add `navbarLinks` property to parse `REACT_NAVBAR_LINKS` environment variable
- Follow existing pattern from `customShortcuts` (line 305)
- Type: `NavigationLink[]` from existing types
- Default to empty array when env var not set

**Lines:** ~5-10 lines

### 2. Plugin Type Extension (`src/pluginTypes.ts`)
- Extend `PluginManifest` type with optional `footerNavItems?: NavigationLink[]`
- Mirror existing plugin nav item types pattern (lines 206-209)

**Lines:** ~3 lines

### 3. Custom Hook (`src/hooks/useFooterNavLinks.ts`)
- Create new hook to aggregate footer links from env config and loaded plugins
- Use `useCareApps()` to get loaded plugins
- Extract `footerNavItems` from plugins using pattern from `nav-user.tsx:44-46`
- Return combined array: env links first, then plugin links
- Handle loading states

**Lines:** ~20-30 lines

### 4. Footer Navigation Component (`src/components/ui/sidebar/nav-footer.tsx`)
- Create new component using `NavMain` pattern adapted for footer
- Use `useFooterNavLinks()` hook to get aggregated links
- Render with `SidebarGroup`, `SidebarMenu`, `SidebarMenuItem`
- Use `ExternalLink` icon from `lucide-react` for all footer links
- Add `target="_blank"` and `rel="noopener noreferrer"` for external URLs
- Filter links where `visibility !== false`
- Support collapsed sidebar with tooltips
- Return `null` when no links to render (empty state)
- Follow styling from existing nav components (gray text, green hover)

**Lines:** ~80-100 lines

### 5. Sidebar Integration (`src/components/ui/sidebar/app-sidebar.tsx`)
- Import `NavFooter` component
- Insert `<NavFooter />` in `<SidebarFooter>` before user menu (lines 192-202)
- No conditional rendering needed (component handles empty state internally)

**Lines:** ~5-10 lines

### 6. Type Export (if needed)
- Ensure `NavigationLink` type is exported from `nav-main.tsx` for hook usage
- Check if already exported; add export if needed

**Lines:** ~1-2 lines

### Testing Verification Points

Manual testing should verify:
1. ✅ AC1: Set `REACT_NAVBAR_LINKS='[{"name":"Documentation","url":"https://docs.example.com"}]'` → link appears in sidebar footer
2. ✅ AC2: Plugin with `footerNavItems` → links appear alongside env links
3. ✅ AC3: Multiple links from both sources → correct ordering (env first, plugins second)
4. ✅ AC4: Click footer link → opens in new tab with correct security attributes
5. ✅ AC5: Collapse sidebar → hover footer link icon → tooltip shows name
6. ✅ AC6: No env config, no plugin links → footer shows only user menu (current behavior)
7. ✅ AC7: Open mobile view → footer links visible and clickable

### Code Quality Checks
- Run `npm run format` and `npm run lint-fix` on changed files
- Verify TypeScript types compile with `npx tsc --noEmit`
- Check that links follow existing navigation patterns
- Ensure accessibility (keyboard nav, focus states, aria-labels)

### Files to Create/Modify

**Create:**
- `src/hooks/useFooterNavLinks.ts` (~30 lines)
- `src/components/ui/sidebar/nav-footer.tsx` (~100 lines)

**Modify:**
- `care.config.ts` (~10 lines)
- `src/pluginTypes.ts` (~3 lines)
- `src/components/ui/sidebar/app-sidebar.tsx` (~5 lines)
- `src/components/ui/sidebar/nav-main.tsx` (~2 lines, if export needed)

**Total Estimate:** ~150 lines new + ~20 lines modified = ~170-200 lines

---

## Implementation Notes

### External Link Detection
All footer links are treated as external (since they're for documentation/certification):
- Use `target="_blank"` for new tab behavior
- Use `rel="noopener noreferrer"` for security
- Use `ExternalLink` icon to visually indicate external navigation

### Styling Consistency
Footer links use same styling as main nav items:
- Gray text with green hover (`text-gray-600 hover:text-green-700`)
- White background with shadow when active
- Consistent icon sizing and spacing
- Proper tooltip support in collapsed mode

### Empty State Behavior
When `useFooterNavLinks()` returns empty array, `NavFooter` component renders `null`, maintaining current behavior with only user menu visible.

### Mobile Responsiveness
Existing `SidebarFooter` component already handles mobile through shadcn/ui sidebar system. Footer links inherit this behavior automatically.

### Plugin Integration
Follow existing pattern from `nav-user.tsx` for extracting plugin nav items. The `useCareApps` hook provides loaded plugins with their manifests.

### Accessibility
- Footer links include proper `aria-label` or tooltip text
- Keyboard navigation works for all footer links
- External link indicator clear for screen readers
- Focus states visible and consistent

### i18n
Link names from env config and plugins are provided by admin/plugin author and not translated (matches `customShortcuts` pattern).

---

## Acceptance Criteria Mapping

| AC | Description | Covered by |
|----|-------------|------------|
| 1 | Env-configured links render in sidebar footer | Task 1: Config layer + hook + component |
| 2 | Plugin `footerNavItems` render in sidebar | Task 1: Plugin type + hook + component |
| 3 | Multiple links render in order (env, plugins) | Task 1: Hook ordering logic |
| 4 | External links open in new tab with security | Task 1: Component link attributes |
| 5 | Collapsed sidebar shows tooltips | Task 1: Component tooltip support |
| 6 | No links → no change (empty state) | Task 1: Component null return |
| 7 | Mobile links visible and clickable | Task 1: Inherited from SidebarFooter |

All acceptance criteria are covered by Task 1.
