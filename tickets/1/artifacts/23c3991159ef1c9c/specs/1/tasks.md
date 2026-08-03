# Implementation Tasks: Fix iOS autofocus regressions in autocomplete and drawer search components

## Task 1: Update autocomplete and search components with iOS-safe autofocus guards

**Repo**: `yash-learner/care_fe_agent_hq`

**What it touches**:
- `src/components/ui/autocomplete.tsx` - Base autocomplete component
- `src/components/Common/RoleSelect.tsx` - Role selection command
- `src/components/Questionnaire/QuestionnaireSearch.tsx` - Questionnaire search command
- `src/components/Questionnaire/MedicationValueSetSelect.tsx` - Medication value set search
- `src/pages/Facility/settings/devices/components/DeviceSelector.tsx` - Device selector command

**Implementation**:
1. Import `isIOSDevice` from `@/Utils/utils` in each component
2. Replace `autoFocus` (or `autoFocus={true}`) with `autoFocus={!isIOSDevice}` in all search input fields
3. Verify that desktop Mac users retain autofocus functionality (since `isIOSDevice` only blocks iPhone/iPad/iPod)
4. Verify that Windows/Linux desktop autofocus continues to work as expected

**Dependencies**: None

**Acceptance Criteria Coverage**:
- AC1: Desktop Mac browser autocomplete search inputs receive focus ✓
- AC2: Windows/Linux desktop autocomplete autofocus continues as expected ✓
- AC3: iPhone Safari drawer-based search components don't autofocus ✓
- AC4: iPadOS Safari autocomplete components don't autofocus ✓
- AC6: Manual focus and keyboard navigation remain functional ✓
- AC7: All seven identified components use iOS-safe guards (5 of 7 covered in this task) ✓

**Estimated size**: ~35 lines changed across 5 files

---

## Task 2: Update drawer components with iOS-safe repositionInputs guards

**Repo**: `yash-learner/care_fe_agent_hq`

**What it touches**:
- `src/components/Medicine/InstructionsPopover.tsx` - Instructions selection drawer
- `src/components/Questionnaire/EntitySelectionDrawer.tsx` - Entity selection drawer

**Implementation**:
1. Import `isIOSDevice` from `@/Utils/utils` in each component
2. Replace `repositionInputs` (or `repositionInputs={true}`) with `repositionInputs={!isIOSDevice}` in Drawer components
3. Verify that desktop users retain input repositioning
4. Verify that iOS/iPadOS devices don't experience keyboard/layout jump issues

**Dependencies**: None (can run in parallel with Task 1)

**Acceptance Criteria Coverage**:
- AC5: iOS/iPadOS drawers don't force input repositioning ✓
- AC6: Manual focus and keyboard navigation remain functional ✓
- AC7: All seven identified components use iOS-safe guards (2 of 7 covered in this task) ✓

**Estimated size**: ~10 lines changed across 2 files

---

## Task 3: Manual QA verification across all affected components

**Repo**: `yash-learner/care_fe_agent_hq`

**What it touches**:
- Manual testing of all 7 updated components
- Desktop and mobile browser verification

**Implementation**:
1. Test on desktop Mac browser: verify autofocus works in all search components
2. Test on Windows/Linux desktop: verify autofocus continues to work
3. Test on iPhone Safari (or iOS simulator): verify search inputs don't autofocus
4. Test on iPadOS Safari (including desktop mode): verify no unexpected autofocus
5. Test drawer components on iOS/iPadOS: verify no keyboard/layout jump with repositionInputs
6. Test manual focus and keyboard navigation on all platforms
7. Capture screenshots for desktop (showing autofocus) and mobile (showing no autofocus)

**Dependencies**: Tasks 1 and 2 must be complete

**Acceptance Criteria Coverage**:
- AC1: Desktop Mac browser autocomplete search inputs receive focus ✓
- AC2: Windows/Linux desktop autocomplete autofocus continues as expected ✓
- AC3: iPhone Safari drawer-based search components don't autofocus ✓
- AC4: iPadOS Safari autocomplete components don't autofocus ✓
- AC5: iOS/iPadOS drawers don't force input repositioning ✓
- AC6: Manual focus and keyboard navigation remain functional ✓
- AC7: All seven identified components use iOS-safe guards ✓

**Estimated size**: No code changes, QA verification only

---

## Coverage Summary

All 7 acceptance criteria are covered:

- **AC1** (Desktop Mac autofocus): Covered by Tasks 1, 3
- **AC2** (Windows/Linux autofocus): Covered by Tasks 1, 3
- **AC3** (iPhone no autofocus): Covered by Tasks 1, 3
- **AC4** (iPadOS no autofocus): Covered by Tasks 1, 3
- **AC5** (iOS repositionInputs guard): Covered by Tasks 2, 3
- **AC6** (Keyboard accessibility): Covered by Tasks 1, 2, 3
- **AC7** (All 7 components fixed): Covered by Tasks 1, 2, 3

**Total estimated changes**: ~45 lines across 7 files in a single repository.
