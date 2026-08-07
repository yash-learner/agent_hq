# Specification: Left-nav hyperlinks via env config + plugin hooks

## Problem

Deployments need environment-specific hyperlinks (documentation, NABH certification) in the left sidebar without hardcoding URLs. Plugins must also contribute custom left-nav links. Currently, `care.config.ts` parses env vars, plugin manifests define `navItems`/`billingNavItems`/`userNavItems`/`adminNavItems`, and various nav components (`FacilityNav`, `AdminNav`, `FacilityNavUser`) merge plugin links with core links. External links (documentation, compliance PDFs) require distinct handling from internal raviger routes.

## Acceptance criteria

1. Given `REACT_NAV_LINKS='[{"name":"Docs","url":"https://docs.example.com","external":true}]'` in env, when user opens left sidebar, then "Docs" link appears in the appropriate nav section (facility/admin/user).
2. Given optional `REACT_NABH_LINK='{"name":"NABH Cert","url":"https://nabh.example.com/cert.pdf","external":true}'` in env, when configured, then NABH link appears in sidebar; when omitted, no NABH item renders.
3. Given multiple env-configured links, when rendered, then all appear without breaking existing core nav items (dashboard, patients, encounters remain functional).
4. Given env link with `"external":true`, when clicked, then opens in new tab with `rel="noopener noreferrer"` (no internal routing).
5. Given empty/invalid `REACT_NAV_LINKS`, when app loads, then no crash occurs and sidebar renders existing core items normally.
6. Given plugin manifest with `navItems` array including external link `{"name":"Plugin Docs","url":"https://plugin.example.com","external":true}`, when plugin loads, then link appears in facility nav alongside env-configured and core links (type-level proof sufficient if live plugin unavailable in QA env).
7. Given i18n keys for any new UI chrome (e.g. section headers), when non-English locale selected, then corresponding translations load from `public/locale/en.json` (operator-supplied link labels remain as-is from config).

## Capability notes

- `care.config.ts` — env parsing entry point for new `REACT_NAV_LINKS` and `REACT_NABH_LINK` (JSON arrays/objects); add alongside existing `customShortcuts` pattern (line 305).
- `src/pluginTypes.ts:NavigationLink` (line 47) — existing interface requires `external?: boolean` field and external-link rendering logic.
- `src/components/ui/sidebar/nav-main.tsx:NavLink` — internal-only component using raviger `<ActiveLink>`; needs external-link sibling component or conditional rendering for `<a>` vs `<ActiveLink>`.
- `src/components/ui/sidebar/facility/facility-nav.tsx` (line 217) — already merges `pluginNavItems` into links array; add env-configured links here alongside plugin links.
- `src/components/ui/sidebar/admin-nav.tsx` (line 85) and `src/components/ui/sidebar/nav-user.tsx` (line 44) — similar merge points for admin/user nav contexts; replicate env-link injection pattern.

## Open questions

None.
