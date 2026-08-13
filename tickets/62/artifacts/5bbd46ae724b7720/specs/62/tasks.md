# Implementation Tasks: Custom Sidebar Links

## Task 1: Configuration Layer and Type Definitions

**Repository:** yash-learner/care_fe_agent_hq

**Description:** Add configuration support for custom sidebar links via environment variables and define TypeScript interfaces.

**Changes:**
- Modify `care.config.ts` to parse `REACT_CUSTOM_SIDEBAR_LINKS` environment variable
- Create TypeScript interface `SidebarLink` with properties: label, url, type, openInNewTab, contexts
- Add fallback handling for invalid JSON (empty array)
- Export `customSidebarLinks` configuration

**Dependencies:** None

**Acceptance Criteria Covered:**
- AC1: Custom links configured via `REACT_CUSTOM_SIDEBAR_LINKS` (partial - configuration parsing)
- AC2: Links with `openInNewTab` configuration (partial - type definition)
- AC3: Links with `type: "external"` or `type: "internal"` (partial - type definition)
- AC4: Links with `sidebarContext` filter (partial - type definition)

**Estimated Size:** ~50 lines

---

## Task 2: Plugin Type Extension

**Repository:** yash-learner/care_fe_agent_hq

**Description:** Extend plugin system to support sidebar links in plugin manifests.

**Changes:**
- Modify `src/pluginTypes.ts` to add `sidebarLinks?: SidebarLink[]` property to `PluginManifest` interface
- Import `SidebarLink` type from configuration or define shared type location
- Update any relevant plugin type exports

**Dependencies:** Task 1 (requires `SidebarLink` type definition)

**Acceptance Criteria Covered:**
- AC5: Plugin manifest with `sidebarLinks` property (partial - type definition)

**Estimated Size:** ~20 lines

---

## Task 3: Custom Sidebar Links Component

**Repository:** yash-learner/care_fe_agent_hq

**Description:** Create the CustomSidebarLinks component that renders configured links with proper icons, filtering, and behavior.

**Changes:**
- Create `src/components/ui/sidebar/custom-links.tsx`
- Implement link rendering with icons:
  - Use `ExternalLink` from lucide-react for external links
  - Use `Link2` from lucide-react for internal links
- Implement context filtering logic
- Handle collapsed/expanded sidebar states (icon-only vs icon + label)
- Merge environment-configured links and plugin links
- Maintain order: environment links first, then plugin links
- Handle link click behavior based on `openInNewTab` property
- Add proper accessibility attributes (ARIA labels)

**Dependencies:** Task 1 (requires `SidebarLink` type and configuration), Task 2 (requires plugin type extension)

**Acceptance Criteria Covered:**
- AC1: Custom links appear in sidebar footer (partial - rendering component)
- AC2: Links open in new tab or current tab based on configuration (full)
- AC3: Display external/internal icons based on link type (full)
- AC4: Links filter based on sidebar context (full)
- AC5: Plugin sidebar links appear alongside environment links (partial - rendering)
- AC6: Consistent order - environment links first, then plugin links (full)
- AC7: Icon-only in collapsed mode, icon + label in expanded mode (full)

**Estimated Size:** ~150 lines

---

## Task 4: Sidebar Integration and Context Detection

**Repository:** yash-learner/care_fe_agent_hq

**Description:** Integrate CustomSidebarLinks component into the app sidebar and implement context detection logic.

**Changes:**
- Modify `src/components/ui/sidebar/app-sidebar.tsx`
- Update `<SidebarFooter>` (line ~192) to include `<CustomSidebarLinks>` above NavUser components
- Implement context detection logic:
  - "facility" when `facilitySidebar || facilityLocationSidebar || facilityServiceSidebar`
  - "organization" when `selectedOrganization && !responsibilityId`
  - "patient" when `patientSidebar`
  - "admin" when `adminSidebar`
- Pass detected context as prop to `CustomSidebarLinks`
- Ensure proper ordering: CustomSidebarLinks renders above NavUser

**Dependencies:** Task 3 (requires CustomSidebarLinks component)

**Acceptance Criteria Covered:**
- AC1: Custom links appear in sidebar footer above NavUser (full)
- AC4: Links appear in matching sidebar contexts (partial - context detection)
- AC5: Plugin links appear in appropriate sidebar contexts (full)
- AC6: Links appear above NavUser component (full)

**Estimated Size:** ~80 lines

---

## Task 5: Plugin Hook Integration and Testing

**Repository:** yash-learner/care_fe_agent_hq

**Description:** Ensure plugin hooks properly expose sidebar links and add comprehensive testing across sidebar contexts.

**Changes:**
- Review `src/hooks/useCareApps.ts` to ensure plugin `sidebarLinks` are accessible
- Add any necessary hooks or utilities to merge plugin sidebar links with environment links
- Manual testing checklist:
  - Test environment variable configuration with sample links
  - Verify external links open in new tab
  - Verify internal links navigate in current tab
  - Test all sidebar contexts (Facility, Organization, Patient, Admin)
  - Test collapsed and expanded sidebar states
  - Verify icon rendering (external vs internal)
  - Test context filtering with various configurations
  - Verify order: environment links before plugin links

**Dependencies:** Task 4 (requires full integration)

**Acceptance Criteria Covered:**
- AC1: Custom links configured via environment variable work correctly (verification)
- AC2: openInNewTab behavior works correctly (verification)
- AC3: Icons display correctly (verification)
- AC4: Context filtering works correctly (verification)
- AC5: Plugin sidebar links are supported (verification)
- AC6: Order is correct (verification)
- AC7: Collapsed/expanded modes work correctly (verification)

**Estimated Size:** ~50 lines of code changes + testing

---

## Acceptance Criteria Coverage Summary

| AC | Description | Covered By Tasks |
|----|-------------|------------------|
| AC1 | Custom links appear in sidebar footer | Tasks 1, 3, 4, 5 |
| AC2 | openInNewTab behavior | Tasks 1, 3, 5 |
| AC3 | External/internal icons | Tasks 1, 3, 5 |
| AC4 | Sidebar context filtering | Tasks 1, 3, 4, 5 |
| AC5 | Plugin sidebar links support | Tasks 2, 3, 4, 5 |
| AC6 | Consistent order (env first, then plugins) | Tasks 3, 4, 5 |
| AC7 | Collapsed/expanded mode display | Tasks 3, 5 |

**All acceptance criteria are fully covered by the task breakdown.**

---

## Implementation Notes

- This is a single-repository ticket affecting only `yash-learner/care_fe_agent_hq`
- Tasks are ordered sequentially with clear dependencies
- Each task is sized appropriately (~20-150 lines of changes)
- Plugin sidebar links structure is implemented but not testable in QA (as per requirements)
- No new dependencies required - using existing lucide-react icons
- All tasks maintain backward compatibility with existing sidebar functionality
