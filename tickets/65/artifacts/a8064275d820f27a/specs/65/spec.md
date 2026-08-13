# Spec: Add expiry date to purchase delivery table

## Problem

Users add expiry dates when creating purchase deliveries, but those dates aren't shown in the supply delivery table after saving. The table shows batch numbers but no expiration information, requiring users to remember or look elsewhere for critical expiry data.

## Acceptance Criteria

1. Given a supply delivery with an expiry date, when viewing the supply delivery table, then the expiry date displays in a dedicated column after the batch column.
2. Given a supply delivery without an expiry date, when viewing the supply delivery table, then the expiry date column shows "-" for that row.
3. Given multiple supply deliveries, when viewing the table, then expiry dates display in dd/MM/yyyy format.
4. Given the supply delivery table is in print mode, when generating a print view, then the expiry date column appears in the printed output.

## Capability Notes

- `src/pages/Facility/services/inventory/SupplyDeliveryTable.tsx` -- exists, renders the supply delivery table with batch column at line 192, needs new expiry date column
- `src/types/inventory/product/product.ts:ProductRead.expiration_date` -- exists, the expiration_date field is already in the ProductRead interface as an optional string
- `src/pages/Facility/services/inventory/externalSupply/deliveryOrder/PrintDeliveryOrder.tsx` -- exists, handles printing delivery orders with batch and expiry information (lines 80, 93-104)
- `src/pages/Facility/services/inventory/externalSupply/deliveryOrder/SmartExternalDeliveryRow.tsx` -- exists, shows expiry date input field at line 334-350
- `public/locale/en.json` -- exists, needs translation key for "expiry_date" column header if not already present

## Open Questions

None.
