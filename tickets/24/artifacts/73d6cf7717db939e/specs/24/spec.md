# Spec: Add support for inserting custom links in left navbar

## Problem Statement

Users need a way to add external hyperlinks (like documentation and NABH certification) to the left navigation sidebar. Currently, nav links are hard-coded in component files, and there's no way for admins to add custom links via configuration or for plugins to contribute footer-level links. This limits the extensibility of the navbar for deployment-specific needs.

## Acceptance Criteria

1. Given CARE is configured with `REACT_NAVBAR_LINKS='[{"name":"Documentation","url":"https://docs.example.com"}]'`, when a user views any sidebar, then a "Documentation" link appears at the bottom of the sidebar content, before the user menu.

2. Given a plugin's manifest includes `footerNavItems: [{name: "NABH", url: "https://nabh.example.com"}]`, when the plugin is loaded, then the "NABH" link appears in the sidebar footer alongside env-configured links.

3. Given multiple custom links are configured via env and plugins, when a user views the sidebar, then all links render in order: env-configured links first, then plugin links, each in a separate menu group.

4. Given a custom link URL is external (starts with http/https), when rendered, then the link opens in a new tab with `target="_blank"` and `rel="noopener noreferrer"`.

5. Given the sidebar is collapsed (icon mode), when a user hovers over a footer link icon, then a tooltip shows the link name.

6. Given no custom links are configured, when a user views the sidebar, then the footer shows only the user menu (no change to current behavior).

7. Given custom links are configured, when testing on mobile, then links are visible and clickable in the mobile sidebar.

## Capability Notes

- `src/pluginTypes.ts:206` — `PluginManifest` type already supports `navItems`, `billingNavItems`, `userNavItems`, `adminNavItems` for plugins to inject links into specific sections; needs extending with `footerNavItems?: NavigationLink[]`.
- `src/components/ui/sidebar/nav-main.tsx:47` — `NavigationLink` interface defines nav link structure with `name`, `url`, `icon`, `visibility`, and `children`; suitable for footer links.
- `src/components/ui/sidebar/app-sidebar.tsx:171` — `SidebarContent` component renders context-specific nav (facility, patient, admin, org); custom footer links need insertion here or in a new `SidebarFooter` section above the user menu.
- `care.config.ts:53` — Central config exports parsed env vars (e.g., `apiUrl`, `urls.github`, `urls.ohcn`); needs building: a `navbarLinks` property to parse `REACT_NAVBAR_LINKS` JSON array.
- `src/hooks/useCareApps.tsx:17` — `useCareApps` hook retrieves loaded plugins; existing pattern for extracting plugin nav items (lines 44-46 in `nav-user.tsx`) can be adapted for footer links.

## Open Questions

None.
