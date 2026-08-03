# Specification: Fix iOS autofocus regressions in autocomplete and drawer search components

## Problem

PR #15325 added autofocus support for Mac desktop devices but removed iOS-specific focus protections, causing unwanted virtual keyboard behavior on iOS/iPadOS. Search inputs in autocomplete popovers and drawer components now autofocus on mobile Safari, triggering unexpected keyboard displays and layout jumps. This must be fixed while preserving Mac desktop autofocus functionality.

## Acceptance Criteria

1. Given a desktop Mac browser, when opening `autocomplete.tsx` search components, then the search input receives focus.
2. Given a Windows/Linux desktop browser, when opening autocomplete/command components, then autofocus behavior continues as expected.
3. Given an iPhone Safari browser, when opening drawer-based search components, then the search input does not autofocus and the keyboard does not open.
4. Given an iPadOS Safari browser in desktop mode, when opening drawer or autocomplete components, then the search input does not autofocus.
5. Given an iOS/iPadOS device, when a drawer with `repositionInputs` prop is opened, then the drawer does not force input repositioning.
6. Given any device, when manually focusing a search input, then keyboard navigation and accessibility features remain functional.
7. Given affected components from PR #15325, when autofocus logic is updated, then all seven identified components use iOS-safe guards.

## Capability Notes

- `src/Utils/utils.ts:100` -- `isIOSDevice` constant exists, checks `/iPhone|iPad|iPod/i` user agent pattern
- `src/Utils/utils.ts:101` -- `isMacDevice` constant exists, checks `/Mac/i` user agent pattern  
- `src/components/Questionnaire/ValueSetSearchContent.tsx:292` -- already uses `autoFocus={!isIOSDevice}` pattern (reference implementation)
- `src/pages/Admin/TagConfig/TagConfigForm.tsx:219` -- already uses `autoFocus={!isIOSDevice}` (reference implementation)
- `src/pages/Admin/TagConfig/components/TagConfigFormDrawer.tsx:73` -- already uses `repositionInputs={!isIOSDevice}` (reference implementation)

## Open Questions

None.
