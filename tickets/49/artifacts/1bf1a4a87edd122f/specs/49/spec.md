# Spec: Show app version in login page footer

## Problem

CARE is deployed independently by many operators, and support engineers need to know which version is running when triaging bug reports. Currently, the login page footer shows DPG/OHC logos and links, but no version information, forcing support to waste a round-trip (often a day across time zones) asking "which version are you on?" Field staff cannot be asked to inspect network requests or developer tools.

## Acceptance Criteria

1. Given a signed-out visitor on `/login`, when the page loads, then the footer displays the app version (build UUID from `build-meta.json`) as small muted text.
2. Given the footer on desktop viewport, when the version text renders, then it does not wrap or overlap the existing GitHub and licenses links.
3. Given the footer with version displayed, when a user clicks the GitHub link, then it navigates to the GitHub repository as before.
4. Given the footer with version displayed, when a user clicks the licenses link, then it navigates to `/licenses` as before.

## Capability Notes

- `src/components/Auth/AuthHero.tsx:65-116` -- existing footer layout with DPG logo, OHC logo, GitHub link, licenses link
- `src/lib/appVersion.ts` -- exports `fetchBuildMeta()` to retrieve version from `/build-meta.json`
- `src/hooks/useAppVersion.ts` -- provides `useAppVersion()` hook with `versionInfo` containing the current version
- `scripts/generate-build-version.js` -- generates UUID version at build time, already called via `npm run build:meta`
- `public/build-meta.json` -- build metadata file containing `version` field (UUID) and `built_at` timestamp

## Open Questions

None.
