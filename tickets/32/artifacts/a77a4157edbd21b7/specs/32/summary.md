# Summary: Navbar Documentation and NABH Links

## What was done

Added environment-configurable navigation links for documentation and NABH certification across the application's navigation surfaces (facility sidebar, admin sidebar, and user dropdown menu). The implementation allows deployments to inject custom links via `REACT_NAV_DOCS_LINK` and `REACT_NAV_NABH_LINK` environment variables.

## Acceptance criteria results

**Passed (4/7):**
- ✓ AC1: Documentation link appears when `REACT_NAV_DOCS_LINK` is set
- ✓ AC2: NABH Certification link appears when `REACT_NAV_NABH_LINK` is set
- ✓ AC3: Environment-configured links open in new tabs with security attributes
- ✓ AC7: No extra links appear when env vars are not configured

**Not exercised (3/7):**
- ⊘ AC4: Plugin `navItems` integration (deferred per spec — QA environment lacks plugin support)
- ⊘ AC5: Plugin `adminNavItems` integration (deferred per spec — QA environment lacks plugin support)
- ⊘ AC6: Plugin `userNavItems` integration (deferred per spec — QA environment lacks plugin support)

## Review outcome

Clean — no findings in code review.

## Changes implemented

- Extended `care.config.ts` with `navLinks.docs` and `navLinks.nabh` reading from environment
- Updated `NavigationLink` interface to support external links
- Integrated env-configured links into facility sidebar, admin sidebar, and user dropdown
- Added i18n keys for "documentation" and "nabh_certification"
- Plugin nav item support already existed; no new plugin integration code was written

## Notes

Plugin integration criteria (AC4-6) were verified via code review. The implementation reuses the existing `useCareApps()` pattern present in all navigation components. Full end-to-end plugin testing will occur when the QA environment has plugin infrastructure configured.
