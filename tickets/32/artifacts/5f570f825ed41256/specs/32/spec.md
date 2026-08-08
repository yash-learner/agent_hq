# Navbar Documentation and NABH Links

## Problem

Deployments need the ability to add documentation links and NABH certification indicators to the left navigation sidebar. Currently, there is no mechanism to inject custom links from environment configuration or allow plugins to contribute navigation items outside facility-specific contexts.

## Acceptance Criteria

1. Given `REACT_NAV_DOCS_LINK` env var is set, when the app sidebar renders, then a "Documentation" link appears in the navigation.
2. Given `REACT_NAV_NABH_LINK` env var is set, when the app sidebar renders, then a "NABH Certification" link appears in the navigation.
3. Given environment-configured nav links are present, when user clicks a link, then the browser opens the configured URL in a new tab.
4. Given a plugin declares `navItems` in its manifest, when the facility sidebar renders, then those items appear integrated with facility nav links.
5. Given a plugin declares `adminNavItems`, when the admin sidebar renders, then those items appear in the admin navigation.
6. Given a plugin declares `userNavItems`, when the user dropdown menu opens, then those items appear in the menu.
7. Given no environment nav links are configured, when the app sidebar renders, then no extra links appear (existing behavior preserved).

## Capability Notes

- `care.config.ts` -- centralized config exists, suitable for adding new nav link configs from env vars
- `src/components/ui/sidebar/app-sidebar.tsx` -- top-level sidebar component, renders facility/admin/patient-specific content
- `src/components/ui/sidebar/nav-main.tsx` -- defines `NavigationLink` interface, renders nav items with support for children
- `src/pluginTypes.ts:206-209` -- plugin manifests already declare `navItems`, `adminNavItems`, `userNavItems`
- `src/hooks/useCareApps.tsx:98-110` -- `usePluginRoutes()` shows existing plugin integration pattern

## Open Questions

None.
