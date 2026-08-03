# iOS Autofocus Regression Fix

## Problem

PR #15325 added Mac desktop autofocus but accidentally removed iOS/iPadOS protections, causing virtual keyboards to open unexpectedly and drawer inputs to jump on iOS/iPadOS devices. The regression affects autocomplete, search command components, and drawers that use unconditional autofocus or `repositionInputs`, breaking the mobile user experience.

## Acceptance Criteria

- Given a desktop Mac browser, when opening any autocomplete/search command component, then the search input receives focus where autofocus is expected.
- Given a Windows/Linux desktop browser, when opening any autocomplete/search command component, then existing autofocus behavior continues to work as before.
- Given an iPhone Safari browser, when opening any autocomplete/search drawer component, then the search input does not autofocus and the virtual keyboard does not open unexpectedly.
- Given an iPadOS Safari browser (including desktop-mode user agent), when opening any autocomplete/search drawer component, then the search input does not autofocus unexpectedly.
- Given a mobile drawer flow with inputs on iOS/iPadOS, when `repositionInputs` is used, then it only applies on non-iOS devices to prevent keyboard/layout jump issues.
- Given the shared autocomplete component, when used in any feature (role select, medication, device, questionnaire), then iOS protections apply consistently across all uses.
- Given keyboard accessibility and manual focus behavior, when interacting with search components, then accessibility and usability remain functional.

## Capability Notes

- `src/Utils/utils.ts:isIOSDevice` -- exists, detects iPhone/iPad/iPod via user agent.
- `src/components/ui/autocomplete.tsx:CommandInput` -- exists, currently uses unconditional `autoFocus` on line 152.
- `src/components/Common/RoleSelect.tsx:CommandInput` -- exists, currently uses unconditional `autoFocus` on line 70.
- `src/components/Questionnaire/ValueSetSearchContent.tsx:CommandInput` -- exists, correctly uses `autoFocus={!isIOSDevice}` on line 292 as reference pattern.
- `src/components/Questionnaire/EntitySelectionDrawer.tsx:Drawer` -- exists, uses `repositionInputs` unconditionally on line 184, needs iOS guard.

## Open Questions

None.
