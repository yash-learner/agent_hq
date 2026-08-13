# Spec: Add expiry date to purchase delivery table

## Problem

The purchase delivery form collects expiry date when adding items to a delivery order, but this date is not displayed in the saved items table. Users cannot see expiry dates for delivered items without re-opening each item's details, making inventory tracking and quality control difficult.

## Acceptance Criteria

1. Given a user adds an item with an expiry date to a purchase delivery, when the user saves the delivery, then the expiry date displays in the supply delivery table.

2. Given a user views the supply delivery table with saved items, when items have expiry dates, then the expiry date displays in a dedicated column formatted as dd/MM/yyyy.

3. Given a user views the supply delivery table with saved items, when an item has no expiry date, then the cell displays "-".

4. Given a user views the supply delivery table with multiple items, when expiry dates exist, then expired items are visually distinguished (e.g., with red text or styling).

5. Given a user views the supply delivery table on mobile or narrow screens, when the table is scrolled horizontally, then the expiry date column remains visible and readable.

## Capability Notes

- `src/pages/Facility/services/inventory/SupplyDeliveryTable.tsx` -- existing table component that displays saved delivery items; needs new expiry date column added to TableHeader and TableBody sections.

- `src/pages/Facility/services/inventory/externalSupply/deliveryOrder/SmartExternalDeliveryRow.tsx:334-357` -- existing form input for expiry_date collection during item entry; this data is already captured and saved.

- `src/types/inventory/product/product.ts:24` -- ProductBase interface defines expiration_date field where expiry is stored after save.

- `src/pages/Facility/services/inventory/externalSupply/deliveryOrder/PrintDeliveryOrder.tsx:80-104` -- existing print view already displays expiry_date; table view needs parity.

- `src/pages/Facility/services/pharmacy/DispensedMedicationList.tsx:181-228` -- existing pattern for displaying expiry dates with visual warnings for expired/expiring items can be referenced.

## Open Questions

None.
