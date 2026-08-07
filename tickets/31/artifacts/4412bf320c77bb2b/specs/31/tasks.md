# Implementation Tasks: Left-nav hyperlinks via env config + plugin hooks

## Task 1: Add environment config parsing for nav links

**Repository:** yash-learner/care_fe_agent_hq

**What it touches:**
- `care.config.ts` — Add parsing for `REACT_NAV_LINKS` and `REACT_NABH_LINK` environment variables

**Dependencies:** None (foundational task)

**Size estimate:** ~30 lines

**Implementation details:**
1. Add two new environment variable parsers in `care.config.ts`:
   - `REACT_NAV_LINKS`: Parse JSON array of navigation link objects
   - `REACT_NABH_LINK`: Parse single JSON object for optional NABH link
2. Follow existing pattern from `customShortcuts` parsing (around line 305)
3. Handle invalid JSON gracefully:
   - Wrap parsing in try-catch
   - Log warning to console on parse error
   - Return empty array for `REACT_NAV_LINKS`, null for `REACT_NABH_LINK`
4. Validate required fields (`name`, `url`) and filter out invalid entries
5. Export parsed values from care.config.ts for use in components

**Example config format:**
```typescript
export const navLinks: NavigationLink[] = parseNavLinks(
  import.meta.env.REACT_NAV_LINKS
);
export const nabhLink: NavigationLink | null = parseNabhLink(
  import.meta.env.REACT_NABH_LINK
);
```

**Acceptance criteria covered:**
- AC1 (partial): Environment parsing foundation
- AC2 (partial): NABH link parsing foundation
- AC5: Invalid/empty env handling (no crash)

---

## Task 2: Extend NavigationLink interface for external links

**Repository:** yash-learner/care_fe_agent_hq

**What it touches:**
- `src/components/ui/sidebar/nav-main.tsx` — Update `NavigationLink` interface
- `src/pluginTypes.ts` — Document external link support in plugin nav types

**Dependencies:** None (parallel with Task 1)

**Size estimate:** ~20 lines

**Implementation details:**
1. Add `external?: boolean` field to `NavigationLink` interface in `nav-main.tsx` (around line 47-55)
2. Document that `external: true` means link opens in new tab with proper security attributes
3. Update JSDoc comments to explain external vs internal routing behavior
4. In `src/pluginTypes.ts`, document that plugin manifest nav arrays (`navItems`, `billingNavItems`, `userNavItems`, `adminNavItems`) support `external` field
5. Add TypeScript comment examples showing plugin external link usage

**Example interface update:**
```typescript
export interface NavigationLink {
  name: string;
  url: string;
  icon?: LucideIcon;
  visibility?: Visibility;
  children?: NavigationLink[];
  external?: boolean; // NEW: If true, opens in new tab; if false/undefined, uses internal routing
}
```

**Acceptance criteria covered:**
- AC4 (partial): External link type foundation
- AC6 (partial): Plugin external link type support

---

## Task 3: Update NavLink component to render external links

**Repository:** yash-learner/care_fe_agent_hq

**What it touches:**
- `src/components/ui/sidebar/nav-main.tsx` — Update `NavLink`, `NavItem`, and related components

**Dependencies:** Task 2 (requires `external` field in interface)

**Size estimate:** ~80 lines (conditional rendering logic in multiple components)

**Implementation details:**
1. Update `NavLink` component (around line 57-96):
   - Accept `external?: boolean` prop
   - When `external === true`, render `<a href={link.url} target="_blank" rel="noopener noreferrer">`
   - When `external === false` or undefined, render existing `<ActiveLink>` component
   - Preserve all existing styling and icon rendering
2. Update `NavItem` component (around line 257-278) for collapsed sidebar popover:
   - Apply same external link logic
   - Ensure popover links respect external attribute
3. Update `CollapsibleNavItem` child rendering (around line 232-245):
   - Child links should also support external attribute
