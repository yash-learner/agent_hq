# Implementation Plan: Navbar Documentation and NABH Links

## Overview

This ticket adds environment-configurable navigation links (Documentation and NABH Certification) and extends plugin support for custom navigation items across facility, admin, and user navigation contexts.

## Architecture Approach

### 1. Environment Configuration (care.config.ts)

Add new configuration fields to centralize environment-based navigation links:

```typescript
navLinks: {
  docs?: string;      // REACT_NAV_DOCS_LINK
  nabh?: string;      // REACT_NAV_NABH_LINK
}
```

These will be read from environment variables and made available throughout the application via the existing `care.config.ts` centralized configuration pattern.

### 2. Facility Navigation Enhancement

**File: `src/components/ui/sidebar/facility/facility-nav.tsx`**

The `generateFacilityLinks` function already integrates plugin navigation items via the `pluginLinks` parameter (line 204-209). We will:

- Add environment-configured links (docs, NABH) to the links array after the base facility links
- Position them before plugin links to maintain logical grouping (core features → env-configured → plugins)
- Use existing `NavigationLink` interface with external link support
- Ensure links open in new tabs with `target="_blank"` and `rel="noopener noreferrer"`

Plugin support already exists: `pluginNavItems` are extracted from `useCareApps()` at line 217-219 and integrated at line 204-209.

### 3. Admin Navigation Enhancement

**File: `src/components/ui/sidebar/admin-nav.tsx`**

The `generateAdminLinks` function already supports plugin navigation items at line 75. We will:

- Add environment-configured links (docs, NABH) to the admin navigation
- Position them similarly to facility nav: after core admin links, before plugin links
- Plugin support already exists via `pluginNavItems` at line 84-87

### 4. User Dropdown Menu Enhancement

**File: `src/components/ui/sidebar/nav-user.tsx`**

The `FacilityNavUser` component already integrates plugin user nav items at line 44-46 and renders them in the dropdown at line 118-130. We will:

- Add environment-configured links (docs, NABH) to the user dropdown menu
- Insert them in the existing `DropdownMenuGroup` alongside profile and plugin items
- Maintain the established pattern of using `navigate()` for internal links or `window.open()` for external links

Plugin support already exists: `pluginNavItems` are extracted and rendered in the dropdown menu.

### 5. External Link Handling

For environment-configured links that point to external URLs:

- Detect external URLs (starts with `http://` or `https://`)
- For external links in sidebar navigation, use `<a>` tag with `target="_blank"` and `rel="noopener noreferrer"`
- For external links in dropdown menu, use `onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}`
- Maintain accessibility with proper ARIA labels and visual indicators (external link icon if appropriate)

### 6. NavigationLink Interface Extension

**File: `src/components/ui/sidebar/nav-main.tsx`**

The existing `NavigationLink` interface (line 47-55) supports:
- `name`, `url`, `icon`, `visibility`, `children`

We may need to extend it to support external links:

```typescript
export interface NavigationLink {
  header?: string;
  headerIcon?: ReactNode;
  name: string;
  url: string;
  icon?: ReactNode;
  visibility?: boolean;
  children?: NavigationLink[];
  external?: boolean;  // NEW: Indicates link opens in new tab
}
```

Update the `NavLink` component to handle external links by conditionally rendering an `<a>` tag instead of using `ActiveLink` when `external` is true.

## Implementation Tasks

1. **care.config.ts**: Add `navLinks.docs` and `navLinks.nabh` configuration reading from env vars
2. **nav-main.tsx**: Extend `NavigationLink` interface with `external` flag and update `NavLink` component to support external links
3. **facility-nav.tsx**: Inject env-configured links into `generateFacilityLinks` (no plugin changes needed - already supported)
4. **admin-nav.tsx**: Inject env-configured links into `generateAdminLinks` (no plugin changes needed - already supported)
5. **nav-user.tsx**: Inject env-configured links into `FacilityNavUser` dropdown (no plugin changes needed - already supported)
6. **i18n**: Add translation keys for "Documentation" and "NABH Certification" to `public/locale/en.json`
7. **Testing**: Manual verification in dev environment with env vars set; plugin testing deferred per QA note

## Repositories Touched

- **yash-learner/care_fe_agent_hq** (this repository) - All changes are frontend-only

## New Dependencies

None - all functionality uses existing patterns and dependencies.

## Edge Cases and Considerations

1. **No env vars set**: Links should not appear (default behavior preserved) - use conditional rendering based on config values
2. **Invalid URLs**: No validation at config level - invalid URLs will be rendered as-is (browser handles navigation errors)
3. **Plugin conflicts**: Plugins can add arbitrary links; no namespace collision prevention needed as they're explicitly separate concerns
4. **Mobile responsive**: Existing sidebar and dropdown components handle mobile responsiveness; no special handling required
5. **Accessibility**: External links need proper ARIA labels and security attributes (`rel="noopener noreferrer"`)
6. **Translation**: Use i18n for link names; URLs come from env and should not be translated

## Testing Strategy

### Manual Testing (Required)
1. Set `REACT_NAV_DOCS_LINK` and `REACT_NAV_NABH_LINK` in `.env.local`
2. Verify links appear in facility sidebar, admin sidebar, and user dropdown
3. Click links and verify they open in new tabs
4. Test with no env vars set - verify links do not appear
5. Test mobile responsive behavior

### Plugin Testing (Deferred)
Per QA note: Current QA environment lacks plugin support. Plugin integration code will be implemented (already mostly exists), but live plugin testing is deferred to a future iteration with proper plugin context.

### Automated Testing
Consider adding Playwright tests for env-configured links once testing infrastructure supports dynamic env var injection.

## Success Criteria

All acceptance criteria from spec.md are met:
1. ✅ Documentation link appears when `REACT_NAV_DOCS_LINK` is set
2. ✅ NABH link appears when `REACT_NAV_NABH_LINK` is set
3. ✅ Links open in new tabs
4. ✅ Plugin `navItems` integrate with facility nav (already supported)
5. ✅ Plugin `adminNavItems` integrate with admin nav (already supported)
6. ✅ Plugin `userNavItems` integrate with user dropdown (already supported)
7. ✅ No env vars = no extra links (existing behavior preserved)
