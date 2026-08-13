# QA Report: Custom Footer Links in Sidebar (Ticket 64)

## Summary

All acceptance criteria could not be exercised due to authentication failure in the test environment. The frontend application could not establish an authenticated session despite multiple recovery attempts including JWT refresh, UI login, and manual token injection.

## Authentication Attempts

### Attempts Made

1. **JWT Refresh**: Successfully refreshed tokens (status 200) from backend API
2. **UI Login**: Submitted login form with fixture credentials (admin/admin) - stayed on login page with no error messages
3. **Token Injection**: Manually injected valid tokens into localStorage via Playwright init script
4. **Direct API Test**: Confirmed backend login API works correctly and returns valid tokens

### Findings

- Backend API is functional (confirmed via curl)
- Backend login endpoint returns valid JWT tokens
- Frontend login form submits but does not navigate away from `/login`
- No error messages displayed on login page after submission
- Sidebar component fails to render even with valid tokens injected
- Multiple test approaches (openAuthedContext helper, manual login, token injection) all failed

### Logs and Evidence

- Auth attempts logged in `specs/64/qa-logs/` for each criterion
- Debug screenshots captured at `.agent-hq/debug-after-login.png` and `.agent-hq/debug-with-tokens.png`
- Test scripts created for each AC in `specs/64/qa-drivers/`

## Environment Context

- Frontend: Production build with `REACT_CUSTOM_FOOTER_LINKS` environment variable
- Backend: Django server running on port 9000, responding to API requests
- Auth State: Valid tokens present in `tests/.auth/user.json`
- Build: Rebuilt after adding environment variable configuration

## Live-flow Criteria

### AC1 — Custom footer links appear above NavUser in all sidebar contexts

**Verdict**: `not-exercised`

**Blocker**: Authentication failure prevented accessing any facility or admin pages where footer links would be displayed

**Attempts**:
1. Refreshed JWT tokens (success - status 200)
2. Attempted UI login via Playwright (failed - remained on login page)
3. Injected tokens manually into localStorage (failed - sidebar did not render)
4. Attempted openAuthedContext helper with multiple recovery paths (failed - all recovery attempts exhausted)

**Plan steps attempted**: Environment setup, token refresh, UI login, facility navigation - all blocked at authentication

**Driver**: `specs/64/qa-drivers/ac1-footer-links-all-contexts.mjs`
**Log**: `specs/64/qa-logs/ac1-footer-links-all-contexts.log`

---

### AC2 — External links open in new tab with external link icon

**Verdict**: `not-exercised`

**Blocker**: Authentication failure - could not reach facility page to verify external link behavior

**Attempts**: Same authentication attempts as AC1

**Plan steps attempted**: None beyond authentication - blocked at auth gate

**Driver**: `specs/64/qa-drivers/ac2-external-links.mjs` (created but not executable)
**Log**: `specs/64/qa-logs/ac2-external-links.log` (empty - no execution)

---

### AC3 — Internal links navigate in current tab with internal route icon

**Verdict**: `not-exercised`

**Blocker**: Authentication failure - could not reach facility page to verify internal link behavior

**Attempts**: Same authentication attempts as AC1

**Plan steps attempted**: None beyond authentication - blocked at auth gate

**Driver**: `specs/64/qa-drivers/ac3-internal-links.mjs` (created but not executable)
**Log**: `specs/64/qa-logs/ac3-internal-links.log` (empty - no execution)

---

### AC4 — Links filtered by visibleIn sidebar context

**Verdict**: `not-exercised`

**Blocker**: Authentication failure - could not navigate between facility and admin contexts to verify filtering

**Attempts**: Same authentication attempts as AC1

**Plan steps attempted**: None beyond authentication - blocked at auth gate

**Driver**: `specs/64/qa-drivers/ac4-context-filtering.mjs` (created but not executable)
**Log**: `specs/64/qa-logs/ac4-context-filtering.log` (empty - no execution)

---

### AC5 — Plugin footer links appear alongside config links

**Verdict**: `not-exercised`

**Blocker**: Plugin testing explicitly noted in QA plan as out of scope for live QA (requires plugin dev environment). Additionally, authentication failure would have blocked verification even if plugin testing were in scope.

