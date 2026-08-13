# Ticket 64: Add support for custom links in sidebar footer

## Problem Statement

The application currently lacks configurable custom links in the sidebar footer, limiting deployment flexibility for instances that need quick access to external resources (documentation, support portals) or internal administrative pages. This feature enables configuration-driven custom links displayed above the user avatar in the sidebar footer across all sidebar contexts (facility, organization, location, patient, admin).

## Acceptance Criteria

1. Given a `care.config.ts` configuration with custom footer links, when a user views any sidebar (facility/organization/location/patient/admin), then the custom links appear in the sidebar footer above the NavUser component.

2. Given a custom link configured with `target: "_blank"`, when a user clicks the link, then it opens in a new tab with an external link icon displayed.

3. Given a custom link configured with `target: "_self"`, when a user clicks the link, then it navigates in the current tab with an internal route icon displayed.

4. Given custom links with a `visibleIn` property specifying sidebar contexts, when a user views different sidebars, then only links matching the current sidebar context are displayed.

5. Given plugin manifests with `footerNavItems` defined, when the sidebar renders, then plugin footer links appear alongside configuration-defined links in the footer.

6. Given the sidebar is collapsed, when a user hovers over a custom footer link, then a tooltip displays the link name.

7. Given multiple custom footer links configured, when rendered, then they appear in the order defined in the configuration, stacked vertically above the NavUser component.

## Capability Notes

- `src/components/ui/sidebar/app-sidebar.tsx` -- exists, contains `SidebarFooter` with `FacilityNavUser` and `PatientNavUser` components
- `src/components/ui/sidebar/nav-user.tsx` -- exists, defines `FacilityNavUser` and `PatientNavUser` components that render in sidebar footer
- `care.config.ts` -- exists, centralized config file for extending with `customFooterLinks` property
- `src/pluginTypes.ts` -- exists, defines `PluginManifest` interface with `navItems`, `billingNavItems`, `userNavItems`, `adminNavItems` for extending with `footerNavItems`
- `src/components/ui/sidebar/nav-main.tsx` -- exists, defines `NavigationLink` interface and rendering patterns to reuse or adapt for footer links

## Open Questions

None.
