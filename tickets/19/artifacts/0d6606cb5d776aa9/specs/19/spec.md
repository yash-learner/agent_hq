# Specification: Add support for inserting links in the left navbar

## Problem Statement

The left navigation sidebar currently supports plugin-injected links via `navItems`, but does not support administrator-configured custom links via environment variables. Healthcare facilities need to add documentation links (e.g., NABH certification, facility guidelines) to the left navbar without deploying custom plugins. This feature enables environment-based configuration for custom navigation links while preserving the existing plugin system.

## Acceptance Criteria

1. Given `REACT_NAV_LINKS` is set with valid JSON, when the facility sidebar renders, then custom links appear in the navbar alongside existing navigation items.
2. Given a custom link with `target="_blank"`, when a user clicks the link, then it opens in a new tab.
3. Given a custom link with `icon` specified, when the link renders, then the specified CareIcon or Lucide icon displays.
4. Given custom links with `visibility: false`, when the navbar renders, then those links do not appear.
5. Given a plugin provides `navItems`, when custom env links are present, then both plugin and custom links render without conflicts.
6. Given the sidebar is collapsed, when hovering over a custom link icon, then a tooltip displays the link name.
7. Given `REACT_NAV_LINKS` has invalid JSON or missing required fields, when the app initializes, then a console error logs and the app continues without custom links.

## Capability Notes

- `src/components/ui/sidebar/facility/facility-nav.tsx` -- generates facility nav links and injects plugin nav items; needs custom link injection
- `src/components/ui/sidebar/nav-main.tsx` -- exports `NavigationLink` type and renders nav items with icon, URL, visibility, and children support
- `care.config.ts` -- centralizes environment config; needs new `customNavLinks` property from `REACT_NAV_LINKS`
- `src/hooks/useCareApps.tsx` -- provides plugin nav items to sidebars; reference for integration pattern
- `.example.env` -- documents environment variables; needs `REACT_NAV_LINKS` example with JSON schema

## Open Questions

None.