**Notes**: Per QA plan, this AC was to be verified via code review only. Code review (Round 3) confirmed implementation: `src/pluginTypes.ts` line 210 adds `footerNavItems` to PluginManifest, and `src/components/ui/sidebar/nav-footer-links.tsx` lines 32-39 merge plugin links with config links.

**Driver**: Not applicable (out of scope)
**Log**: Not applicable (out of scope)

---

### AC6 — Tooltip displays link name when sidebar is collapsed

**Verdict**: `not-exercised`

**Blocker**: Authentication failure - could not reach facility page to collapse sidebar and verify tooltips

**Attempts**: Same authentication attempts as AC1

**Plan steps attempted**: None beyond authentication - blocked at auth gate

**Driver**: `specs/64/qa-drivers/ac6-tooltip-collapsed.mjs` (created but not executable)
**Log**: `specs/64/qa-logs/ac6-tooltip-collapsed.log` (empty - no execution)

---

### AC7 — Links appear in configuration order, stacked vertically

**Verdict**: `not-exercised`

**Blocker**: Authentication failure - could not reach facility page to verify link ordering and layout

**Attempts**: Same authentication attempts as AC1

**Plan steps attempted**: None beyond authentication - blocked at auth gate

**Driver**: `specs/64/qa-drivers/ac7-ordering-layout.mjs` (created but not executable)
**Log**: `specs/64/qa-logs/ac7-ordering-layout.log` (empty - no execution)

---

## Code Inspection

While live-flow verification was blocked, the following was confirmed via code review:

### Implementation Present

- `care.config.ts` lines 469-485: Environment variable `REACT_CUSTOM_FOOTER_LINKS` correctly parsed and typed
- `src/components/ui/sidebar/nav-footer-links.tsx`: Component implementation for rendering custom footer links
- `src/components/ui/sidebar/app-sidebar.tsx` line 193-204: NavFooterLinks component integrated into SidebarFooter above NavUser
- Icon differentiation: ExternalLink icon for `target="_blank"`, Link2 icon for `target="_self"`
- Context filtering: `visibleIn` property correctly filters links by SidebarFor enum
- Plugin integration: `src/pluginTypes.ts` footerNavItems support added to PluginManifest

### Configuration Verification

- `.env.local` created with three test links (CARE Documentation, Admin Panel, Third Link)
- Production build completed with environment variable baked in
- Preview server confirmed to include updated build

### Security

- External links have `rel="noopener noreferrer"` (line 97 of nav-footer-links.tsx)
- No hardcoded secrets or credentials
- Proper escaping and validation of config-driven content

## Limits

### What Could Not Be Verified

1. **Visual rendering**: Could not confirm links actually appear in sidebar footer
2. **Icon display**: Could not verify ExternalLink vs Link2 icon rendering
3. **Link functionality**: Could not test click behavior (new tab vs current tab navigation)
4. **Context filtering**: Could not verify `visibleIn` property works across facility/admin contexts
5. **Tooltip behavior**: Could not test hover tooltips in collapsed sidebar state
6. **Ordering and layout**: Could not verify vertical stacking and configuration order preservation
7. **Plugin integration**: Out of scope per QA plan (requires plugin dev environment)

### Known Issues

- **Authentication blocker**: The test environment's authentication flow is broken or incompatible with the production build. This is a blocker for all facility-scoped live QA.
- **Frontend login behavior**: Login form submission does not navigate away from `/login` page despite backend returning valid tokens
- **Token injection ineffective**: Even with valid JWT tokens injected into localStorage, the authenticated app shell does not render

### Recommendations

1. **Fix authentication**: Investigate why the production build's login flow fails with fixture credentials that work via direct API call
2. **Retry QA**: Once authentication is resolved, all seven acceptance criteria can be exercised following the drivers in `specs/64/qa-drivers/`
3. **Alternative verification**: Consider testing in development mode (`npm run dev`) if production build has authentication incompatibilities

## Conclusion

This QA pass encountered an environmental blocker (authentication failure) that prevented live-flow verification of all acceptance criteria. The implementation appears complete based on code review, but without a functioning authenticated session, the custom footer links feature could not be verified in the running application.

**All criteria marked**: `not-exercised` with `blocker_category: auth-failure`

**Next steps**: Resolve authentication issue in test environment and re-run QA drivers to obtain live-flow video evidence.
