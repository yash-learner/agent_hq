# Implementation Tasks: MultiFilter Mobile Responsiveness

## Task 1: Add responsive container to MultiFilter.tsx

**Repository**: `yash-learner/care_fe_agent_hq`

**Files Modified**:
- `src/components/ui/multi-filter/MultiFilter.tsx` (~80-100 lines changed)

**Description**:
Update the main MultiFilter component to conditionally render in a Drawer on mobile and DropdownMenu on desktop, following the pattern established by Autocomplete.tsx.

**Changes**:
1. Import `useBreakpoints` hook from `@/hooks/useBreakpoints`
2. Import Drawer primitives: `Drawer`, `DrawerContent`, `DrawerTitle`, `DrawerTrigger` from `@/components/ui/drawer`
3. Add `const isMobile = useBreakpoints({ default: true, sm: false })` at the component level
4. Extract the current filter content (the JSX inside `DropdownMenuContent`: `FilterRenderer` and `FilterList`) into a reusable constant or inline JSX fragment
5. Add conditional rendering logic:
   - When `isMobile === true`: Render `<Drawer>` wrapper with:
     - `DrawerTrigger` containing the filter button (currently the `DropdownMenuTrigger` content)
     - `DrawerContent` with className `"min-h-[50vh] max-h-[85vh] px-0 pt-2 pb-0 rounded-t-lg"` and `aria-describedby={undefined}`
     - Visually-hidden `DrawerTitle` with className `"sr-only"` and text `{t("filter_options")}`
     - Inner scrollable div with className `"mt-6 pb-[env(safe-area-inset-bottom)] flex-1 overflow-y-auto"` containing the filter content
   - When `isMobile === false`: Keep existing `<DropdownMenu>` structure unchanged (lines 125-160)
6. Ensure the `open` and `setOpen` state is passed to both containers
7. Keep the trigger button styling (`hasAnyFilters` conditional classes) and disabled state identical in both modes
8. Preserve the existing `selectedFilters` mapping and `SelectedFilterBar` rendering below the main component (lines 161+)

**Dependencies**: None

**Acceptance Criteria Covered**:
- AC1: Mobile viewports (<640px) show a bottom-sheet Drawer instead of DropdownMenu
- AC3: Desktop viewports (≥640px) maintain existing DropdownMenu behavior
- AC4: Drawer includes visually-hidden `DrawerTitle` for accessibility
- AC5: Drawer content respects `env(safe-area-inset-bottom)` padding

**Estimated Lines Changed**: ~80-100 lines (mostly conditional structure and imports)

---

## Task 2: Add responsive container to selectedFilterBar.tsx

**Repository**: `yash-learner/care_fe_agent_hq`

**Files Modified**:
- `src/components/ui/multi-filter/selectedFilterBar.tsx` (~60-80 lines changed)

**Description**:
Update the SelectedFilterBar component to conditionally render the filter editor in a Drawer on mobile and DropdownMenu on desktop, maintaining the same pattern as MultiFilter.tsx.

**Changes**:
1. Import `useBreakpoints` hook from `@/hooks/useBreakpoints`
2. Import Drawer primitives: `Drawer`, `DrawerContent`, `DrawerTitle`, `DrawerTrigger` from `@/components/ui/drawer`
3. Add `const isMobile = useBreakpoints({ default: true, sm: false })` inside the `SelectedFilterBar` component function
4. Extract the `FilterRenderer` content (currently in `DropdownMenuContent` at lines 129-136) into a reusable constant
5. Replace the outer `<DropdownMenu>` wrapper (lines 86-137) with conditional rendering:
   - When `isMobile === true`: Render `<Drawer>` with:
     - `DrawerTrigger` wrapping the entire filter bar visual (currently the inner `<div>` at lines 90-128)
     - `DrawerContent` with className `"min-h-[50vh] max-h-[85vh] px-0 pt-2 pb-0 rounded-t-lg"` and `aria-describedby={undefined}`
     - Visually-hidden `DrawerTitle` with className `"sr-only"` and text `{t("edit_filter")}`
     - Inner scrollable div with className `"mt-6 pb-[env(safe-area-inset-bottom)] flex-1 overflow-y-auto"` containing the `FilterRenderer`
   - When `isMobile === false`: Keep existing `<DropdownMenu>` structure unchanged
