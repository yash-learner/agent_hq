# Specification: Custom Links in Sidebar Footer

## Problem Statement

CARE needs configurable custom links in the sidebar footer for quick access to external resources (documentation, support portals) and internal routes. Currently, the sidebar footer only contains the user avatar dropdown, limiting navigational flexibility. This feature will allow deployment-specific customization via `care.config.ts` and plugin-based extension, with links displayed above the user avatar in the sidebar footer.

## Acceptance Criteria

1. Given `customFooterLinks` configured in `care.config.ts`, when a user views any sidebar, then configured links appear in SidebarFooter above the user avatar component.
2. Given a custom link with `target: "_blank"`, when clicked, then the link opens in a new tab with an external link icon displayed.
3. Given a custom link with `target: "_self"` (or no target), when clicked, then navigation occurs in the current tab with an internal route icon displayed.
4. Given custom links with `sidebarFor` filter specified, when viewing a specific sidebar type (facility/patient/admin), then only matching links are displayed.
5. Given a plugin manifest with `footerNavItems` defined, when the plugin is loaded, then plugin-provided footer links render alongside configured links.
6. Given a custom link without `sidebarFor` specified, when viewing any sidebar type, then the link appears in all sidebars.
7. Given multiple custom footer links, when viewing the sidebar, then links render in the configured order with proper spacing and visual hierarchy.

## Capability Notes

- `src/components/ui/sidebar/app-sidebar.tsx` — SidebarFooter wraps FacilityNavUser/PatientNavUser; needs custom link injection before NavUser
- `src/components/ui/sidebar/nav-user.tsx` — FacilityNavUser already handles plugin userNavItems via dropdown; new footer links appear outside/above dropdown
- `src/pluginTypes.ts:202` — PluginManifest interface defines navItems, userNavItems, etc.; requires new `footerNavItems?: NavigationLink[]`
- `care.config.ts` — Global config file; requires new `customFooterLinks` array with link shape: `{name, url, icon?, target?, sidebarFor?[]}`
- `src/components/ui/sidebar/nav-main.tsx:47` — NavigationLink interface exists; may need extension for external link handling

## Open Questions

None.
