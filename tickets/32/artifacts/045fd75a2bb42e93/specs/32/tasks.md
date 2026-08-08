# Implementation Tasks: Navbar Documentation and NABH Links

## Overview

This ticket adds environment-configurable navigation links (Documentation and NABH Certification) to the left sidebar and extends plugin support for custom navigation items. All work is in the care_fe repository (yash-learner/care_fe_agent_hq).

## Task List

### Task 1: Configuration and Type Infrastructure
**Repo:** yash-learner/care_fe_agent_hq  
**Dependencies:** None  
**Size:** ~50 lines  
**Acceptance Criteria Covered:** AC7 (foundation for AC1, AC2)

**Changes:**
1. **care.config.ts**: Add `navLinks` configuration object with `docs` and `nabh` fields reading from `REACT_NAV_DOCS_LINK` and `REACT_NAV_NABH_LINK` env vars
2. **src/components/ui/sidebar/nav-main.tsx**: Extend `NavigationLink` interface to add optional `external?: boolean` field for external link handling
3. **src/components/ui/sidebar/nav-main.tsx**: Update `NavLink` component to conditionally render external links with `<a target="_blank" rel="noopener noreferrer">` instead of `ActiveLink` when `external` is true

**What it touches:**
- Configuration layer (care.config.ts)
- Navigation type definitions (nav-main.tsx interface)
- Navigation rendering logic (nav-main.tsx component)

### Task 2: Facility Navigation Links
**Repo:** yash-learner/care_fe_agent_hq  
**Dependencies:** Task 1  
**Size:** ~40 lines  
**Acceptance Criteria Covered:** AC1, AC2, AC3, AC4, AC7

**Changes:**
1. **src/components/ui/sidebar/facility/facility-nav.tsx**: Import `careConfig` from care.config.ts
2. **src/components/ui/sidebar/facility/facility-nav.tsx**: In `generateFacilityLinks`, add environment-configured links (docs, NABH) after base facility links and before plugin links
3. Map env-configured URLs to `NavigationLink` objects with `external: true` flag
4. Use appropriate icons (e.g., `FileText` for docs, `Award` for NABH from lucide-react)
5. Use i18n keys for link names: `nav.documentation` and `nav.nabh_certification`

**What it touches:**
- Facility navigation generation logic

**Notes:**
- Plugin `navItems` support already exists at line 204-209 and 217-219 (AC4 already met)
- Conditional rendering ensures AC7 (no env vars = no extra links)

### Task 3: Admin Navigation Links
**Repo:** yash-learner/care_fe_agent_hq  
**Dependencies:** Task 1  
**Size:** ~40 lines  
**Acceptance Criteria Covered:** AC1, AC2, AC3, AC5, AC7

**Changes:**
1. **src/components/ui/sidebar/admin-nav.tsx**: Import `careConfig` from care.config.ts
2. **src/components/ui/sidebar/admin-nav.tsx**: In `generateAdminLinks`, add environment-configured links (docs, NABH) after base admin links and before plugin links
3. Map env-configured URLs to `NavigationLink` objects with `external: true` flag
4. Use same icons and i18n keys as facility nav for consistency

**What it touches:**
- Admin navigation generation logic

**Notes:**
- Plugin `adminNavItems` support already exists at line 75 and 84-87 (AC5 already met)

### Task 4: User Dropdown Menu Links
**Repo:** yash-learner/care_fe_agent_hq  
**Dependencies:** Task 1  
**Size:** ~50 lines  
**Acceptance Criteria Covered:** AC1, AC2, AC3, AC6, AC7

**Changes:**
1. **src/components/ui/sidebar/nav-user.tsx**: Import `careConfig` from care.config.ts
2. **src/components/ui/sidebar/nav-user.tsx**: In `FacilityNavUser` component, add environment-configured links to the dropdown menu
3. Insert links in a `DropdownMenuGroup` alongside existing profile and plugin items
4. Use `onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}` for external link handling
5. Use `DropdownMenuItem` with proper icons and i18n keys

**What it touches:**
- User dropdown menu rendering logic

**Notes:**
- Plugin `userNavItems` support already exists at line 44-46 and 118-130 (AC6 already met)

### Task 5: Internationalization
**Repo:** yash-learner/care_fe_agent_hq  
**Dependencies:** Tasks 2-4  
**Size:** ~5 lines  
**Acceptance Criteria Covered:** Supporting AC1, AC2

**Changes:**
1. **public/locale/en.json**: Append new translation keys at the end of the JSON file:
   - `"nav.documentation": "Documentation"`
   - `"nav.nabh_certification": "NABH Certification"`

**What it touches:**
- English locale file

**Notes:**
- Non-English locales managed via Crowdin; do not edit directly

### Task 6: Manual Verification
**Repo:** yash-learner/care_fe_agent_hq  
**Dependencies:** Tasks 1-5  
**Size:** Testing only (no code changes)  
**Acceptance Criteria Covered:** AC1, AC2, AC3, AC7

**Testing Steps:**
1. Set `.env.local` with test values:
   ```
   REACT_NAV_DOCS_LINK=https://docs.example.com
   REACT_NAV_NABH_LINK=https://nabh.example.com
   ```
2. Run `npm run dev` and verify:
   - Documentation and NABH links appear in facility sidebar
   - Documentation and NABH links appear in admin sidebar
   - Documentation and NABH links appear in user dropdown menu
   - Clicking links opens URLs in new tabs
3. Remove env vars and verify:
   - No extra links appear (existing behavior preserved)
4. Test mobile responsive behavior
5. Test keyboard navigation and screen reader accessibility

**What it touches:**
- Manual testing in running application

**Notes:**
- Plugin testing (AC4, AC5, AC6) deferred per QA note: current QA environment lacks plugin support
- Plugin integration code is implemented but live plugin testing will occur in a future iteration

## Acceptance Criteria Coverage Matrix

| AC | Description | Covered By |
|----|-------------|------------|
| AC1 | `REACT_NAV_DOCS_LINK` env var → Documentation link appears | Tasks 1, 2, 3, 4, 5, 6 |
| AC2 | `REACT_NAV_NABH_LINK` env var → NABH link appears | Tasks 1, 2, 3, 4, 5, 6 |
| AC3 | Clicking env-configured link opens URL in new tab | Tasks 1, 2, 3, 4, 6 |
| AC4 | Plugin `navItems` appear in facility sidebar | Task 2 (already exists; verified) |
| AC5 | Plugin `adminNavItems` appear in admin sidebar | Task 3 (already exists; verified) |
| AC6 | Plugin `userNavItems` appear in user dropdown | Task 4 (already exists; verified) |
| AC7 | No env vars = no extra links | Tasks 1, 2, 3, 4, 6 |

## Implementation Notes

1. **Single Repository:** All changes are in `yash-learner/care_fe_agent_hq` (frontend only)
2. **Estimated Total LOC:** ~185 lines changed/added
3. **No New Dependencies:** Uses existing patterns, hooks, and components
4. **Plugin Support Status:** 
   - AC4, AC5, AC6 already implemented in existing codebase
   - No code changes needed for plugin support
   - Live plugin testing deferred per QA note
5. **External Link Security:** All external links use `target="_blank"` with `rel="noopener noreferrer"` for security
6. **Conditional Rendering:** Links only appear when env vars are set (AC7)
7. **Accessibility:** External links need proper ARIA labels and visual indicators where appropriate
