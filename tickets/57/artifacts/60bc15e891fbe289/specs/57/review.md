# Review Findings

## Round 1

- **blocker** `src/pages/Facility/services/inventory/externalSupply/deliveryOrder/PrintDeliveryOrder.tsx:79-81` — expiry date only shown in print layout for internal deliveries; external deliveries need batch and expiry columns too. Add `{ key: "lot_batch_number" }, { key: "expiry_date" }` to external mode or make them unconditional.
