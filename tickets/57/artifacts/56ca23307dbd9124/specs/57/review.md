# Review Findings

## Round 1

- **blocker** `src/pages/Facility/services/inventory/externalSupply/deliveryOrder/PrintDeliveryOrder.tsx:79-81` — expiry date only shown in print layout for internal deliveries; external deliveries need batch and expiry columns too. Add `{ key: "lot_batch_number" }, { key: "expiry_date" }` to external mode or make them unconditional.

## Round 2

- **blocker** `src/pages/Facility/services/inventory/externalSupply/deliveryOrder/PrintDeliveryOrder.tsx:88-94` — batch and expiry data extraction logic still conditional on `internal` mode; external deliveries will always show "-" despite having data. For external: use `delivery.supplied_item?.batch?.lot_number` and `delivery.supplied_item?.expiration_date`. For internal: keep current `delivery.supplied_inventory_item?.product` logic.
