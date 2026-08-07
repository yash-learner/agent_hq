# Spec: Add support for inserting links in the left navbar

## Problem Statement

The application currently lacks a mechanism for administrators to add custom links (e.g., documentation, NABH certification) to the left navbar via environment configuration. While plugins can insert navigation items through their manifests, there is no parallel capability for the core application to inject custom links without code changes. This limits the ability to customize deployments for different healthcare contexts that require quick access to external resources or documentation.

## Acceptance Criteria

1. Given an admin configures `REACT_NAV_LINKS` in environment variables with valid JSON containing link objects, when the application loads, then those links appear in the left navbar for facility and admin sidebars.

2. Given a plugin defines `navItems` in its manifest, when the plugin is enabled, then those items are injected into the appropriate navbar sections as they currently do.

3. Given `REACT_NAV_LINKS` specifies links with `name`, `url`, and optional `icon` properties, when rendering the navbar, then each link displays with the configured properties and opens in a new tab if external.

4. Given both environment-configured links and plugin nav items exist, when the navbar renders, then environment links appear after core nav items but before plugin items.

5. Given invalid JSON or missing required fields in `REACT_NAV_LINKS`, when the application initializes, then a console warning is logged and the navbar renders without custom links.

## Capability Notes

- `src/components/ui/sidebar/app-sidebar.tsx` — Main sidebar component that orchestrates different nav types (facility, admin, patient); needs to pass custom links to nav components.
- `src/components/ui/sidebar/nav-main.tsx` — Renders navigation links from `NavigationLink[]` array; already supports external and nested links via `navItems` from plugins.
- `src/components/ui/sidebar/facility/facility-nav.tsx` — Generates facility nav links and already merges `pluginLinks` from `useCareApps()`; extend to merge environment links.
- `src/components/ui/sidebar/admin-nav.tsx` — Generates admin nav links and merges `pluginNavItems`; extend similarly for environment links.
- `care.config.ts` — Centralized config file where new `REACT_NAV_LINKS` environment variable should be parsed and exposed; similar to how `careApps` is handled.

## Open Questions

None.
