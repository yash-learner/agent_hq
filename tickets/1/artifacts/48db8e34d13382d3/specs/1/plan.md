# Implementation Plan: Fix iOS Autofocus Regressions

## Problem Summary

PR #15325 introduced autofocus support for Mac desktop devices but removed iOS-specific focus protections, causing unwanted behavior on iOS/iPadOS:
- Virtual keyboard opens unexpectedly when search dialogs open
- Drawer layout jumps due to forced input repositioning
- Focus stealing disrupts user workflow
- Potential VoiceOver accessibility issues

The fix must restore iOS/iPadOS protections while preserving Mac desktop autofocus functionality.

## Implementation Approach

### 1. Device Detection Verification

**File:** `src/Utils/utils.ts`

Verify that `isIOSDevice` correctly identifies iOS and iPadOS devices, including iPadOS Safari in desktop mode. The current implementation:

```typescript
export const isIOSDevice = /iPhone|iPad|iPod/i.test(navigator.userAgent);
```

Should correctly match iOS and iPadOS. However, iPadOS Safari in desktop mode may report a Mac-like user agent. If needed, add a touch-based check similar to the old logic:

```typescript
export const isIOSDevice = /iPhone|iPad|iPod/i.test(navigator.userAgent) || 
  (/Mac/i.test(navigator.userAgent) && 'ontouchstart' in window);
```

### 2. Core Autocomplete Component Fix

**File:** `src/components/ui/autocomplete.tsx` (line 152)

**Current code:**
```typescript
<CommandInput
  // ...
  autoFocus
/>
```

**Fix:**
```typescript
import { isIOSDevice } from "@/Utils/utils";

<CommandInput
  // ...
  autoFocus={!isIOSDevice}
/>
```

This affects both mobile drawer and desktop popover modes since the same `commandContent` is used in both.

### 3. Component-Specific Fixes

Apply the `autoFocus={!isIOSDevice}` pattern to the following components:

#### a. RoleSelect Component
**File:** `src/components/Common/RoleSelect.tsx` (line 70)

**Current:**
```typescript
<CommandInput
  // ...
  autoFocus
/>
```

**Fix:**
```typescript
import { isIOSDevice } from "@/Utils/utils";

<CommandInput
  // ...
  autoFocus={!isIOSDevice}
/>
```

#### b. QuestionnaireSearch Component
**File:** `src/components/Questionnaire/QuestionnaireSearch.tsx` (line 87)

**Current:**
```typescript
<CommandInput
  // ...
  autoFocus
/>
```

**Fix:**
```typescript
import { isIOSDevice } from "@/Utils/utils";

<CommandInput
  // ...
  autoFocus={!isIOSDevice}
/>
```

#### c. MedicationValueSetSelect Component
**File:** `src/components/Questionnaire/MedicationValueSetSelect.tsx` (line 506)

**Current:**
```typescript
<CommandInput
  // ...
  autoFocus
/>
```

**Fix:**
```typescript
import { isIOSDevice } from "@/Utils/utils";

<CommandInput
  // ...
  autoFocus={!isIOSDevice}
/>
```

#### d. DeviceSelector Component
**File:** `src/pages/Facility/settings/devices/components/DeviceSelector.tsx` (line 62)

**Current:**
```typescript
<CommandInput
  // ...
  autoFocus
/>
```

**Fix:**
```typescript
import { isIOSDevice } from "@/Utils/utils";

<CommandInput
  // ...
  autoFocus={!isIOSDevice}
/>
```

### 4. Drawer repositionInputs Fixes

Apply the `repositionInputs={!isIOSDevice}` pattern to drawer components:

#### a. InstructionsPopover Component
**File:** `src/components/Medicine/InstructionsPopover.tsx` (line 154)

**Current:**
```typescript
<Drawer repositionInputs>
```

**Fix:**
```typescript
import { isIOSDevice } from "@/Utils/utils";

<Drawer repositionInputs={!isIOSDevice}>
```

#### b. EntitySelectionDrawer Component
**File:** `src/components/Questionnaire/EntitySelectionDrawer.tsx` (line 184)

