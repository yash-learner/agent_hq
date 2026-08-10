# Specification: Custom Links in Sidebar/Navbar

## Problem Statement

CARE's sidebar currently displays fixed navigation items for facilities, organizations, and admin features. Deployers and plugins need a mechanism to add configurable custom links at the bottom of the sidebar that can navigate to internal routes or external URLs, with control over whether they open in the current tab or a new tab.

## Acceptance Criteria

1. Given a custom link configuration in `care.config.ts`, when the sidebar renders, then custom links appear in `SidebarFooter` below existing footer content.
2. Given a custom link is configured as an internal route, when rendered, then it displays an internal link icon and navigates within the app.
3. Given a custom link is configured as an external URL, when rendered, then it displays an external link icon.
4. Given a custom link has `openInNewTab: true`, when clicked, then the link opens in a new browser tab.
5. Given a custom link has `openInNewTab: false`, when clicked, then the link opens in the current tab.
6. Given a plugin provides custom links in its manifest, when the plugin is loaded, then those links appear in the appropriate sidebar footer.
7. Given sidebar context is facility/organization/admin, when custom links have visibility config, then only matching links display in that context.

## Capability Notes

- `src/components/ui/sidebar/app-sidebar.tsx` -- Main sidebar component with `SidebarFooter` rendering `NavUser` components; needs custom link rendering
- `src/components/ui/sidebar/nav-main.tsx:NavigationLink` -- Existing link interface; extend or create parallel type for custom footer links
- `src/pluginTypes.ts:PluginManifest` -- Plugin manifest already supports `navItems`, `billingNavItems`, `userNavItems`, `adminNavItems`; may need `customFooterLinks` property
- `care.config.ts` -- Configuration file; needs `customLinks` array with `{ name, url, isExternal, openInNewTab, showIn?: SidebarFor[] }`
- `src/components/ui/sidebar/app-sidebar.tsx:SidebarFor` -- Enum exists (`FACILITY`, `PATIENT`, `ADMIN`); use for visibility filtering
- Link icons (external/internal) -- lucide-react provides `ExternalLink` and `Link2` icons; use as fixed indicators

## Open Questions

None.
