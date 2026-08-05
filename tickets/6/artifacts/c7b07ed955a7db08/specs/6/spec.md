# Specification: MultiFilter Mobile Responsiveness

## Problem

The MultiFilter component renders a `DropdownMenu` on all screen sizes, causing the filter menu to overflow the viewport on mobile devices and making it difficult to interact with on touch screens. Clinicians using CARE on phones or tablets experience a cramped and clipped interface when applying filters to Appointments, Encounters, Billing, and Inventory views.

## Acceptance Criteria

1. Given a viewport below the `sm` breakpoint (640px), when the user taps the MultiFilter trigger button, then a bottom-sheet `Drawer` opens instead of an anchored `DropdownMenu`.

2. Given the mobile drawer is open, when the user selects, clears, or applies filters, then the interactions work identically to the desktop dropdown behavior.

3. Given a viewport at or above the `sm` breakpoint, when the user clicks the MultiFilter trigger, then the existing `DropdownMenu` behavior remains unchanged.

4. Given the mobile drawer is open, when assistive technology reads the drawer, then a visually-hidden `DrawerTitle` is announced for WCAG 2.1 AA accessibility compliance.

5. Given a mobile device with notch or home indicator, when the drawer is open, then the content respects `env(safe-area-inset-bottom)` padding.

6. Given the `selectedFilterBar` component in the mobile view, when the user taps a selected filter bar, then the filter editor also opens in a `Drawer`.

7. Given existing pages consuming MultiFilter (Appointments, Encounters, Billing, Inventory), when the component switches to drawer mode, then no regression occurs in filter functionality or layout.

## Capability Notes

- `src/components/ui/multi-filter/MultiFilter.tsx` -- exists, uses `DropdownMenu` at lines 125-160
- `src/components/ui/multi-filter/selectedFilterBar.tsx` -- exists, uses `DropdownMenu` at lines 86-138
- `src/components/ui/drawer.tsx` -- exists, provides `Drawer`, `DrawerContent`, `DrawerTitle`, `DrawerTrigger` primitives
- `src/components/ui/autocomplete.tsx` -- exists, demonstrates responsive pattern with `useBreakpoints({ default: true, sm: false })` at line 84 and mobile drawer at lines 196-260
- `src/hooks/useBreakpoints.ts` -- exists, provides breakpoint detection hook

## Open Questions

None.
