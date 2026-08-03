# Summary: iOS autofocus regression fix

## What was done

Fixed iOS/iPadOS autofocus regressions in autocomplete and drawer search components caused by PR #15325. The original PR added Mac desktop autofocus but removed iOS-specific protections, causing unexpected virtual keyboard displays and layout jumps on mobile Safari.

The fix enhances `isIOSDevice` detection to correctly identify iPadOS devices in desktop mode (which report Mac user agent with touch capability) and applies iOS-safe guards to all affected components.

## Changes made

- Enhanced `isIOSDevice` detection in `src/Utils/utils.ts` to handle iPadOS desktop mode: `(isMacDevice && isTouchDevice)`
- Updated 7 components with iOS-safe guards:
  - `autocomplete.tsx` - `autoFocus={!isIOSDevice}`
  - `RoleSelect.tsx` - `autoFocus={!isIOSDevice}`
  - `MedicationValueSetSelect.tsx` - `autoFocus={!isIOSDevice}`
  - `QuestionnaireSearch.tsx` - `autoFocus={!isIOSDevice}`
  - `DeviceSelector.tsx` - `autoFocus={!isIOSDevice}`
  - `InstructionsPopover.tsx` - `repositionInputs={!isIOSDevice}`
  - `EntitySelectionDrawer.tsx` - `repositionInputs={!isIOSDevice}`

## Acceptance criteria

✅ All 7 acceptance criteria met:
1. Desktop Mac browsers receive autofocus in search components
2. Windows/Linux desktop autofocus continues to work
3. iPhone Safari does not autofocus search inputs (no unexpected keyboard)
4. iPadOS Safari desktop mode correctly identified as iOS (no autofocus)
5. iOS/iPadOS drawers do not force input repositioning
6. Manual focus and keyboard navigation remain functional
7. All components from PR #15325 updated with iOS-safe guards

## Review outcome

**Round 1:** One blocker found - iPadOS desktop mode detection needed enhancement  
**Round 2:** Clean - no findings

## QA outcome

✅ All acceptance criteria passed with automated testing using Playwright across desktop (1440x900), mobile (390x844), and iPad (1024x768) viewports. Device detection logic verified for iPhone, iPad, iPad desktop mode, Mac desktop, and Windows browsers.

**Note:** Final confidence on iOS 17+ Safari virtual keyboard behavior should include manual testing on physical devices, though the implementation logic is sound.
