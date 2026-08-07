# QA Plan: Add support for inserting links in the left navbar

## Overview

This ticket adds support for custom navigation links via the `REACT_NAV_LINKS` environment variable. The acceptance criteria involve both build-time configuration (AC1, AC3, AC5) and runtime rendering behavior (AC2, AC4).

## Limitation: Build-Time Configuration

**Important**: AC1, AC3, and AC5 require setting `REACT_NAV_LINKS` environment variable before building the application. This is a **build-time configuration** that cannot be changed at runtime. These criteria are **manual-only** and validated via:

1. Code review of `care.config.ts` parsing logic
2. Automated E2E tests in `tests/sidebar/navLinks.spec.ts`
3. Manual verification with different env configs during development

Live QA will focus on AC2 (plugin nav items) and AC4 (ordering verification via code inspection).

## Research Map

- Routes: `src/Routers/routes/` → facility and admin pages
- Components:
  - `src/components/ui/sidebar/app-sidebar.tsx` — Main sidebar orchestration
  - `src/components/ui/sidebar/admin-nav.tsx` — Admin navigation with env links
  - `src/components/ui/sidebar/facility/facility-nav.tsx` — Facility navigation with env links
  - `src/components/ui/sidebar/nav-main.tsx` — Renders navigation links (supports external links)
  - `src/Utils/navLinks.tsx` — `processEnvNavLinks()` utility for env link processing
- Config: `care.config.ts` — Parses `REACT_NAV_LINKS` into `careConfig.navLinks`
- Types: `NavigationLink` interface in `nav-main.tsx`
- Auth: `tests/.auth/user.json` (admin user with facility access)
- Permissions: N/A (nav links are visible to all authenticated users)
- Fixtures: `load-fixtures` provides facility and admin access

---

## AC1 — Environment-configured links appear in sidebar (MANUAL-ONLY)

**Status**: Manual verification only. Requires rebuild with custom `REACT_NAV_LINKS`.

### Why Manual-Only

This criterion requires setting the `REACT_NAV_LINKS` environment variable before building the application. The live QA environment has a pre-built application and cannot inject environment variables at runtime.

### Manual Verification Steps (for implementer/developer)

1. Set environment variable:

   ```bash
   export REACT_NAV_LINKS='[{"name":"Documentation","url":"https://care.ohc.network/docs"},{"name":"NABH Certification","url":"https://example.com/nabh"}]'
   ```

2. Rebuild application:

   ```bash
   npm run build
   npm run preview
   ```

3. Navigate to `/facility/{facilityId}/overview`

4. **Expect**: Sidebar contains "Documentation" and "NABH Certification" links after core nav items

5. Click "Documentation" link

6. **Expect**: Opens in new tab with target URL

### Automated Coverage

- E2E tests: `tests/sidebar/navLinks.spec.ts` validates baseline structure
- Code review: `care.config.ts` parsing logic validates JSON parsing and error handling

---

## AC2 — Plugin nav items are injected (CODE REVIEW)

**Status**: Code review only. Test environment has no plugins configured.

### Why Code Review Only

The test environment does not have plugins enabled (`REACT_ENABLED_APPS` is not configured). Plugin nav injection is validated through:

1. Code review of `useCareApps()` hook and plugin manifest handling
2. Existing plugin integration patterns in codebase
3. Implementation inspection in `facility-nav.tsx` and `admin-nav.tsx`

### Code Inspection Points

1. **File**: `src/components/ui/sidebar/facility/facility-nav.tsx`
   - Lines 222-225: `useCareApps()` retrieves plugin nav items
   - Lines 212-215: Plugin links mapped with facility URL prefix
   - Ordering: Core links → processed env links → plugin links

2. **File**: `src/components/ui/sidebar/admin-nav.tsx`
   - Lines 89-92: `useCareApps()` retrieves plugin nav items
   - Line 83: Plugin nav items appended after env links
   - Ordering preserved: Core → env → plugin

3. **File**: `src/hooks/useCareApps.ts`
   - Plugin manifests define `navItems`, `adminNavItems`, `billingNavItems`
   - Hook returns parsed plugin nav items for consumption

### Expected Behavior (Documented)

When a plugin defines `navItems` in its manifest:

```json
{
  "navItems": [{ "name": "Custom Tool", "url": "custom-tool", "icon": "..." }]
}
```

The facility-nav and admin-nav components:

1. Retrieve items via `useCareApps()`
2. Append them after environment links
3. Prefix facility links with `/facility/{facilityId}/`

---

## AC3 — Links display with configured properties (MANUAL-ONLY)

**Status**: Manual verification only. Requires rebuild with custom `REACT_NAV_LINKS`.

### Why Manual-Only

Same limitation as AC1—requires build-time environment variable configuration.

### Manual Verification Steps (for implementer/developer)

1. Set environment variable with icon:

   ```bash
   export REACT_NAV_LINKS='[{"name":"Help","url":"https://help.example.com"}]'
   ```

2. Rebuild application:

   ```bash
   npm run build
   npm run preview
   ```

3. Navigate to `/facility/{facilityId}/overview`

