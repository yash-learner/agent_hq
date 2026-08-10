# Specification: Add expiry date to purchase delivery table

## Problem statement

Users enter expiry dates in the purchase delivery form when receiving inventory items, but the expiry date is not visible in the purchase delivery table after saving. This forces users to open individual items or review forms again to check expiry dates, reducing workflow efficiency. The expiry date should be displayed in the table alongside other item details like batch number, quantity, and pricing.

## Acceptance criteria

1. Given a saved purchase delivery item with an expiry date, when viewing the purchase delivery table, then the expiry date column displays the date in dd/MM/yyyy format.

2. Given a saved purchase delivery item without an expiry date, when viewing the purchase delivery table, then the expiry date column displays "-".

3. Given multiple purchase delivery items in the table, when comparing items, then the expiry date column appears between the batch column and the requested quantity column.

4. Given an internal delivery order (location to location), when viewing the supply delivery table, then the expiry date column is visible.

5. Given an external delivery order (from supplier), when viewing the supply delivery table, then the expiry date column is visible.

6. Given the table header row, when viewing the column headers, then "Expiry" label is displayed for the expiry date column.

## Capability notes

- `src/pages/Facility/services/inventory/SupplyDeliveryTable.tsx` -- table component exists, displays batch number at line 285-288 but no expiry date column
- `src/types/inventory/product/product.ts:24` -- `ProductBase.expiration_date` field exists and is populated from form
- `src/pages/Facility/services/inventory/externalSupply/deliveryOrder/AddSupplyDeliveryForm.tsx:102` -- form schema includes `expiry_date` field and validates it at lines 406-407
- `src/pages/Facility/services/inventory/externalSupply/deliveryOrder/DeliveryOrderShow.tsx:152` -- uses `SupplyDeliveryTable` component to display saved deliveries
- Date formatting utility `formatDate` from `date-fns` is already imported and used in SupplyDeliveryTable.tsx at line 305

## Open questions

None.
