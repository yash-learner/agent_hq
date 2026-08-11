# Purchase Delivery Table: Add Expiry Date Column

## Problem

Users enter expiry dates when adding purchase delivery items via the form (`SmartExternalDeliveryRow`), but after saving, the `SupplyDeliveryTable` displays only batch numbers without expiry dates. This requires users to drill into individual items to verify expiration, slowing inventory verification workflows.

## Acceptance Criteria

1. Given a user views the supply delivery table in `DeliveryOrderShow`, when delivery items have expiry dates, then the expiry date column appears after the batch column showing dates in `dd/MM/yyyy` format.

2. Given a delivery item has no expiry date, when displayed in the table, then the expiry date cell shows `-` as a placeholder.

3. Given the table is in internal transfer mode (`internal={true}`), when rendered, then the expiry date column displays consistently with the same format.

4. Given the table shows external purchases (`internal={false}`), when rendered, then the expiry date column appears between batch and requested quantity columns.

5. Given a user views the printed delivery order, when expiry dates exist, then they appear in the print layout alongside batch numbers.

## Capability Notes

- `src/pages/Facility/services/inventory/SupplyDeliveryTable.tsx:192` -- table header renders batch column; needs expiry date header after it.
- `src/pages/Facility/services/inventory/SupplyDeliveryTable.tsx:285-288` -- table row renders batch number; needs expiry date cell after it accessing `delivery.supplied_inventory_item?.product?.expiration_date`.
- `src/types/inventory/product/product.ts:24` -- `expiration_date?: string` exists on ProductBase.
- `src/pages/Facility/services/inventory/externalSupply/deliveryOrder/SmartExternalDeliveryRow.tsx:338` -- form field already captures expiry date.
- `src/pages/Facility/services/inventory/externalSupply/deliveryOrder/PrintDeliveryOrder.tsx:12` -- print layout shows expiry date; ensure consistency.

## Open Questions

None.