4. **Expect**: Sidebar contains "Help" link with default external link icon

5. Click "Help" link

6. **Expect**:
   - Opens in new tab
   - Has `target="_blank"` attribute
   - Has `rel="noopener noreferrer"` attribute

### Automated Coverage

- E2E tests: `tests/sidebar/navLinks.spec.ts` validates external link handling
- Code review:
  - `src/Utils/navLinks.tsx` (`processEnvNavLinks`) adds external link detection
  - `src/components/ui/sidebar/nav-main.tsx` (`NavLink` component) handles external attribute

---

## AC4 — Link ordering: core → env → plugin (CODE INSPECTION)

**Status**: Code inspection. Live verification not practical without env/plugin config.

### Prerequisites

- Authenticated as admin user with facility access
- Application built with production code

### Data Setup

No additional data setup required. Uses default fixture facility.

### Steps

This criterion validates ordering through code inspection and structure verification.

1. **Action**: Navigate to `/facility/{facilityId}/overview`
   **Expect**: Facility sidebar loads
   **Record through**: yes

2. **Action**: Inspect sidebar navigation structure
   **Expect**: Core navigation links are visible in order:
   - Overview
   - Appointments
   - Queues
   - Patients
   - Services
   - Resource
   - Users
   - Billing
   - Settings
     **Record through**: yes

3. **Action**: Review code in `src/components/ui/sidebar/facility/facility-nav.tsx` lines 209-216
   **Expect**: Return statement shows ordering:

   ```typescript
   return [
     ...links,                    // Core facility links
     ...processedEnvLinks,        // Environment-configured links
     ...pluginLinks.map(...)      // Plugin links
   ];
   ```

   **Record through**: yes

4. **Action**: Review code in `src/components/ui/sidebar/admin-nav.tsx` line 83
   **Expect**: Return statement shows ordering:

   ```typescript
   return [...links, ...processedEnvLinks, ...pluginNavItems];
   ```

   **Record through**: yes

5. **Action**: Navigate to `/admin`
   **Expect**: Admin sidebar loads with core links (Questionnaire, Valuesets, RBAC, etc.)
   **Record through**: yes

### Success Looks Like

- Facility and admin sidebars render with core navigation links
- Code inspection confirms ordering: `[...core, ...env, ...plugin]` in both nav components
- Structure supports insertion of env/plugin links in correct positions

---

## AC5 — Invalid JSON logs console warning (MANUAL-ONLY)

**Status**: Manual verification only. Requires rebuild with invalid `REACT_NAV_LINKS`.

### Why Manual-Only

Requires build-time environment variable configuration with invalid JSON to test error handling.

### Manual Verification Steps (for implementer/developer)

1. Set invalid JSON:

   ```bash
   export REACT_NAV_LINKS='invalid-json'
   ```

2. Rebuild application:

   ```bash
   npm run build
   npm run preview
   ```

3. Open browser console

4. Navigate to `/facility/{facilityId}/overview`

5. **Expect**: Console warning:

   ```
   REACT_NAV_LINKS: Invalid JSON format. Navigation links will not be rendered.
   ```

6. **Expect**: Sidebar renders correctly without custom links

7. Set invalid array (missing required fields):

   ```bash
   export REACT_NAV_LINKS='[{"name":"NoURL"}]'
   ```

8. Rebuild and navigate

9. **Expect**: Console warning:
   ```
   REACT_NAV_LINKS: Each link must have 'name' and 'url' properties. Skipping invalid link: ...
   ```

### Automated Coverage

- Code review: `care.config.ts` lines 425-458 validate JSON parsing and field validation

---

## Test Plan / Notes

### E2E Test Coverage (Not Live QA)

File: `tests/sidebar/navLinks.spec.ts`

Tests cover:

- Baseline facility sidebar rendering structure
- Admin sidebar core navigation structure
- External link attribute handling (`target="_blank"`, `rel`)
- Sidebar collapse/expand behavior
- Link visibility filtering (visibility: false)
- Console warning detection for invalid config

### CI Requirements

- All E2E tests must pass
- ESLint and TypeScript compilation must pass
- Build must complete successfully

### Manual Testing Matrix (Developer/Staging)

| Config                         | Expected Behavior                                     |
| ------------------------------ | ----------------------------------------------------- |
| No `REACT_NAV_LINKS`           | Sidebar renders with core + plugin links only         |
| Valid JSON with 1 link         | Link appears after core, before plugin                |
| Valid JSON with multiple links | All links appear in order after core                  |
| External URL (https://)        | Opens in new tab with security attributes             |
| Internal URL (/admin)          | Opens in same tab                                     |
| Invalid JSON                   | Console warning, sidebar renders without custom links |
| Missing required fields        | Console warning, invalid links skipped                |

---

## Summary

**Live QA Scope**: AC2 and AC4 via code inspection and structure verification

**Manual-Only Scope**: AC1, AC3, AC5 (require build-time env configuration)

**Automated Coverage**: E2E tests validate baseline rendering, external link handling, and error cases

This approach acknowledges the build-time configuration limitation while providing comprehensive validation through automated tests, code review, and targeted manual verification during development.
