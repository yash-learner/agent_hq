# Implementation Plan: Add Custom Sidebar Links

## Overview

Add support for configurable custom links in the sidebar footer that appear above the NavUser component. Links can be configured via environment variables and extended by plugins, with control over external/internal link types, target behavior (new tab vs current tab), and sidebar context filtering (Facility, Organization, Patient, Admin).

## Architecture Approach

### 1. Configuration Layer (`care.config.ts`)

Add `customSidebarLinks` configuration parsing from `REACT_CUSTOM_SIDEBAR_LINKS` environment variable:

```typescript
// Expected JSON format:
// [
//   {
//     "label": "Dashboard",
//     "url": "https://example.com/dashboard",
//     "type": "external",
//     "openInNewTab": true,
//     "contexts": ["facility", "admin"]
//   }
// ]

interface SidebarLink {
  label: string;
  url: string;
  type: "external" | "internal";
  openInNewTab: boolean;
  contexts?: ("facility" | "organization" | "patient" | "admin")[];
}

customSidebarLinks: env.REACT_CUSTOM_SIDEBAR_LINKS
  ? JSON.parse(env.REACT_CUSTOM_SIDEBAR_LINKS)
  : []
```

### 2. Plugin Type Extension (`src/pluginTypes.ts`)

Extend `PluginManifest` interface to support sidebar links:

```typescript
export type PluginManifest = {
  // ... existing properties
  sidebarLinks?: SidebarLink[];
};
```

### 3. Custom Links Component

Create `src/components/ui/sidebar/custom-links.tsx`:

- Renders a list of sidebar links with appropriate icons
- Uses `ExternalLink` from lucide-react for external links
- Uses `Link2` or `ArrowRight` from lucide-react for internal links
- Filters links based on current sidebar context
- Respects collapsed/expanded sidebar state
- Handles both environment-configured and plugin-provided links

```typescript
export function CustomSidebarLinks({
  context: "facility" | "organization" | "patient" | "admin"
}) {
  // Merge environment links + plugin links
  // Filter by context
  // Render with icons and proper target behavior
}
```

### 4. Sidebar Integration (`src/components/ui/sidebar/app-sidebar.tsx`)

Modify `<SidebarFooter>` at line 192 to include custom links above NavUser:

```tsx
<SidebarFooter>
  <CustomSidebarLinks context={determineContext()} />
  {patientSidebar ? <PatientNavUser /> : <FacilityNavUser />}
</SidebarFooter>
```

Context determination logic:
- `facilitySidebar || facilityLocationSidebar || facilityServiceSidebar` → "facility"
- `selectedOrganization && !responsibilityId` → "organization"
- `patientSidebar` → "patient"
- `adminSidebar` → "admin"

### 5. Plugin Hook Integration (`src/hooks/useCareApps.ts`)

Ensure plugin manifests expose `sidebarLinks` property and it's properly typed and consumed by `CustomSidebarLinks` component.

### 6. Validation (Optional Enhancement)

Add validation schema in `scripts/validate-env.ts` for `REACT_CUSTOM_SIDEBAR_LINKS` to catch configuration errors at build time (JSON schema validation).

## Repositories Touched

- **yash-learner/care_fe_agent_hq** (this repository) - All implementation changes

## New Dependencies

None. All required icon components (`ExternalLink`, `Link2`, `ArrowRight`) are available from `lucide-react` which is already a dependency.

## Implementation Phases

1. **Phase 1: Configuration**
   - Add `customSidebarLinks` to `care.config.ts`
   - Define TypeScript interfaces for sidebar link structure

2. **Phase 2: Plugin Support**
   - Extend `PluginManifest` interface in `src/pluginTypes.ts`
   - No changes to plugin loading mechanism required

3. **Phase 3: UI Component**
   - Create `CustomSidebarLinks` component
   - Implement icon rendering, filtering, and link behavior
   - Handle collapsed/expanded states

4. **Phase 4: Integration**
   - Update `app-sidebar.tsx` to include custom links in footer
   - Implement context detection logic

5. **Phase 5: Testing**
   - Manual testing with environment variables
   - Verify behavior across all sidebar contexts
   - Test collapsed/expanded states
   - Verify external/internal link behavior

## Technical Considerations

- **Order**: Environment links render first, plugin links second
- **Icons**: Fixed icons per type (external vs internal) as per requirements
- **Context filtering**: Links without `contexts` property appear in all sidebars
- **Responsive**: Component must handle both collapsed and expanded sidebar states
- **Accessibility**: Proper ARIA labels for screen readers, especially in collapsed mode
- **i18n**: Link labels should support translation if needed (optional enhancement)

## Risk Mitigation

- Invalid JSON in `REACT_CUSTOM_SIDEBAR_LINKS` handled gracefully (empty array fallback)
- Missing/malformed plugin `sidebarLinks` handled safely
- No breaking changes to existing sidebar functionality
- Plugin sidebar links are mentioned but not testable in QA (as noted in requirements)

## Success Criteria

1. Environment-configured links appear in sidebar footer above NavUser
2. Links filter correctly based on sidebar context
3. External links open in new tab when configured
4. Internal links navigate in current tab when configured
5. Appropriate icons display for external vs internal links
6. Links display in collapsed mode (icon-only) and expanded mode (icon + label)
7. Plugin manifests can define sidebar links (structure only, not QA-tested)
