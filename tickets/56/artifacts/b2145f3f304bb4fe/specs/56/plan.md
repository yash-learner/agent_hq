# Implementation Plan: Custom Links in Sidebar Footer

## Overview

This feature adds configurable custom links to the sidebar footer, displayed above the user avatar. Links can be configured globally via `care.config.ts` and extended by plugins via the manifest. Each link supports external/internal routing with appropriate icons and per-sidebar-type filtering.

## Architecture Approach

### 1. Configuration Schema (care.config.ts)

Add a new `customFooterLinks` configuration array to the global config with the following structure:

```typescript
customFooterLinks?: {
  name: string;           // Display name (i18n key)
  url: string;            // URL or internal route path
  target?: "_blank" | "_self";  // Open in new tab or current tab (default: "_self")
  sidebarFor?: ("facility" | "patient" | "admin" | "organization" | "location" | "service")[];  // Filter by sidebar type
  icon?: ReactNode;       // Optional custom icon (defaults to link type icon)
}[]
```

**Rationale:** Centralized configuration in `care.config.ts` follows existing pattern for app-wide settings (API URLs, feature flags, logos). Using an array allows ordering control.

### 2. Plugin Manifest Extension (src/pluginTypes.ts)

Extend `PluginManifest` interface to support plugin-provided footer links:

```typescript
export type PluginManifest = {
  // ... existing fields
  footerNavItems?: NavigationLink[];  // New field for footer links
}
```

**Rationale:** Consistent with existing plugin extension patterns (`navItems`, `userNavItems`, `adminNavItems`, `billingNavItems`). Reuses existing `NavigationLink` interface but interprets it for footer placement.

### 3. NavigationLink Extension (src/components/ui/sidebar/nav-main.tsx)

Extend `NavigationLink` interface to support external link configuration:

```typescript
export interface NavigationLink {
  header?: string;
  headerIcon?: ReactNode;
  name: string;
  url: string;
  icon?: ReactNode;
  visibility?: boolean;
  children?: NavigationLink[];
  target?: "_blank" | "_self";  // New field for link target
  sidebarFor?: string[];         // New field for sidebar filtering
}
```

**Rationale:** Minimal extension to existing interface. `target` field naturally maps to HTML anchor behavior. `sidebarFor` enables per-sidebar filtering.

### 4. Footer Links Component (src/components/ui/sidebar/footer-links.tsx)

Create a new component to render custom footer links with proper icon handling:

```typescript
export function FooterLinks({ sidebarType }: { sidebarType: string }) {
  // Merge config links + plugin links
  // Filter by sidebarFor
  // Render with ExternalLink or ArrowRight icons
}
```

**Component Structure:**
- Import from `care.config.ts` for global links
- Use `useCareApps()` hook to aggregate plugin `footerNavItems`
- Filter links based on `sidebarType` match against `sidebarFor` array
- Render as `SidebarMenu` with `SidebarMenuItem` for each link
- Use `ExternalLink` icon (lucide-react) for `target="_blank"`, `ArrowRight` for internal
- Links with `target="_blank"` get `rel="noopener noreferrer"` for security

**Icon Strategy:**
- External links (`target="_blank"`): Always use `ExternalLink` icon from lucide-react
- Internal links (`target="_self"` or no target): Always use `ArrowRight` icon from lucide-react
- Custom icons in config/manifest are ignored in favor of consistent system icons

### 5. AppSidebar Integration (src/components/ui/sidebar/app-sidebar.tsx)

Modify `<SidebarFooter>` to inject `<FooterLinks>` before the user avatar components:

```tsx
<SidebarFooter>
  <FooterLinks sidebarType={sidebarFor} />  {/* New component */}
  {patientSidebar ? (
    <PatientNavUser />
  ) : (
    <FacilityNavUser selectedFacilityId={...} />
  )}
</SidebarFooter>
```

**Rationale:** Footer links need access to `sidebarFor` prop to filter appropriately. Placement before `NavUser` ensures links appear above the user avatar as specified.

