# Implementation Tasks: Custom Links in Sidebar Footer

## Task 1: Extend TypeScript Interfaces for Footer Links

**Repository:** yash-learner/care_fe_agent_hq

**Changes:**
- Extend `NavigationLink` interface in `src/components/ui/sidebar/nav-main.tsx` to add `target?: "_blank" | "_self"` and `sidebarFor?: string[]` fields
- Extend `PluginManifest` type in `src/pluginTypes.ts` to add `footerNavItems?: NavigationLink[]` field
- Add TypeScript interface for `customFooterLinks` configuration schema (can be in `care.config.ts` or separate type file)

**Dependencies:** None (foundational types)

**Acceptance Criteria Coverage:**
- AC1 (partial): Type definitions for config structure
- AC5 (partial): Type definitions for plugin footer items
- AC4 (partial): Type definitions for sidebar filtering

**Size:** ~20 lines changed (interface extensions only)

---

## Task 2: Create FooterLinks Component

**Repository:** yash-learner/care_fe_agent_hq

**Changes:**
- Create new component `src/components/ui/sidebar/footer-links.tsx`
- Implement link aggregation from `care.config.ts` and plugin manifests via `useCareApps()` hook
- Implement sidebar type filtering based on `sidebarFor` field
- Implement icon selection logic:
  - `ExternalLink` icon for `target="_blank"` links
  - `ArrowRight` icon for internal links (`target="_self"` or no target)
- Add security attributes for external links (`rel="noopener noreferrer"`)
- Add accessibility attributes (`aria-label` for external links)
- Use `SidebarMenu` and `SidebarMenuItem` components for consistent styling
- Handle empty link arrays gracefully (render nothing)

**Dependencies:** Task 1 (requires extended NavigationLink interface)

**Acceptance Criteria Coverage:**
- AC1 (partial): Renders configured links
- AC2: External link icon and new tab behavior
- AC3: Internal link icon and same-tab behavior
- AC4: Sidebar type filtering logic
- AC5 (partial): Plugin link aggregation
- AC6: Links without `sidebarFor` appear in all sidebars
- AC7: Multiple links render with proper spacing

**Size:** ~150 lines (new component file with logic)

---

## Task 3: Update care.config.ts Configuration Schema

**Repository:** yash-learner/care_fe_agent_hq

**Changes:**
- Add `customFooterLinks` configuration array to the config export in `care.config.ts`
- Add TypeScript type for the config object to include the new field
- Add example configuration in comments or documentation comments

**Dependencies:** Task 1 (requires type definitions)

**Acceptance Criteria Coverage:**
- AC1 (partial): Config location for footer links

**Size:** ~30 lines (config schema and example)

---

## Task 4: Integrate FooterLinks into AppSidebar

**Repository:** yash-learner/care_fe_agent_hq

**Changes:**
- Modify `src/components/ui/sidebar/app-sidebar.tsx` to import FooterLinks component
- Add `<FooterLinks sidebarType={sidebarFor} />` to `<SidebarFooter>` before the user avatar components (PatientNavUser or FacilityNavUser)
- Ensure `sidebarFor` prop is properly passed from AppSidebar to FooterLinks

**Dependencies:** Task 2 (requires FooterLinks component)

**Acceptance Criteria Coverage:**
- AC1: Links appear in sidebar footer above user avatar
- AC7 (partial): Placement and visual hierarchy

**Size:** ~10 lines (component integration)

---

## Task 5: Add Playwright E2E Tests

**Repository:** yash-learner/care_fe_agent_hq

**Changes:**
- Create new test file `tests/sidebar/custom-footer-links.spec.ts`
- Configure test links in `care.config.ts` for test environment (or use test-specific config)
- Test scenarios:
  1. Custom footer link renders in sidebar footer above user avatar
  2. External link (`target="_blank"`) opens in new tab with external icon
  3. Internal link navigates in current tab with internal icon
  4. Links with `sidebarFor: ["facility"]` only appear in facility sidebar
  5. Links with `sidebarFor: ["patient"]` only appear in patient sidebar
  6. Links without `sidebarFor` appear in all sidebar types
  7. Multiple links render in configured order
- Verify icons are correct (ExternalLink vs ArrowRight)
- Verify accessibility attributes on external links

**Dependencies:** Task 4 (requires integrated feature)

**Acceptance Criteria Coverage:**
- AC1: Verification that configured links appear
- AC2: Verification of external link behavior and icon
- AC3: Verification of internal link behavior and icon
- AC4: Verification of sidebar type filtering
- AC6: Verification of links without filter appearing everywhere
- AC7: Verification of multiple links and ordering

**Size:** ~200 lines (comprehensive test coverage)

**Note:** Plugin footer links (AC5) are excluded from automated QA per ticket requirements; they require manual verification only.

---

## Task 6: Update i18n Locale Files

**Repository:** yash-learner/care_fe_agent_hq

**Changes:**
- Add i18n keys for example footer link names to `public/locale/en.json`
- Add keys for any new accessibility labels (e.g., "opens in new tab")

**Dependencies:** Task 2 (to identify required i18n keys)

**Acceptance Criteria Coverage:**
- AC1 (partial): i18n support for link names

**Size:** ~10 lines (JSON entries)

---

## Coverage Summary

All acceptance criteria are covered:

- **AC1:** Tasks 1, 2, 3, 4, 5, 6 — Configuration, rendering, and verification
- **AC2:** Tasks 2, 5 — External link handling and testing
- **AC3:** Tasks 2, 5 — Internal link handling and testing
- **AC4:** Tasks 1, 2, 5 — Sidebar filtering and testing
- **AC5:** Tasks 1, 2 — Plugin manifest extension and aggregation (manual verification only, per ticket requirements)
- **AC6:** Tasks 2, 5 — Links without filter logic and testing
- **AC7:** Tasks 2, 4, 5 — Multiple links rendering and testing

**Total Size Estimate:** ~420 lines across 6 tasks (within single-session sizing)

**Implementation Order:** Tasks must be completed sequentially (1 → 2 → 3 → 4 → 5 → 6) due to dependencies.
