# Spec: Allow users to customise toast location in Care FE

## Problem Statement

This feature has already been implemented. Toast notification position is fully configurable via the `REACT_TOAST_POSITION` environment variable with support for six valid positions. The implementation includes validation, default fallback to "top-center", and complete documentation in `.example.env`.

## Acceptance Criteria

Given this feature is already implemented, no new acceptance criteria are required. The existing implementation satisfies:

1. Given no `REACT_TOAST_POSITION` is set, when the app loads, then toast notifications appear at top-center.
2. Given `REACT_TOAST_POSITION` is set to "bottom-right", when a toast notification is triggered, then it appears at the bottom-right of the screen.
3. Given `REACT_TOAST_POSITION` is set to an invalid value, when the app loads, then a console warning is logged and the position defaults to top-center.
4. Given the `.example.env` file, when a developer reads it, then they can see `REACT_TOAST_POSITION` documented with all six valid position values and the default.

## Capability Notes

- `care.config.ts:176-198` -- Toast position configuration exists with full validation logic
- `.example.env:111-114` -- Environment variable is documented with valid values and default
- `src/App.tsx:59-60` -- Toaster component uses `careConfig.toastPosition` prop
- `src/components/ui/sonner.tsx:10` -- Base Toaster component wrapper from shadcn/ui
- Valid positions: `top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right`

## Open Questions

None. The feature is fully implemented and operational.