## Implementation Steps

1. **Extend TypeScript interfaces** (nav-main.tsx, pluginTypes.ts)
   - Add `target` and `sidebarFor` to `NavigationLink`
   - Add `footerNavItems` to `PluginManifest`

2. **Create FooterLinks component** (footer-links.tsx)
   - Implement link aggregation (config + plugins)
   - Implement sidebar type filtering
   - Implement icon selection logic
   - Add proper accessibility attributes

3. **Update care.config.ts types** (care.config.ts, likely in a separate types file)
   - Add `customFooterLinks` to config type definition
   - Add TypeScript interface for footer link shape

4. **Integrate into AppSidebar** (app-sidebar.tsx)
   - Import FooterLinks component
   - Add before NavUser in SidebarFooter
   - Pass `sidebarFor` prop

5. **Update tests**
   - Add Playwright test for custom footer link rendering
   - Test external vs internal link behavior
   - Test sidebar filtering (if link has `sidebarFor`, verify it only shows in matching sidebars)
   - Test plugin footer links (manual verification only, per ticket requirements)

## Repositories Touched

- **yash-learner/care_fe_agent_hq** (primary) — All frontend changes

## Dependencies

No new dependencies required. Existing dependencies cover all needs:
- `lucide-react` — Already available for ExternalLink and ArrowRight icons
- `raviger` — Already used for internal navigation
- React/TypeScript ecosystem — No additional packages needed

## Configuration Example

```typescript
// In care.config.ts
export default {
  // ... existing config
  customFooterLinks: [
    {
      name: "documentation",  // i18n key
      url: "https://docs.example.com",
      target: "_blank",
      sidebarFor: ["facility", "patient"],  // Only show in facility and patient sidebars
    },
    {
      name: "settings",
      url: "/settings",
      // target defaults to "_self"
      // sidebarFor omitted = shows in all sidebars
    },
  ],
};
```

## Plugin Integration Pattern

Plugins declare footer links in their manifest:

```typescript
// Plugin manifest
export const manifest: PluginManifest = {
  plugin: "my-plugin",
  footerNavItems: [
    {
      name: "plugin_support",
      url: "https://support.plugin.com",
      target: "_blank",
      sidebarFor: ["facility"],
    },
  ],
};
```

## Testing Strategy

1. **Unit/Component Tests:** Footer link rendering, filtering, icon selection
2. **E2E Tests (Playwright):**
   - Configure test links in `care.config.ts`
   - Navigate to facility sidebar → verify links appear
   - Click external link → verify new tab opens
   - Click internal link → verify navigation in same tab
   - Navigate to patient sidebar → verify filtered links
   - Navigate to admin sidebar → verify filtered links
3. **Manual Testing:** Plugin footer links (not included in automated QA per ticket requirements)

## Edge Cases Handled

- Empty `customFooterLinks` array → No links rendered, no errors
- Link without `sidebarFor` → Shows in all sidebar types
- Link with empty `sidebarFor` → Shows in all sidebar types
- Plugin without `footerNavItems` → Skipped during aggregation
- Duplicate link names → Both render (order preserved)
- Missing i18n key → Falls back to raw `name` value (React i18n default behavior)

## Accessibility Considerations

- External links include `rel="noopener noreferrer"` for security
- External links include `aria-label` indicating "opens in new tab"
- Proper keyboard navigation (built into SidebarMenu components)
- Icon + text labels for clarity (icon alone in collapsed state via tooltip)

## Visual Design

Footer links follow existing sidebar navigation patterns:
- Same styling as `SidebarMenuItem` for consistency
- Icon + text in expanded state
- Icon only (with tooltip) in collapsed state
- Hover states match existing nav items
- Placed above user avatar with natural spacing (SidebarMenu spacing)

## Breaking Changes

None. This is a purely additive feature.

## Migration Path

Not applicable — no existing functionality changes.