**Current:**
```typescript
<Drawer open={open} onOpenChange={onOpenChange} repositionInputs>
```

**Fix:**
```typescript
import { isIOSDevice } from "@/Utils/utils";

<Drawer open={open} onOpenChange={onOpenChange} repositionInputs={!isIOSDevice}>
```

## Reference Implementations

The following components already implement the correct pattern and should be used as references:

1. `src/components/Questionnaire/ValueSetSearchContent.tsx:292` - uses `autoFocus={!isIOSDevice}`
2. `src/pages/Admin/TagConfig/TagConfigForm.tsx:219` - uses `autoFocus={!isIOSDevice}`
3. `src/pages/Admin/TagConfig/components/TagConfigFormDrawer.tsx:73` - uses `repositionInputs={!isIOSDevice}`

## Affected Components Summary

### Components requiring `autoFocus={!isIOSDevice}`:
1. `src/components/ui/autocomplete.tsx` (line 152) - **Core component affecting all autocomplete usage**
2. `src/components/Common/RoleSelect.tsx` (line 70)
3. `src/components/Questionnaire/QuestionnaireSearch.tsx` (line 87)
4. `src/components/Questionnaire/MedicationValueSetSelect.tsx` (line 506)
5. `src/pages/Facility/settings/devices/components/DeviceSelector.tsx` (line 62)

### Components requiring `repositionInputs={!isIOSDevice}`:
1. `src/components/Medicine/InstructionsPopover.tsx` (line 154)
2. `src/components/Questionnaire/EntitySelectionDrawer.tsx` (line 184)

## Repositories Touched

- **care_fe** (care_fe_agent_hq) - All changes are in the frontend repository

## Dependencies

No new dependencies required. The implementation uses:
- Existing `isIOSDevice` utility from `src/Utils/utils.ts`
- Existing component infrastructure (CommandInput, Drawer)

## Testing Strategy

### Manual Testing Requirements

Test on multiple platforms:

1. **Desktop Mac (Safari, Chrome)**
   - Open autocomplete components → input should autofocus
   - Open role selection → input should autofocus
   - Open questionnaire search → input should autofocus
   - Open medication search → input should autofocus
   - Open device selector → input should autofocus

2. **Windows/Linux Desktop**
   - Same tests as Mac → autofocus should work

3. **iPhone Safari (iOS)**
   - Open autocomplete drawers → NO autofocus, keyboard stays closed
   - Open role selection drawer → NO autofocus
   - Open questionnaire search drawer → NO autofocus
   - Open medication search drawer → NO autofocus
   - Open device selector drawer → NO autofocus
   - Open instructions popover → no layout jump
   - Open entity selection drawer → no layout jump

4. **iPadOS Safari (including desktop mode)**
   - Same tests as iPhone → should NOT autofocus even in desktop mode

5. **Accessibility**
   - Manual focus still works with keyboard/screen readers
   - VoiceOver navigation unaffected

### Browser DevTools Testing

If real iOS devices unavailable:
- Chrome DevTools device emulation (iOS Safari)
- Note: Final validation should include real iOS/iPadOS testing

## Risk Assessment

**Low Risk** - This is a targeted fix that:
- Uses existing, proven patterns from other components
- Only affects focus behavior, not functionality
- Follows established iOS-specific guards already in the codebase
- Does not change any data flows or business logic

## Rollback Plan

If issues arise, the changes can be easily reverted by:
1. Removing the `{!isIOSDevice}` conditionals
2. Reverting to unconditional `autoFocus` or `repositionInputs`

However, this would restore the original iOS regression.

## Success Criteria

- All 7 acceptance criteria from the spec are met
- Desktop Mac users have autofocus in search components
- Windows/Linux users maintain existing autofocus behavior
- iOS/iPadOS devices do not experience unexpected keyboard behavior
- Drawer layouts on iOS/iPadOS do not jump unexpectedly
- Keyboard accessibility and manual focus remain functional
- No unrelated UI changes