4. Ensure keyboard navigation and accessibility work for both link types

**Example conditional rendering:**
```typescript
const NavLink = ({ link, className }: { link: NavigationLink; className?: string }) => {
  const content = (
    <>
      {link.icon && <link.icon />}
      <span>{link.name}</span>
    </>
  );

  if (link.external) {
    return (
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn("...", className)}
      >
        {content}
      </a>
    );
  }

  return (
    <ActiveLink href={link.url} className={cn("...", className)}>
      {content}
    </ActiveLink>
  );
};
```

**Acceptance criteria covered:**
- AC4: External links open in new tab with proper security attributes
- AC6 (partial): External link rendering for plugin links

---

## Task 4: Inject env links into FacilityNav component

**Repository:** yash-learner/care_fe_agent_hq

**What it touches:**
- `src/components/ui/sidebar/facility/facility-nav.tsx` — Merge env-configured links into facility navigation

**Dependencies:** Task 1 (requires parsed config), Task 3 (requires rendering support)

**Size estimate:** ~40 lines

**Implementation details:**
1. Import `navLinks` and `nabhLink` from `care.config.ts`
2. In the component (around line 217), merge env links into the `links` array:
   - Core facility links first (existing)
   - Plugin nav items next (already merged)
   - Env-configured general links (`navLinks`)
   - NABH link last (if configured)
3. Document link order in code comment
4. Filter out null/undefined entries (for when NABH link not configured)
5. Ensure no duplicate keys in merged array (use stable keys)

**Example merge logic:**
```typescript
const allLinks = [
  ...facilityNavLinks,           // Core links
  ...pluginNavItems,              // Plugin links
  ...careConfig.navLinks,         // Env general links
  ...(careConfig.nabhLink ? [careConfig.nabhLink] : []), // Optional NABH
];
```

**Acceptance criteria covered:**
- AC1: Documentation link appears in facility nav
- AC2: NABH link appears when configured, absent when not
- AC3: Multiple env links render without breaking core nav
- AC6 (partial): Plugin links merge alongside env links

---

## Task 5: Inject env links into AdminNav and FacilityNavUser components

**Repository:** yash-learner/care_fe_agent_hq

**What it touches:**
- `src/components/ui/sidebar/admin-nav.tsx` — Merge env links into admin navigation
- `src/components/ui/sidebar/nav-user.tsx` — Merge env links into user navigation

**Dependencies:** Task 1 (requires parsed config), Task 3 (requires rendering support)

**Size estimate:** ~40 lines (similar logic as Task 4, but for two additional nav contexts)

**Implementation details:**
1. In `admin-nav.tsx` (around line 85):
   - Import `navLinks` and `nabhLink` from care.config.ts
   - Merge env links into admin nav links array
   - Use same order as FacilityNav: core → plugin → env → NABH
2. In `nav-user.tsx` (around line 44):
   - Import and merge env links into user nav links
   - Apply same pattern
3. Document that env links appear in all nav contexts (shared config)
4. Note in code comments that future enhancement could add per-context env vars if needed

**Example for admin-nav.tsx:**
```typescript
const allAdminLinks = [
  ...adminNavLinks,              // Core admin links
  ...pluginAdminNavItems,        // Plugin admin links (if exists)
  ...careConfig.navLinks,        // Env links
  ...(careConfig.nabhLink ? [careConfig.nabhLink] : []),
];
```

**Acceptance criteria covered:**
- AC1: Documentation link appears in appropriate nav section (all contexts)
- AC2: NABH link behavior consistent across nav contexts
- AC3: Multiple env links render in all nav contexts

---

## Task 6: Add unit tests for env config parsing

**Repository:** yash-learner/care_fe_agent_hq

**What it touches:**
- New test file: `src/__tests__/care.config.test.ts` (or similar location matching existing test structure)

**Dependencies:** Task 1 (tests the parsing logic)

**Size estimate:** ~100 lines