6. Ensure the `openState` and `setOpenState` props are passed to both containers
7. Keep the filter bar visual (icon, label, `SubMenuFilter`, value display, clear button) identical in both modes
8. Preserve the `onClick` handler on the trigger element

**Dependencies**: Task 1 (for consistency and pattern reference)

**Acceptance Criteria Covered**:
- AC2: Filter selection, clearing, and application work identically in mobile and desktop modes
- AC6: Tapping a selected filter bar opens the filter editor in a Drawer on mobile
- AC4: Drawer includes visually-hidden `DrawerTitle` for accessibility
- AC5: Drawer content respects `env(safe-area-inset-bottom)` padding

**Estimated Lines Changed**: ~60-80 lines (conditional structure and imports)

---

## Task 3: Manual testing and regression verification

**Repository**: `yash-learner/care_fe_agent_hq`

**Files Modified**: None (testing only)

**Description**:
Manually test the responsive MultiFilter component across all consuming pages to verify mobile/desktop behavior and ensure no regressions.

**Testing Steps**:
1. **Development environment setup**:
   - Run `npm run dev` and open http://localhost:4000
   - Test on both desktop (≥640px) and mobile (<640px) viewports using browser DevTools responsive mode

2. **MultiFilter trigger testing**:
   - Desktop: Verify clicking the filter button opens a dropdown menu anchored to the trigger
   - Mobile: Verify tapping the filter button opens a bottom drawer
   - Both: Verify the filter button shows blue styling when filters are active (`hasAnyFilters` state)

3. **Filter interaction testing** (both mobile and desktop):
   - Open the filter menu
   - Select a filter from the list
   - Navigate back to the filter list
   - Select another filter
   - Apply multiple filters
   - Verify the selected filter bars appear below the trigger button

4. **SelectedFilterBar testing**:
   - Desktop: Verify clicking a selected filter bar opens a dropdown editor
   - Mobile: Verify tapping a selected filter bar opens a drawer editor
   - Both: Verify changing the operation (e.g., "equals" → "contains") updates the filter
   - Both: Verify the clear button (X) removes the filter

5. **Page-specific testing** (verify no layout regressions):
   - `/appointments` page — filter by date, status, facility
   - `/encounters` page — filter by encounter type, date range
   - `/facility/{id}/billing` page — filter by billing status, date
   - `/facility/{id}/inventory` page — filter by item name, category

6. **Accessibility testing**:
   - Use a screen reader (NVDA, JAWS, or VoiceOver) to verify the drawer announces its title on mobile
   - Verify keyboard navigation (Tab, Enter, Escape) works in both mobile and desktop modes
   - Test on a device with a notch or home indicator to verify safe area padding

7. **Keyboard shortcuts testing**:
   - Verify existing keyboard shortcuts (if any) continue to work in both mobile and desktop modes
   - Navigate between filters using keyboard shortcuts
   - Apply/clear filters using keyboard

**Dependencies**: Task 1 and Task 2 must be completed

**Acceptance Criteria Covered**:
- AC1: Mobile viewports show drawer
- AC2: Filter interactions work identically on mobile and desktop
- AC3: Desktop dropdown behavior unchanged
- AC4: Screen readers announce drawer title
- AC5: Safe area insets respected on mobile
- AC6: Selected filter bar opens drawer on mobile
- AC7: No regressions on Appointments, Encounters, Billing, Inventory pages

**Deliverables**:
- Document test results in a comment or commit message
- Note any issues found and resolved
- Confirm all acceptance criteria are met

**Estimated Time**: 30-45 minutes of manual testing

---

## Summary

**Total Tasks**: 3 (2 implementation + 1 testing)

**Acceptance Criteria Coverage**:
- **Task 1** covers AC1, AC3, AC4, AC5
- **Task 2** covers AC2, AC4, AC5, AC6
- **Task 3** covers all AC1-AC7 (verification and regression testing)

**Implementation Order**:
1. Task 1: MultiFilter.tsx responsive container (foundation)
2. Task 2: selectedFilterBar.tsx responsive container (builds on Task 1 pattern)
3. Task 3: Manual testing and verification (validates both implementations)

**Total Estimated Changes**: ~140-180 lines across 2 files
