# Implementation Tasks: Custom Footer Links in Sidebar

## Task 1: Extend Configuration Schema and Types

**Repository**: yash-learner/care_fe_agent_hq

**Size**: ~80 lines

**Description**: Add configuration schema for custom footer links and extend plugin types to support footer navigation items.

**Changes**:
1. Update `care.config.ts`:
   - Add `customFooterLinks` array to config interface
   - Define `CustomFooterLink` type with properties: name, url, target, visibleIn, icon
   - Export type for use in components

2. Update `src/pluginTypes.ts`:
   - Add `footerNavItems?: NavigationLink[]` to `PluginManifest` interface

3. Update type exports in `src/types/config/config.ts` if needed

**Dependencies**: None

**Acceptance Criteria Coverage**:
- Enables AC1: Configuration foundation for custom footer links
- Enables AC2-3: Target property for tab behavior
- Enables AC4: visibleIn property for context filtering
- Enables AC5: Plugin integration via footerNavItems

**Testing**:
- TypeScript compilation passes
- No runtime errors when accessing config

---

## Task 2: Create NavFooterLinks Component

**Repository**: yash-learner/care_fe_agent_hq

**Size**: ~150 lines

**Description**: Create the footer links component that renders custom links from configuration and plugins.

**Changes**:
1. Create `src/components/ui/sidebar/nav-footer-links.tsx`:
   - Accept `sidebarFor: SidebarFor` prop
   - Fetch plugin footer links via `useCareApps()` hook
   - Merge configuration links with plugin links
   - Filter links by `visibleIn` based on `sidebarFor` context
   - Render links in `SidebarMenu` structure
   - Use `ExternalLink` icon for `target="_blank"`
   - Use `Link2` icon for `target="_self"` 
   - Support tooltips when sidebar collapsed
   - Handle external links with `<a>` tag + `rel="noopener noreferrer"`
   - Handle internal routes with raviger's `<Link>` component
   - Apply i18n translation to link names

**Dependencies**: Task 1 (types and config)

**Acceptance Criteria Coverage**:
- AC1: Renders custom links in sidebar
- AC2: External links open in new tab with ExternalLink icon
- AC3: Internal routes navigate in current tab with Link2 icon
- AC4: Context filtering based on visibleIn
- AC5: Plugin footer links integration
- AC6: Tooltip support for collapsed sidebar
- AC7: Vertical stacking in configuration order

**Testing**:
- Component renders without errors
- Links filtered correctly by context
- External/internal link behavior correct
- Icons display correctly
- Tooltips work when collapsed

---

## Task 3: Integrate NavFooterLinks into AppSidebar

**Repository**: yash-learner/care_fe_agent_hq

**Size**: ~20 lines

**Description**: Add the NavFooterLinks component to the SidebarFooter in app-sidebar.tsx above the existing NavUser components.

**Changes**:
1. Update `src/components/ui/sidebar/app-sidebar.tsx`:
   - Import `NavFooterLinks` component
   - Add `<NavFooterLinks sidebarFor={sidebarFor} />` to `<SidebarFooter>`
   - Position above `PatientNavUser` / `FacilityNavUser`
   - Ensure proper spacing and layout

**Dependencies**: Task 2 (NavFooterLinks component)

**Acceptance Criteria Coverage**:
- AC1: Links appear above NavUser in all sidebars (facility/organization/location/patient/admin)
- AC7: Correct positioning in footer

**Testing**:
- Sidebar renders correctly with footer links
- NavUser components still display below footer links
- No layout issues or visual regressions
- Works across all sidebar contexts

---

## Task 4: Add Example Configuration and Documentation

**Repository**: yash-learner/care_fe_agent_hq

**Size**: ~50 lines

**Description**: Add example custom footer links to care.config.ts and document the feature.

**Changes**:
1. Update `care.config.ts`:
   - Add example `customFooterLinks` with 2-3 sample links
   - Include both external and internal link examples
   - Demonstrate `visibleIn` usage for context filtering
   - Add JSDoc comments explaining each property

2. Add inline documentation:
   - Comment explaining the feature
   - Example of plugin integration pattern

**Dependencies**: Task 1, 2, 3 (complete implementation)

**Acceptance Criteria Coverage**:
- All AC: Provides working examples for validation
- Demonstrates proper configuration usage

**Testing**:
- Example configuration loads without errors
- Example links render correctly
- Documentation is clear and accurate

---

## Task Coverage Summary

| Acceptance Criterion | Covered By |
|---------------------|------------|
| AC1: Custom links appear in sidebar footer above NavUser | Tasks 1, 2, 3 |
| AC2: External links open in new tab with external icon | Tasks 1, 2 |
| AC3: Internal links navigate in current tab with internal icon | Tasks 1, 2 |
| AC4: visibleIn property filters by sidebar context | Tasks 1, 2 |
| AC5: Plugin footer links integration | Tasks 1, 2 |
| AC6: Tooltip on hover when sidebar collapsed | Task 2 |
| AC7: Links render in configuration order, stacked vertically | Task 2 |

**All acceptance criteria are covered.**

---

## Implementation Order Rationale

1. **Task 1 first**: Establishes type safety and configuration foundation that other tasks depend on
2. **Task 2 second**: Core component logic requires types from Task 1
3. **Task 3 third**: Integration requires completed component from Task 2
4. **Task 4 last**: Documentation and examples need complete implementation

---

## Estimated Total Size

- Task 1: ~80 lines
- Task 2: ~150 lines  
- Task 3: ~20 lines
- Task 4: ~50 lines
- **Total: ~300 lines**

All tasks fit within a single repository (care_fe_agent_hq) and single agent session.
