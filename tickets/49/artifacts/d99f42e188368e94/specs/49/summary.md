# Summary: Show app version in login page footer

## What was done

Added version display to the login page footer (`src/components/Auth/AuthHero.tsx`), showing the build UUID in small muted text alongside the existing GitHub and licenses links. The version is sourced from `/public/build-meta.json` via the existing `useAppVersion()` hook.

## Acceptance criteria

All four acceptance criteria were met:

1. ✅ Version displays on `/login` without authentication — shows `v{uuid}` format in footer
2. ✅ Desktop viewport layout preserved — no wrapping or overlap at standard desktop sizes (1440px+)
3. ✅ GitHub link navigates as before — opens repository in new tab
4. ✅ Licenses link navigates as before — opens `/licenses` in new tab

## Review outcome

Clean implementation — no findings in code review.

## QA outcome

All acceptance criteria passed with live-flow video evidence. Build version `48c144e9-896d-427d-a482-33df89d40f55` verified on local preview server.

Support engineers can now see the running app version directly on the login page, eliminating the round-trip to establish deployed version when triaging bug reports.