**Implementation details:**
1. Test valid JSON parsing:
   - Single link
   - Multiple links
   - Link with all fields vs minimal fields
2. Test invalid JSON handling:
   - Malformed JSON returns empty array/null
   - Missing required fields (`name`, `url`) filters out entries
   - Empty string env var returns empty array/null
3. Test NABH link parsing:
   - Valid single object
   - Invalid/missing returns null
4. Mock `import.meta.env` values for tests
5. Verify no console errors beyond expected warnings

**Example test cases:**
```typescript
describe('navLinks config parsing', () => {
  it('parses valid JSON array', () => { ... });
  it('returns empty array on invalid JSON', () => { ... });
  it('filters entries missing required fields', () => { ... });
});

describe('nabhLink config parsing', () => {
  it('parses valid NABH link object', () => { ... });
  it('returns null when not configured', () => { ... });
});
```

**Acceptance criteria covered:**
- AC5: Invalid/empty env handling tested
- Verification of AC1, AC2 parsing logic

---

## Task 7: Add component tests for external link rendering

**Repository:** yash-learner/care_fe_agent_hq

**What it touches:**
- New test file: `src/components/ui/sidebar/__tests__/nav-main.test.tsx` (or similar)

**Dependencies:** Task 3 (tests the NavLink component changes)

**Size estimate:** ~120 lines

**Implementation details:**
1. Test `NavLink` with `external: true`:
   - Renders `<a>` element (not `<ActiveLink>`)
   - Has `target="_blank"` attribute
   - Has `rel="noopener noreferrer"` attribute
   - Correct href value
2. Test `NavLink` with `external: false` or undefined:
   - Renders `<ActiveLink>` component
   - Uses raviger routing
3. Test icon rendering for both link types
4. Test accessibility attributes (ARIA labels, keyboard navigation)
5. Use React Testing Library for component tests

**Example test:**
```typescript
describe('NavLink external links', () => {
  it('renders external link with security attributes', () => {
    const link = { name: 'Docs', url: 'https://docs.example.com', external: true };
    render(<NavLink link={link} />);
    const anchor = screen.getByRole('link', { name: 'Docs' });
    expect(anchor).toHaveAttribute('target', '_blank');
    expect(anchor).toHaveAttribute('rel', 'noopener noreferrer');
    expect(anchor).toHaveAttribute('href', 'https://docs.example.com');
  });

  it('renders internal link with ActiveLink', () => {
    const link = { name: 'Dashboard', url: '/dashboard' };
    render(<NavLink link={link} />);
    // Verify ActiveLink rendered (check for raviger-specific behavior)
  });
});
```

**Acceptance criteria covered:**
- AC4: External link rendering with proper attributes
- Verification of AC1, AC2 rendering

---

## Task 8: Add Playwright E2E test for env-configured nav links

**Repository:** yash-learner/care_fe_agent_hq

**What it touches:**
- New test file: `tests/facility/nav-links.spec.ts` (or similar location)
- Update `.env.local` or test setup with example env vars

**Dependencies:** All previous tasks (tests complete feature)

**Size estimate:** ~150 lines

**Implementation details:**
1. Set up test environment with configured env vars:
   - Document exact env var format in test or setup file
   - Example: `REACT_NAV_LINKS='[{"name":"Test Docs","url":"https://docs.example.com","external":true}]'`
   - Example: `REACT_NABH_LINK='{"name":"Test NABH","url":"https://nabh.example.com","external":true}]'`
2. Test AC1: Documentation link visible and clickable
   - Navigate to facility page
   - Open sidebar
   - Verify "Test Docs" link present
   - Click and verify opens in new tab (or check href/target attributes)
3. Test AC2: NABH link presence/absence
   - Test with NABH configured: verify link appears
   - Test without NABH: verify link does not appear (may require separate test run or conditional config)
