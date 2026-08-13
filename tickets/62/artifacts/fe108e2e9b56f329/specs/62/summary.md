# Summary: Custom Sidebar Links

## Implementation Status

**Complete** — All acceptance criteria have been implemented with code review approval, though live QA testing was blocked by a test environment networking issue (Chromium connectivity to preview server).

## What Was Done

Added support for configurable custom links in the sidebar footer across all CARE contexts (Facility, Organization, Patient, Admin):

- **Environment configuration**: Added `REACT_CUSTOM_SIDEBAR_LINKS` parsing in `care.config.ts` with JSON schema validation
- **React components**: Created `CustomLinks` component (`src/components/ui/sidebar/custom-links.tsx`) with icon differentiation (ExternalLink for external, Link2 for internal), target behavior (_blank vs current tab), context filtering, and responsive sidebar state handling
- **Plugin support**: Extended `PluginManifest` interface to accept `sidebarLinks` property, with merging logic that places plugin links after environment-configured links
- **Integration**: Integrated `CustomLinks` into `<SidebarFooter>` component in facility sidebar above NavUser component

## Acceptance Criteria Coverage

All 7 acceptance criteria are implemented and structurally verified:

- **AC1**: Links appear in sidebar footer via `REACT_CUSTOM_SIDEBAR_LINKS` environment variable ✓
- **AC2**: `openInNewTab` configuration controls target behavior ✓
- **AC3**: External and internal links display correct icons (ExternalLink vs Link2) ✓
- **AC4**: Links filter by `sidebarContext` array (facility, admin, organization, patient) ✓
- **AC5**: Plugin sidebar links merge with environment links (plugin support extends PluginManifest) ✓
- **AC6**: Consistent ordering maintained (environment links first, then plugin links, above NavUser) ✓
- **AC7**: Links adapt to collapsed/expanded sidebar states (icon-only vs icon+label) ✓

## Code Review Outcome

**Pass** — Round 2 clean after resolving two blockers (unused import, unrelated formatting change) from Round 1.

**Remaining should-fix/nit items**:
- **should-fix**: QA plan AC5 section notes plugin testing limitation (no plugin infrastructure in test environment) but doesn't emphasize structural verification is complete — acceptable as plugin functional testing is deferred to production
- **nit**: Key generation in CustomLinks uses `${link.url}-${index}` which could collide on duplicate URLs — consider `${link.url}-${link.label}-${index}` for uniqueness

## QA Outcome

**Not exercised** — All 7 criteria marked `not-exercised` due to systematic browser connectivity issue in test environment (Chromium `ERR_CONNECTION_REFUSED` when connecting to preview server, despite server being accessible via curl). Code inspection confirms structural implementation of all requirements, but live application verification was blocked.

**QA Blocker**: Test environment networking issue preventing Chromium/Playwright from connecting to the preview server at localhost, 127.0.0.1, and container interface addresses. This is an infrastructure limitation, not an application defect.

**Plugin testing note**: AC5 has additional known limitation — no plugin infrastructure available in test fixtures. Plugin functional verification requires production environment with `REACT_ENABLED_APPS` configured.

## Changes

- `care.config.ts` — Added `customSidebarLinks` configuration parsing from `REACT_CUSTOM_SIDEBAR_LINKS` env var
- `src/components/ui/sidebar/custom-links.tsx` — New component for rendering configurable sidebar links
- `src/components/ui/sidebar/app-sidebar.tsx` — Integrated `CustomLinks` into sidebar footer
- `src/pluginTypes.ts` — Extended `PluginManifest` with `sidebarLinks` property

## Recommendation

Implementation is code-complete and review-approved. The QA blocker is environmental (browser connectivity in test container), not a code defect. Consider:

1. **Manual verification**: Test in local development or staging environment where Playwright can connect
2. **Accept on code review**: All structural requirements met, environmental blocker documented
3. **Production smoke test**: Verify basic functionality (links appear, icons correct, click behavior) after deployment
