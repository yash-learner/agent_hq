# Implementation Plan: Add support for inserting custom links in left navbar

## Overview

Add functionality to insert custom external links (documentation, NABH certification) into the left navigation sidebar through environment configuration and plugin manifests. Custom links will appear in the sidebar footer, before the user menu, maintaining existing navigation patterns while enabling deployment-specific extensibility.

## Repositories

- **yash-learner/care_fe_agent_hq** (frontend) — All changes are frontend-only

## Architecture

### 1. Configuration Layer (`care.config.ts`)

Add `navbarLinks` property to parse `REACT_NAVBAR_LINKS` environment variable:

```typescript
navbarLinks: env.REACT_NAVBAR_LINKS 
  ? JSON.parse(env.REACT_NAVBAR_LINKS) as NavigationLink[]
  : [],
```

This follows the existing pattern for `customShortcuts` (line 305) which also parses a JSON array from env.

### 2. Plugin Manifest Extension (`src/pluginTypes.ts`)

Extend `PluginManifest` type with `footerNavItems`:

```typescript
export type PluginManifest = {
  // ... existing fields
  footerNavItems?: NavigationLink[];
};
```

This mirrors existing plugin nav item types: `navItems`, `billingNavItems`, `userNavItems`, `adminNavItems` (lines 206-209).

### 3. Custom Footer Links Hook (`src/hooks/useFooterNavLinks.ts`)

Create a new hook to aggregate footer links from env config and loaded plugins:

```typescript
export const useFooterNavLinks = (): NavigationLink[] => {
  const careApps = useCareApps();
  const envLinks = careConfig.navbarLinks;
  
  const pluginLinks = careApps.flatMap((app) =>
    !app.isLoading && app.footerNavItems ? app.footerNavItems : []
  );
  
  return [...envLinks, ...pluginLinks];
};
```

This follows the pattern from `nav-user.tsx:44-46` for extracting plugin nav items.

### 4. Footer Navigation Component (`src/components/ui/sidebar/nav-footer.tsx`)

Create a new component to render custom footer links using the `NavMain` pattern but adapted for footer context:

- Uses `SidebarGroup` with custom styling for footer placement
- Supports external links with `target="_blank"` and `rel="noopener noreferrer"`
- Handles collapsed sidebar state with tooltips
- Uses `ExternalLink` icon for all footer links (since they're external by nature)
- Filters links where `visibility !== false`

### 5. Sidebar Integration (`src/components/ui/sidebar/app-sidebar.tsx`)

Insert `<NavFooter />` in the `<SidebarFooter>` component before the user menu:

```typescript
<SidebarFooter>
  <NavFooter /> {/* Custom footer links */}
  {patientSidebar ? <PatientNavUser /> : <FacilityNavUser />}
</SidebarFooter>
```

The `SidebarFooter` component (lines 192-202) already exists and is the correct insertion point.

## External Link Detection

Links starting with `http://` or `https://` are treated as external and rendered with:
- `target="_blank"` for new tab behavior
- `rel="noopener noreferrer"` for security
- `ExternalLink` icon from `lucide-react` to visually indicate external navigation

## Component Styling

Footer links will use the same styling as main nav items:
- Gray text with green hover states (`text-gray-600 hover:text-green-700`)
- White background with shadow when active
- Consistent icon sizing and spacing
- Proper tooltip support in collapsed mode

## Ordering

Links render in this order:
1. Environment-configured links (from `REACT_NAVBAR_LINKS`)
2. Plugin-provided links (from `footerNavItems` in plugin manifests)

This ordering gives deployment-specific links priority over plugin-provided links.

## Empty State

When no custom links are configured (empty env array and no plugins with `footerNavItems`), the `NavFooter` component renders nothing, maintaining current behavior with only the user menu visible.

## Mobile Considerations

The existing `SidebarFooter` component already handles mobile responsiveness through the shadcn/ui sidebar system. Footer links will inherit this behavior automatically.

## Dependencies

No new dependencies required. Implementation uses:

- Existing `NavigationLink` interface (src/components/ui/sidebar/nav-main.tsx:47)
- Existing `useCareApps` hook for plugin integration (src/hooks/useCareApps.tsx:17)
- Existing shadcn/ui sidebar primitives (`SidebarGroup`, `SidebarMenu`, etc.)
- Existing `lucide-react` icon library (add `ExternalLink` icon usage)

## Testing Considerations

Manual testing should verify:
1. External links open in new tab with correct security attributes
2. Collapsed sidebar shows tooltips for footer links
3. Multiple links from env + plugins render in correct order
4. Empty state (no links) shows only user menu
5. Mobile sidebar displays footer links correctly
6. Plugin hot-reload updates footer links
7. Invalid JSON in `REACT_NAVBAR_LINKS` fails gracefully (already handled by JSON.parse error boundaries)

## Accessibility

- Footer links include proper `aria-label` or tooltip text
- Keyboard navigation works for all footer links
- External link indicator is clear for screen readers
- Focus states are visible and consistent

## i18n Considerations

Link names from env config and plugins are provided by the admin/plugin author and are not translated. This matches the pattern for `customShortcuts` which also doesn't translate user-provided titles.

If translation support is needed in the future, links could reference translation keys instead of literal strings.