4. Test AC3: Multiple links coexist with core nav
   - Configure multiple env links
   - Verify all appear
   - Verify existing nav items (Dashboard, Patients, etc.) still work
5. Test AC5: Empty/invalid config handling
   - Test with empty `REACT_NAV_LINKS`
   - Verify no crash, sidebar renders normally
6. Add video recording for key scenarios (use Playwright's video feature)
7. Document in test comments: AC6 (plugin external links) deferred to later testing when plugin context available

**Example test structure:**
```typescript
test.describe('Environment-configured nav links', () => {
  test('should display documentation link from env config', async ({ page }) => {
    // AC1
    await page.goto('/facility/...');
    await page.click('[data-testid="sidebar-toggle"]'); // or appropriate selector
    const docsLink = page.locator('text=Test Docs');
    await expect(docsLink).toBeVisible();
    await expect(docsLink).toHaveAttribute('href', 'https://docs.example.com');
    await expect(docsLink).toHaveAttribute('target', '_blank');
  });

  test('should display NABH link when configured', async ({ page }) => {
    // AC2
    await page.goto('/facility/...');
    // ... verify NABH link present
  });

  test('should not crash with empty config', async ({ page }) => {
    // AC5 - requires test with empty env
    await page.goto('/facility/...');
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
  });
});
```

**QA notes in test:**
- Add comment that plugin external link test (AC6) is deferred: "Plugin E2E deferred - no plugins in QA env; retest later"
- Mark corresponding test as `test.skip()` or document as `not-exercised` in qa-report

**Acceptance criteria covered:**
- AC1: Documentation link visible and functional (video)
- AC2: NABH link optional behavior (video)
- AC3: Multiple links coexist with core nav (video)
- AC5: Empty/invalid env handling (video)
- AC6: Documented as deferred (not-exercised)

---

## Task 9: Update documentation and add example env config

**Repository:** yash-learner/care_fe_agent_hq

**What it touches:**
- `README.md` or `docs/` — Document new env variables
- `.env.example` or `.env.docker` — Add example configuration

**Dependencies:** All implementation tasks (documents complete feature)

**Size estimate:** ~50 lines

**Implementation details:**
1. Add section to README (or appropriate docs file) explaining:
   - Purpose of `REACT_NAV_LINKS` and `REACT_NABH_LINK`
   - JSON format requirements
   - Example configurations
   - Behavior when not configured (no links added)
2. Add example entries to `.env.example`:
   ```bash
   # Optional: Additional navigation links (JSON array)
   REACT_NAV_LINKS='[{"name":"Documentation","url":"https://docs.example.com","external":true}]'
   
   # Optional: NABH certification link (JSON object)
   REACT_NABH_LINK='{"name":"NABH Certification","url":"https://nabh.example.com/cert.pdf","external":true}'
   ```
3. Document link order: core → plugin → env → NABH
4. Note that links appear in all nav contexts (facility, admin, user)
5. Add plugin documentation: how plugin manifests can include external links with `external: true`

**Acceptance criteria covered:**
- AC7: Documentation for env config (implicit - good practice)
- Supports operators configuring AC1, AC2

---

## Coverage verification

All acceptance criteria mapped to tasks:

- **AC1** (Docs link from env): Tasks 1, 4, 5, 6, 7, 8
- **AC2** (Optional NABH link): Tasks 1, 4, 5, 6, 7, 8
- **AC3** (Multiple links, no breakage): Tasks 4, 5, 8
- **AC4** (External link security attributes): Tasks 2, 3, 7, 8
- **AC5** (Invalid env handling): Tasks 1, 6, 8
- **AC6** (Plugin external links): Tasks 2, 3, 4 (type support), 8 (deferred E2E)
- **AC7** (i18n for chrome strings): N/A - no new chrome strings needed; operator labels free text (note in Task 9 docs)

All acceptance criteria covered. Tasks are sequenced to build foundation (config, types) before UI (components) and finally validation (tests, docs).
