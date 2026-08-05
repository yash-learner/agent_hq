# Implementation Plan: MultiFilter Mobile Responsiveness

## Summary

Update the MultiFilter component to render in a bottom-sheet Drawer on mobile devices (below `sm` breakpoint) while maintaining the existing DropdownMenu behavior on desktop. This mirrors the responsive pattern already implemented in Autocomplete.

## Repositories

- `yash-learner/care_fe_agent_hq` (frontend only)

## Dependencies

No new dependencies required. The implementation uses existing primitives:
- `useBreakpoints` hook (already in codebase)
- `Drawer`, `DrawerContent`, `DrawerTitle`, `DrawerTrigger` components (already in codebase)
- Pattern established by `Autocomplete.tsx` (reference implementation)

## Implementation Approach

### 1. MultiFilter.tsx Changes

**Location**: `src/components/ui/multi-filter/MultiFilter.tsx`

Add responsive container logic:
- Import `useBreakpoints` hook and Drawer primitives (`Drawer`, `DrawerContent`, `DrawerTitle`, `DrawerTrigger`)
- Add `const isMobile = useBreakpoints({ default: true, sm: false })` to detect mobile viewports
- Extract the current filter content (FilterRenderer/FilterList) into a reusable JSX fragment
- Add conditional rendering:
  - **Mobile** (`isMobile === true`): Wrap content in `<Drawer>` with `DrawerTrigger` containing the filter button, `DrawerContent` with the filter panels, and a visually-hidden `DrawerTitle` for accessibility
  - **Desktop** (`isMobile === false`): Keep existing `<DropdownMenu>` structure unchanged

**Mobile Drawer structure**:
```tsx
<Drawer open={open} onOpenChange={setOpen}>
  <DrawerTrigger asChild>
    <Button {...triggerProps} />
  </DrawerTrigger>
  <DrawerContent className="min-h-[50vh] max-h-[85vh] px-0 pt-2 pb-0 rounded-t-lg">
    <DrawerTitle className="sr-only">{t("filter_options")}</DrawerTitle>
    <div className="mt-6 pb-[env(safe-area-inset-bottom)] flex-1 overflow-y-auto">
      {/* FilterRenderer or FilterList content */}
    </div>
  </DrawerContent>
</Drawer>
```

**Desktop DropdownMenu structure** (unchanged):
```tsx
<DropdownMenu open={open} onOpenChange={setOpen}>
  <DropdownMenuTrigger asChild>
    <Button {...triggerProps} />
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    {/* FilterRenderer or FilterList content */}
  </DropdownMenuContent>
</DropdownMenu>
```

### 2. selectedFilterBar.tsx Changes

**Location**: `src/components/ui/multi-filter/selectedFilterBar.tsx`

Apply the same responsive pattern:
- Import `useBreakpoints` and Drawer primitives
- Add `const isMobile = useBreakpoints({ default: true, sm: false })`
- Extract the `FilterRenderer` content into a shared fragment
- Conditionally render:
  - **Mobile**: `<Drawer>` with `DrawerTrigger` wrapping the selected filter bar display, `DrawerContent` with the filter editor, and a visually-hidden `DrawerTitle`
  - **Desktop**: Keep existing `<DropdownMenu>` wrapping the filter bar

The selected filter bar visual (icon, label, operation menu, value, clear button) remains identical; only the edit dropdown vs. drawer changes.

### 3. Accessibility & Safe Area

- Add `<DrawerTitle className="sr-only">{t("filter_options")}</DrawerTitle>` in both components for WCAG 2.1 AA compliance
- Apply `pb-[env(safe-area-inset-bottom)]` to the drawer's scrollable content container to respect device notches/home indicators
- Set `aria-describedby={undefined}` on `DrawerContent` to suppress unnecessary ARIA description warnings

### 4. Keyboard Shortcuts & Navigation

The existing `useMultiFilterNavigationShortcuts` hook and `NavigationHelper` utilities operate on the `activeFilter` state and DOM queries. Since the filter content structure (FilterRenderer/FilterList) remains the same, keyboard navigation will work unchanged in both mobile and desktop modes.

### 5. Testing Scope

**Manual testing** (no Playwright tests exist for MultiFilter):
- Verify filter interaction on mobile viewports (<640px) opens a drawer
- Verify filter interaction on desktop viewports (≥640px) opens a dropdown
- Confirm selected filter bar opens a drawer on mobile
- Test filter selection, clearing, and application in both modes
- Validate on pages consuming MultiFilter: Appointments, Encounters, Billing, Inventory

**No automated tests to add**: The existing codebase has no Playwright coverage for MultiFilter; this change maintains that pattern (manual validation only).

## Files Modified

1. `src/components/ui/multi-filter/MultiFilter.tsx` — Add responsive Drawer/DropdownMenu conditional rendering
2. `src/components/ui/multi-filter/selectedFilterBar.tsx` — Add responsive Drawer/DropdownMenu conditional rendering

## Accessibility Compliance

- Visually-hidden `DrawerTitle` announced by screen readers (WCAG 2.1 AA)
- Safe area insets respected for devices with notches
- Existing keyboard navigation shortcuts preserved
- Focus management handled by Drawer and DropdownMenu primitives

## Risks & Mitigations

**Risk**: Mobile drawer could conflict with existing `open` state management or keyboard shortcuts.  
**Mitigation**: The `open`/`setOpen` state is container-agnostic; both Drawer and DropdownMenu accept the same props. Keyboard shortcuts operate on activeFilter state, not the container.

**Risk**: Filter content styling might break in the new drawer container.  
**Mitigation**: Both FilterRenderer and FilterList are self-contained with their own styling; moving them into a drawer's scrollable div should not affect layout. The Autocomplete component demonstrates this works with similar content.

## Rollout

No feature flag required. The change is purely presentational (same filter logic, different UI container on mobile). Deploy with normal frontend release process.
