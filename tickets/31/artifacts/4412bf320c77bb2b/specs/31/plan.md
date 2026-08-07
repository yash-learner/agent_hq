# Implementation Plan: Left-nav hyperlinks via env config + plugin hooks

## Overview

This ticket adds support for environment-configured navigation links (documentation, NABH certification) and ensures plugins can contribute external links to the left sidebar. The implementation extends existing navigation infrastructure (`NavigationLink` interface, plugin nav merging, env config parsing) rather than creating parallel systems.

## Classification: CRUD

This is a **CRUD-tier** ticket because:
- No new data models or database migrations
- No changes to existing model fields
- No new services, workers, or infrastructure
- No external integrations (just rendering hyperlinks from config)
- No authorization/access-control changes
- No FHIR/EMR model changes
- No non-CRUD API endpoints
- No clinical-safety-relevant behavior

The ticket is purely frontend presentation: parsing JSON from environment variables, extending an existing TypeScript interface, and rendering additional links in React components that already support plugin-injected nav items.

## Repositories

**yash-learner/care_fe_agent_hq** (frontend only)

## Architecture approach

### 1. Environment configuration (care.config.ts)

Add two new environment variables to `care.config.ts`:
- `REACT_NAV_LINKS`: JSON array of `NavigationLink` objects (multiple general-purpose links)
- `REACT_NABH_LINK`: JSON object for single optional NABH/certification link

Parse using the same pattern as `customShortcuts` (line 305-307). Validate JSON parsing; return empty array/null on invalid input (no crash).

Example env values:
```bash
REACT_NAV_LINKS='[{"name":"Documentation","url":"https://docs.example.com","external":true},{"name":"Support","url":"https://support.example.com","external":true}]'
REACT_NABH_LINK='{"name":"NABH Certification","url":"https://nabh.example.com/cert.pdf","external":true}'
```

### 2. Type system updates (NavigationLink interface)

The existing `NavigationLink` interface in `src/components/ui/sidebar/nav-main.tsx` (line 47-55) already supports:
- `name`, `url`, `icon?`, `visibility?`, `children?`

**Add** `external?: boolean` field to the interface. This field signals whether a link should use `<a>` (external) vs `<ActiveLink>` (internal raviger routing).

Update plugin type definitions in `src/pluginTypes.ts` to document that plugin manifests' `navItems`, `billingNavItems`, `userNavItems`, and `adminNavItems` arrays can now include links with `external: true`.

### 3. External link rendering (nav-main.tsx)

Modify `NavLink` component (line 57-96) to:
- Accept optional `external` prop
- When `external === true`, render plain `<a href="..." target="_blank" rel="noopener noreferrer">` instead of `<ActiveLink>`
- When `external === false` or undefined, keep existing `<ActiveLink>` behavior

Apply similar logic in:
- `NavItem` component (line 257-278) for collapsed popover menus
- Child link rendering in `CollapsibleNavItem` (line 232-245)

### 4. Inject env links into navigation components

**FacilityNav** (`src/components/ui/sidebar/facility/facility-nav.tsx`, line 217):
- Import env-configured links from `careConfig.navLinks` and `careConfig.nabhLink`
- Merge env links into the `links` array passed to `<NavMain>` alongside plugin links and core facility links
- Order: core facility links → plugin nav items → env links (document in code comment)

**AdminNav** (`src/components/ui/sidebar/admin-nav.tsx`, line 85):
- Import and merge env-configured admin links (if scope-specific admin links are desired, or reuse same `REACT_NAV_LINKS`)
- Add to admin nav links array

**FacilityNavUser** (`src/components/ui/sidebar/nav-user.tsx`, line 44):
- Import and merge env-configured user links
- Add to user nav links array

For this ticket, simplest approach: **share `REACT_NAV_LINKS` across all nav contexts** unless product requires different links per context (spec says "appropriate nav section" but does not mandate splitting). Recommend single shared env var for initial implementation; note in plan that per-context env vars can be added later if needed.

### 5. Plugin support (already exists, document contract)

Plugins already declare `navItems`, `billingNavItems`, `userNavItems`, `adminNavItems` in their manifests. With the `external?: boolean` field added to `NavigationLink`, plugins can now include external links:

```typescript
// Example plugin manifest
{
  navItems: [
    { name: "Plugin Dashboard", url: "/plugin/dashboard" }, // internal
    { name: "Plugin Docs", url: "https://plugin.example.com/docs", external: true } // external
  ]
}
```

FacilityNav already merges `pluginNavItems` (line 217-219). No additional code changes needed for plugin support beyond the `external` field and rendering logic.

### 6. Error handling and validation

- Invalid JSON in `REACT_NAV_LINKS`/`REACT_NABH_LINK`: catch parse errors in `care.config.ts`, log warning to console, return empty array/null
- Missing required fields (`name`, `url`): filter out invalid entries, log warning
- Empty env vars: no links added, no crash

### 7. Internationalization

- Operator-configured link labels (`name` field in JSON) remain as-is (free text)
- Any new UI chrome strings (e.g., section headers for env links) use i18next keys in `public/locale/en.json`
- No translation keys needed for this ticket unless we add section headers like "External Resources"

## Testing strategy

### Unit/integration tests
- Add tests for env config parsing in `care.config.ts` (valid JSON, invalid JSON, missing fields)
- Add tests for `NavigationLink` interface with `external` field
- Add component tests for `NavLink` rendering `<a>` vs `<ActiveLink>` based on `external` prop

### E2E Playwright tests
- Test with env vars set: verify links appear and open correct URLs
- Test with NABH link present/absent
- Test with invalid env JSON: verify no crash
- Test plugin link injection: type-level proof acceptable if live plugin unavailable (see QA constraints in spec)

## Dependencies

No new dependencies required. Uses existing:
- React 19 (rendering)
- raviger (`<ActiveLink>` for internal routing)
- Tailwind CSS (styling)
- Existing sidebar components (SidebarMenuButton, etc.)

## Rollout notes

- Changes are opt-in: deployments without `REACT_NAV_LINKS` see no change
- No database migrations
- No API changes
- Requires rebuild/restart to pick up new env vars (standard Vite env behavior)

## Open questions

None. Spec is clear, existing patterns are sufficient.
