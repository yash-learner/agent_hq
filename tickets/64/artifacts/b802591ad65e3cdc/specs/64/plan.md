# Implementation Plan: Custom Footer Links in Sidebar

## Overview

Add support for configurable custom links in the sidebar footer across all sidebar contexts (facility, organization, location, patient, admin). Links will be displayed above the NavUser component with support for internal/external navigation, context-specific visibility, and plugin integration.

## Implementation Approach

### 1. Configuration Schema (care.config.ts)

Extend `care.config.ts` to support a `customFooterLinks` array:

```typescript
customFooterLinks: [
  {
    name: string;              // Display name (i18n key)
    url: string;               // URL or route path
    target: "_blank" | "_self"; // Open in new tab or current tab
    visibleIn?: SidebarFor[];  // Optional: contexts where link appears
    icon?: ReactNode;          // Optional: custom icon (defaults to target-based)
  }
]
```

**Default behavior**: If `visibleIn` is omitted, the link appears in all sidebar contexts.

### 2. Plugin Support (src/pluginTypes.ts)

Add `footerNavItems` to the `PluginManifest` interface:

```typescript
export type PluginManifest = {
  // ... existing properties
  footerNavItems?: NavigationLink[];
}
```

This allows plugins to inject custom footer links using the same `NavigationLink` interface already used for `navItems`, `billingNavItems`, `userNavItems`, and `adminNavItems`.

### 3. Footer Link Component (NEW)

Create `src/components/ui/sidebar/nav-footer-links.tsx`:

- Accept `sidebarFor` prop to filter links by context
- Fetch plugin footer links via `useCareApps()` hook
- Merge configuration-defined links with plugin-provided links
- Render links in a `SidebarMenu` structure (stacked vertically)
- Use `ExternalLink` icon (lucide-react) for `target="_blank"`
- Use a suitable internal route icon (e.g., `Link2` or `ArrowRight` from lucide-react) for `target="_self"`
- Support tooltips when sidebar is collapsed (using `SidebarMenuButton` tooltip prop)
- Maintain consistent styling with existing sidebar navigation

### 4. Integration with AppSidebar (src/components/ui/sidebar/app-sidebar.tsx)

Modify the `<SidebarFooter>` component:

```tsx
<SidebarFooter>
  <NavFooterLinks sidebarFor={sidebarFor} />
  {patientSidebar ? (
    <PatientNavUser />
  ) : (
    <FacilityNavUser
      selectedFacilityId={
        facilitySidebar ? selectedFacility?.id : undefined
      }
    />
  )}
</SidebarFooter>
```

The new `<NavFooterLinks>` component renders above the existing NavUser components, matching the requirement to place links "above the user avatar in the sidebar footer."

### 5. Link Behavior

- **External links** (`target="_blank"`):
  - Use standard `<a>` tag with `href`
  - Add `rel="noopener noreferrer"` for security
  - Display `ExternalLink` icon
  
- **Internal routes** (`target="_self"`):
  - Use raviger's `<Link>` component for SPA navigation
  - Display internal route icon (e.g., `Link2` from lucide-react)

### 6. Context Filtering

Implement visibility logic based on `sidebarFor` prop:

```typescript
const visibleLinks = allLinks.filter(link => 
  !link.visibleIn || link.visibleIn.includes(sidebarFor)
);
```

### 7. Styling & UX

- Links stacked vertically above NavUser
- Consistent hover states matching existing sidebar items
- Tooltip on hover when sidebar is collapsed
- Links render in order: configuration-defined first, then plugin-provided
- Use `SidebarMenuButton` for consistent sizing and spacing
- Match the visual style of existing navigation items

## Repositories Touched

- **yash-learner/care_fe_agent_hq** (frontend only)

## New Dependencies

**None**. The implementation uses existing dependencies:

- `lucide-react` (already installed) for icons (`ExternalLink`, `Link2`)
- `raviger` (already installed) for internal navigation
- `react-i18next` (already installed) for i18n
- Existing sidebar components from `@/components/ui/sidebar`

## Technical Decisions

1. **Context filtering approach**: Use `SidebarFor` enum (already exists in `app-sidebar.tsx`) for type-safe context identification.

2. **Icon defaults**: Use `ExternalLink` for external links and `Link2` for internal routes as fixed indicators (per requirement "two fixed icons").

3. **Plugin integration**: Leverage existing plugin manifest pattern (`footerNavItems`) rather than introducing a new mechanism.

4. **Link ordering**: Configuration-defined links appear first, followed by plugin-provided links, maintaining predictable ordering.

5. **i18n**: Link names support i18n keys (consistent with existing navigation patterns).

## Testing Strategy

### Manual Testing

1. **Configuration-defined links**:
   - Add `customFooterLinks` to `care.config.ts`
   - Verify links appear in sidebar footer above NavUser
   - Test external link (`target="_blank"`) opens in new tab
   - Test internal route (`target="_self"`) navigates in current tab
   - Verify tooltips show on hover when sidebar is collapsed

2. **Context visibility**:
   - Add links with `visibleIn: [SidebarFor.FACILITY]`
   - Verify links only appear in facility sidebar
   - Test all sidebar contexts (facility, organization, location, patient, admin)

3. **Visual regression**:
   - Verify existing NavUser components render correctly below footer links
   - Check responsive behavior and mobile sidebar

### Automated Testing

- **Unit tests** for `NavFooterLinks` component (filter logic, link rendering)
- **Integration tests** for `AppSidebar` with footer links
- Playwright E2E tests covered in QA phase (exclude plugin testing per requirement)

## Migration Path

No migration required. This is a purely additive feature:

- Existing deployments without `customFooterLinks` configuration will see no change
- Deployments can opt-in by adding configuration
- Plugins can opt-in by adding `footerNavItems` to their manifest

## Edge Cases

1. **No links configured**: Component renders nothing (no empty state needed)
2. **Long link names**: Truncate text with ellipsis when sidebar is expanded, rely on tooltip when collapsed
3. **Many links**: Links stack vertically; if excessive, sidebar becomes scrollable (existing behavior)
4. **Invalid URLs**: Links render as-is; browser handles invalid URLs naturally
5. **Missing i18n keys**: Fall back to raw string (consistent with existing i18n behavior)

## Alternative Approaches Considered

1. **Separate footer link type**: Rejected in favor of reusing `NavigationLink` interface for consistency.
2. **Dynamic icon selection**: Rejected per requirement for "two fixed icons" for external/internal.
3. **Configuration via database**: Rejected; configuration file keeps deployment-level settings centralized.
