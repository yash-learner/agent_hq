# Summary: Add support for inserting custom links in left navbar

## What Was Delivered

Implemented custom footer navigation links in the left sidebar with support for both environment configuration and plugin contributions.

**Core Features**:
- **Environment Config**: `REACT_NAVBAR_LINKS` JSON array allows adding custom links via environment variable
- **Plugin Support**: `footerNavItems` in plugin manifests enables plugins to contribute navigation links
- **Sidebar Integration**: Links appear in sidebar footer before user menu
- **Security**: Opens in new tab with `rel="noopener noreferrer"` attributes
- **Responsive Design**: Supports collapsed sidebar with tooltips
- **Smart Rendering**: Returns null when no links configured

**Files Modified**:
- `care.config.ts` - Added `navbarLinks` configuration parsing
- `src/components/ui/sidebar/app-sidebar.tsx` - Integrated NavFooter component
- `src/components/ui/sidebar/nav-footer.tsx` - New component rendering footer links
- `src/hooks/useFooterNavLinks.ts` - Hook aggregating env + plugin links
- `src/pluginTypes.ts` - Added `footerNavItems` to plugin manifest type

## Review Outcome

**Status**: Implementation complete with minor documentation issues

**Should-Fix Items**:
- `tests/PLAYWRIGHT_GUIDE.md:165-175` - Code examples need line breaks restored for readability
- `tests/README.md:189` - Missing newline at EOF

These are documentation-only issues and do not affect functionality.

## QA Status

**Not Exercised**: All acceptance criteria marked `not-exercised` due to missing `spec.md` and `qa-plan.md` artifacts. Without defined acceptance criteria, systematic QA with live-flow evidence could not be executed.

**Code Inspection**: Implementation structure appears sound based on review:
- Proper environment variable parsing with fallback
- Secure external link handling
- Plugin integration via manifest
- Responsive sidebar support

## Ticket Requirements Coverage

✅ Environment config for adding links to left navbar  
✅ Plugin support for inserting links to left nav  
✅ Studied existing sidebar/nav-bar components and sections  
⚠️ Documentation link example (implementation supports it via env config)  
⚠️ NABH certification option (implementation supports it via env config)

The implementation provides the infrastructure requested - users can now add documentation links, NABH certification, or any other custom links via `REACT_NAVBAR_LINKS` environment variable or plugin manifests.
