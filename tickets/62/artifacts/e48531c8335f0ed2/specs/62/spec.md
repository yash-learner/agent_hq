# Spec: Frontend: Add support for custom links in sidebar/navbar

## Problem Statement

Currently, the sidebar footer only displays the user avatar (NavUser) component. Organizations deploying CARE need the ability to configure custom links (e.g., external dashboards, help documentation, or internal tools) that appear consistently in the sidebar across different contexts (Facility, Organization, Patient, Admin). These links should be configurable via environment variables and extensible by plugins, with control over whether they open in a new tab or the current window.

## Acceptance Criteria

1. Given a user viewing any sidebar (Facility, Organization, Patient, Admin), when custom links are configured via `REACT_CUSTOM_SIDEBAR_LINKS` environment variable, then those links appear in the sidebar footer above the NavUser component.
2. Given a custom link configuration with `openInNewTab: true`, when the user clicks the link, then it opens in a new browser tab; when `openInNewTab: false`, then it navigates in the current tab.
3. Given a custom link with `type: "external"`, when rendered, then it displays the external link icon; when `type: "internal"`, then it displays the internal route icon.
4. Given a custom link with a `sidebarContext` filter (e.g., `["facility", "admin"]`), when viewing a matching sidebar, then the link appears; when viewing a non-matching sidebar, then the link is hidden.
5. Given a plugin manifest with `sidebarLinks` property, when the plugin is loaded, then its sidebar links appear alongside environment-configured links in the appropriate sidebar contexts.
6. Given sidebar links from both environment config and plugins, when rendered, then they appear in a consistent order (environment links first, then plugin links) in the footer above NavUser.
7. Given multiple custom links configured, when the sidebar is collapsed, then the links display icon-only mode; when expanded, then they show both icon and label.

## Capability Notes

- `care.config.ts` -- add `customSidebarLinks` property parsing `REACT_CUSTOM_SIDEBAR_LINKS` environment variable
- `scripts/validate-env.ts` -- add validation schema for custom sidebar links configuration (needs building)
- `src/components/ui/sidebar/app-sidebar.tsx:192` -- `<SidebarFooter>` exists, currently contains only NavUser components
- `src/pluginTypes.ts:202` -- `PluginManifest` exists, needs extension for `sidebarLinks` property
- `src/components/ui/sidebar/nav-user.tsx` -- NavUser components exist for Facility and Patient sidebars
- External link icon component -- needs identification or building (lucide-react provides `ExternalLink`)
- Internal link icon component -- needs identification or building (lucide-react provides `Link2` or `ArrowRight`)
- Custom sidebar links rendering component -- needs building to display links with proper icons, context filtering, and target behavior

## Open Questions

None.
