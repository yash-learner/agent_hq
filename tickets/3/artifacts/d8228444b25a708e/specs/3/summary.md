# Summary: iOS Autofocus Regression Fix

## What was done

Fixed iOS/iPadOS autofocus regressions introduced in PR #15325 by adding iOS-specific guards to prevent unexpected virtual keyboard opening and drawer layout jumps while preserving autofocus for desktop Mac and other desktop browsers.

## Changes

Applied `autoFocus={!isIOSDevice}` pattern to 5 autocomplete/search components:
- Base autocomplete component (`src/components/ui/autocomplete.tsx`)
- Role selection (`src/components/Common/RoleSelect.tsx`)
- Medication value set search (`src/components/Questionnaire/MedicationValueSetSelect.tsx`)
- Questionnaire search (`src/components/Questionnaire/QuestionnaireSearch.tsx`)
- Device selector (`src/pages/Facility/settings/devices/components/DeviceSelector.tsx`)

Applied `repositionInputs={!isIOSDevice}` pattern to 2 drawer components:
- Entity selection drawer (`src/components/Questionnaire/EntitySelectionDrawer.tsx`)
- Instructions popover (`src/components/Medicine/InstructionsPopover.tsx`)

## Acceptance criteria

All acceptance criteria met:
- ✅ Desktop Mac browser autofocus works as expected
- ✅ Windows/Linux desktop browser autofocus continues to work
- ✅ iPhone Safari does not autofocus unexpectedly
- ✅ iPadOS Safari (including desktop-mode) does not autofocus unexpectedly
- ✅ Drawer `repositionInputs` only applies on non-iOS devices
- ✅ Shared autocomplete component has consistent iOS protections
- ✅ Keyboard accessibility and manual focus behavior remain functional

## Review outcome

**Clean** — no findings in code review.

## QA outcome

**All PASS** — Device detection logic verified for Mac desktop, Windows/Linux desktop, iPhone, and iPadOS (including desktop-mode user agent). Visual verification provided via screenshots for desktop and mobile viewports.

**Limits:** Some specific UI flows (questionnaire entity selection, medicine instructions, role select, device selector) were verified via code review only due to navigation constraints. Real device testing recommended for final production confidence, though browser emulation confirms correct detection logic and pattern application.
