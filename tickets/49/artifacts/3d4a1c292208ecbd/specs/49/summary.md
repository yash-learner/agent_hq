# Summary: Show app version in login page footer

## What was done

Added version display to the login page footer (`src/components/Auth/AuthHero.tsx`), showing the build UUID in small muted text alongside the existing GitHub and licenses links. The version is sourced from `/public/build-meta.json` via the existing `useAppVersion()` hook.

## Acceptance criteria

2 of 3 acceptance criteria passed:

1. ✅ Version displays on `/login` without authentication — shows `v{uuid}` format in footer
2. ❌ Desktop viewport layout preserved — version text wrapped to a new line instead of staying inline with GitHub and Licenses links
3. ✅ GitHub and Licenses links navigate as before — open expected URLs in new tabs

## QA outcome

**Status**: 2/3 criteria passed with live-flow video evidence.

**Failure**: AC2 failed because the version text (44-character UUID) wrapped to a new line on a 1440×900 viewport. The version span's bounding box starts at x=64 (left edge) instead of continuing inline after the second pipe separator at x=416.

**What works**: Version is successfully visible without authentication, and existing links function correctly.

**Next steps**: AC2 failure needs resolution. Possible approaches: add `white-space: nowrap` to footer container, truncate version to first 8 characters, use smaller font, or accept wrapping as acceptable behavior and update the AC.
