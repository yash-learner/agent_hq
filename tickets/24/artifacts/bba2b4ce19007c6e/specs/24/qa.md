# QA Report: Add support for inserting custom links in left navbar

## Critical Issues

**⚠️ No QA Plan Available**

This ticket lacks `spec.md` and `qa-plan.md` artifacts. Without a specification or planned acceptance criteria, systematic QA cannot be executed. All criteria below are marked `not-exercised` with `blocker_category: no-qa-plan`.

## What Was Implemented

Based on code review and commit message analysis:

- **Feature**: Custom footer navigation links in the left sidebar
- **Environment Config**: `REACT_NAVBAR_LINKS` JSON array support
- **Plugin Support**: `footerNavItems` in plugin manifests
- **Location**: Sidebar footer, before user menu
- **Behavior**: Opens in new tab with security attributes (`noopener noreferrer`)
- **Responsive**: Supports collapsed sidebar with tooltips
- **Files Modified**:
  - `care.config.ts` - Added `navbarLinks` configuration
  - `src/components/ui/sidebar/app-sidebar.tsx` - Integrated NavFooter component
  - `src/components/ui/sidebar/nav-footer.tsx` - New component rendering footer links
  - `src/hooks/useFooterNavLinks.ts` - Hook aggregating env + plugin links
  - `src/pluginTypes.ts` - Added `footerNavItems` to plugin manifest type

## Not Exercised

### env-config-links

**Title**: Custom links can be added via REACT_NAVBAR_LINKS environment variable

**Verdict**: `not-exercised`

**Reason**: No qa-plan.md provided. Cannot execute planned acceptance criteria without specification. The feature requires setting `REACT_NAVBAR_LINKS` environment variable with JSON array of link objects (format: `[{"name":"Documentation","url":"https://docs.example.com"}]`), but no acceptance criteria were defined for:
- Valid link format
- Link rendering in sidebar
- Link count limits
- JSON validation behavior
- Error handling for malformed JSON

**Blocker Category**: `no-qa-plan`

**Evidence**: N/A - no plan to execute

---

### plugin-footer-links

**Title**: Plugins can insert links via footerNavItems in manifest

**Verdict**: `not-exercised`

**Reason**: No qa-plan.md provided. Cannot verify plugin integration without:
- Specification of plugin manifest structure
- Expected plugin loading behavior
- Link ordering between env and plugin sources
- Acceptance criteria for plugin link rendering
- Test plugin with footerNavItems defined

**Blocker Category**: `no-qa-plan`

**Evidence**: N/A - no plan to execute

---

### sidebar-footer-rendering

**Title**: Links appear in sidebar footer before user menu

**Verdict**: `not-exercised`

**Reason**: No qa-plan.md provided. Cannot verify placement without defined acceptance criteria for:
- Visual location in sidebar footer
- Ordering relative to user menu
- Spacing and styling requirements
- Visibility across different screen sizes

**Blocker Category**: `no-qa-plan`

**Evidence**: N/A - no plan to execute

---

### external-link-behavior

**Title**: Links open in new tab with security attributes

**Verdict**: `not-exercised`

**Reason**: No qa-plan.md provided. Cannot verify link behavior without specification of:
- Expected `target="_blank"` behavior
- Security attributes (`rel="noopener noreferrer"`)
- Icon rendering (ExternalLink icon)
- Click behavior expectations

**Blocker Category**: `no-qa-plan`

**Evidence**: N/A - no plan to execute

---

### collapsed-sidebar-support

**Title**: Links support collapsed sidebar with tooltips

**Verdict**: `not-exercised`

**Reason**: No qa-plan.md provided. Cannot test responsive behavior without:
- Sidebar collapse interaction steps
- Tooltip appearance criteria
- Icon-only display requirements
- Expected tooltip content

**Blocker Category**: `no-qa-plan`

**Evidence**: N/A - no plan to execute

---

### no-links-null-render

**Title**: Component returns null when no links configured

**Verdict**: `not-exercised`

**Reason**: No qa-plan.md provided. Cannot verify default behavior without:
- Baseline state definition (no env var, no plugins)
- Expected DOM structure when empty
- No visual artifacts acceptance criteria

**Blocker Category**: `no-qa-plan`

**Evidence**: N/A - no plan to execute

---

## Code Inspection

While live-flow evidence is required for `pass` verdicts, code review reveals the implementation structure:

### Environment Configuration

`care.config.ts` defines:
```typescript
navbarLinks: env.REACT_NAVBAR_LINKS ? JSON.parse(env.REACT_NAVBAR_LINKS) : [],
```

Format: JSON string array of objects with `name` and `url` properties.

### Component Architecture

- `NavFooter` component filters links with `visibility !== false`
- `useFooterNavLinks` hook aggregates: `[...envLinks, ...pluginLinks]`
- Renders `SidebarMenuItem` with `SidebarMenuButton` for each link
- Uses `ExternalLink` icon from lucide-react as default
- Supports custom icons via link object `icon` property

### Plugin Integration

`pluginTypes.ts` adds `footerNavItems?: NavigationLink[]` to plugin manifest, allowing plugins to contribute footer navigation links alongside environment configuration.

## Limits

**Missing Artifacts**:
- `specs/24/spec.md` - No specification document
- `specs/24/qa-plan.md` - No QA plan with research map, test steps, or success signals

**Cannot Verify**:
- Acceptance criteria not defined
- User journeys not documented
- Success signals unknown
- Expected vs actual behavior comparison impossible
- Edge cases and error handling undefined

**Review Findings**:
The review identified formatting issues in test documentation but no functional defects. The should-fix items are documentation-only:
- `tests/PLAYWRIGHT_GUIDE.md:165-175` - Code examples need line breaks
- `tests/README.md:189` - Missing newline at EOF

## Summary

**All criteria: not-exercised** due to missing specification and QA plan. The implementation appears structurally sound based on code inspection, but without defined acceptance criteria, user journeys, and success signals, live-flow QA cannot validate that the feature meets requirements.

**Recommendation**: Generate `spec.md` with clear acceptance criteria, then `qa-plan.md` with UI traversal steps and success signals before attempting QA verification.
