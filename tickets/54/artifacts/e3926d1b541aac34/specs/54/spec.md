# Spec: Save Purchase Delivery item with Shift + Enter

## Problem

When adding items in Purchase Delivery, pressing Enter while editing Quantity or Price fields immediately saves the entire delivery form. Users attempting to navigate between fields using Enter inadvertently submit incomplete rows, requiring them to locate and correct accidental entries. This disrupts the data entry workflow.

## Acceptance Criteria

1. Given the Purchase Delivery item-entry form is open, when a user presses Enter in the Pack Quantity field, then focus moves to the next field and the form does not submit.
2. Given the Purchase Delivery item-entry form is open, when a user presses Enter in the Unit Price field, then focus moves to the next field and the form does not submit.
3. Given the Purchase Delivery item-entry form is open, when a user presses Enter in any informational component field (e.g., MRP), then focus moves to the next field and the form does not submit.
4. Given the Purchase Delivery item-entry form is open, when a user presses Enter in the Total Purchase Price field, then focus moves to the next field and the form does not submit.
5. Given the Purchase Delivery item-entry form is open, when a user presses Shift + Enter in any editable field, then the entire delivery form submits immediately.
6. Given the Save button is focused, when a user presses Enter, then the form submits as expected.
7. Given the Purchase Delivery item-entry form is open, when a user clicks the Save button, then the form submits as expected.

## Capability Notes

- `src/pages/Facility/services/inventory/externalSupply/deliveryOrder/AddSupplyDeliveryForm.tsx` -- contains the form with `onSubmit` handler (line 604) and save button (line 934)
- `src/pages/Facility/services/inventory/externalSupply/deliveryOrder/SmartExternalDeliveryRow.tsx` -- renders input fields for Pack Quantity (~line 410), Unit Price (~line 455), informational components (~line 500), and Total Purchase Price (~line 540)
- `src/hooks/useKeyboardShortcuts.ts` -- existing keyboard shortcut system that may be used for Shift+Enter handling
- `src/Utils/keyboardShortcutComponents.tsx` -- contains `ShortcutBadge` component already used in the form (line 936)

## Open Questions

None.
