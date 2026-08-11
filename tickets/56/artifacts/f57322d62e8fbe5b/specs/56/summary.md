# Summary: Custom Links in Sidebar Footer

## Implementation Completed

Successfully implemented configurable custom footer links in the sidebar footer, displayed above the user avatar component. The feature supports:

- Environment-based configuration via `REACT_CUSTOM_FOOTER_LINKS` (parsed from `care.config.ts`)
- External links with `target="_blank"` and `ExternalLink` icon
- Internal route links with `target="_self"` and `ArrowRight` icon  
- Sidebar-type filtering via `sidebarFor` property (facility/patient/admin)
- Plugin extension support via `footerNavItems` in plugin manifests
- Proper error handling for invalid JSON configuration

## Acceptance Criteria Status

All 7 acceptance criteria were implemented and passed code review:

1. ✅ **AC1**: Custom links configured in `care.config.ts` appear in SidebarFooter above user avatar
2. ✅ **AC2**: External links with `target="_blank"` open in new tab with external link icon
3. ✅ **AC3**: Internal links with `target="_self"` navigate in current tab with internal route icon
4. ✅ **AC4**: Links with `sidebarFor` filter display only in matching sidebar types
5. ✅ **AC5**: Plugin-provided footer links render alongside configured links
6. ✅ **AC6**: Links without `sidebarFor` appear in all sidebar types
7. ✅ **AC7**: Multiple footer links render in configured order with proper spacing

## Code Review Outcome

**Round 2: Clean** — All blockers and should-fix items from Round 1 were resolved:

- Added try-catch error handling for JSON parsing in `care.config.ts`
- Created `.env.test` with test configuration for automated QA
- Fixed React key collision issues (`${name}-${url}` composite keys)
- Added `data-testid` attributes for reliable test selection
- Namespaced i18n keys with `footer_link_` prefix

## QA Status

**Live-flow verification incomplete** — The agent-qa task could not exercise acceptance criteria due to missing MCP browser tooling. The implementation is code-complete and review-clean, but lacks live interaction verification.

**Environment verified**: Backend, frontend preview server, test configuration, and authentication state were successfully set up per the QA plan.

**Next steps**: Manual verification following `specs/56/qa-plan.md`, or re-run agent-qa when MCP browser tools become available.

## Files Changed

- `src/components/ui/sidebar/footer-links.tsx` — New component for rendering custom footer links
- `src/components/ui/sidebar/app-sidebar.tsx` — Integrated FooterLinks component before NavUser
- `care.config.ts` — Added `customFooterLinks` configuration with environment variable parsing
- `src/pluginTypes.ts` — Extended PluginManifest with `footerNavItems` property
- `tests/facility/custom-footer-links.spec.ts` — Playwright tests for all acceptance criteria
- `.env.test` — Test configuration with sample footer links
- `public/locale/en.json` — Added namespaced i18n keys for footer links
