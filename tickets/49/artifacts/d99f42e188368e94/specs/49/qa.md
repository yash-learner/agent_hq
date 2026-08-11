# QA Report: Ticket 49 - Show App Version in Login Page Footer

## Summary

**Date**: 2026-08-11  
**Environment**: Local development (http://localhost:4000)  
**Build version tested**: c62f73b6-31e6-4767-b4a3-a07367317849

**Overall result**: 2 of 3 acceptance criteria passed. One criterion failed due to layout wrapping.

---

## Live-flow Criteria

### AC1: Version Visible Without Authentication

**Verdict**: ✅ **PASS**

**What was tested**:
1. Navigated to http://localhost:4000/login (signed out)
2. Waited for page to fully load
3. Verified version text appears in footer

**Result**: The version "vc62f73b6-31e6-4767-b4a3-a07367317849" is successfully displayed in the footer without requiring authentication.

[version-visible](specs/49/videos/version-visible.webm)

![Version visible in footer](specs/49/screenshots/version-visible.png)

---

### AC2: No Wrapping or Overlapping on Desktop Viewport

**Verdict**: ❌ **FAIL**

**What was tested**:
1. Loaded login page with 1440×900 desktop viewport
2. Measured bounding boxes of footer elements:
   - GitHub link: x=64, y=657, width=133
   - Licenses link: x=217, y=657, width=187
   - Second pipe separator: x=412, y=657, width=4
   - Version span: x=64, y=659, width=484

**Issue found**: The version span's bounding box starts at x=64 (the left edge of the container) instead of continuing after the second pipe separator (which ends at x=416). This indicates the version text has wrapped to a new line.

**Expected**: Version text should appear inline after "GitHub | Licenses |" on the same row.

**Actual**: Version text appears to wrap to a new line, taking up the full width of the container (484px out of 512px).

[no-layout-break](specs/49/videos/no-layout-break.webm)

![Layout showing wrapping](specs/49/screenshots/no-layout-break.png)

---

### AC3: Links Still Function Correctly

**Verdict**: ✅ **PASS**

**What was tested**:
1. Verified GitHub link href and target attributes
2. Verified Licenses link href and target attributes  
3. Clicked Licenses link and confirmed new tab navigation

**Results**:
- ✓ GitHub link: href="https://github.com/ohcnetwork", target="_blank"
- ✓ Licenses link: href="/licenses", target="_blank"
- ✓ Licenses link opens new tab and navigates to http://localhost:4000/licenses

The existing footer links continue to work as expected after adding the version text.

[links-functional](specs/49/videos/links-functional.webm)

![Links functional](specs/49/screenshots/links-functional.png)

---

## Limits

- **Viewport tested**: Only 1440×900 desktop viewport was tested. Smaller viewports and mobile responsiveness were not evaluated.
- **Version string**: Tested with a long UUID-format version string (44 characters). Shorter version strings might not exhibit the wrapping issue.

---

## Code Inspection

The implementation correctly:
- Imports and uses the `useAppVersion` hook
- Conditionally renders the version only when `versionInfo.version` is available
- Applies appropriate styling classes (`text-xs text-secondary-500`)
- Includes pipe separator before the version

However, the long version string combined with the existing link text causes the footer content to exceed the container width, resulting in the version wrapping to a new line. This may require CSS adjustment (e.g., `white-space: nowrap` on the container, or truncating the version string, or accepting wrap as acceptable behavior).

---

## Next Steps

AC2 failure should be addressed. Possible solutions:
1. Add `white-space: nowrap` to the footer container to prevent wrapping
2. Truncate or shorten the version display (e.g., first 8 characters)
3. Accept wrapping as acceptable behavior and update the AC wording
4. Use a smaller font size for the version
5. Adjust container width or layout
