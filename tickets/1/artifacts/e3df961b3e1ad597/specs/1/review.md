# Review

## Round 1

- **blocker** `src/Utils/utils.ts:100` — `isIOSDevice` does not detect iPadOS 13+ Safari in desktop mode. iPads in desktop mode report "Mac" user agent, causing them to be treated as desktops and receive autofocus. Add iPadOS desktop mode detection: `export const isIOSDevice = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (isMacDevice && isTouchDevice);`

## Round 2

Clean — no findings.
