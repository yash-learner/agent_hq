# QA Plan: Purchase Delivery Table - Add Expiry Date Column

## AC1 — Expiry date column appears in supply delivery table

### Research map

- Routes: `/facility/{facilityId}/locations/{locationId}/inventory/internal/dispatch` (internal transfers)
- Routes: `/facility/{facilityId}/locations/{locationId}/external_supply/purchase_orders` (external purchases)
- Components: `src/pages/Facility/services/inventory/SupplyDeliveryTable.tsx`
- Components: `src/pages/Facility/services/inventory/externalSupply/deliveryOrder/DeliveryOrderShow.tsx`
- i18n labels: "expiry_date", "batch", "Save List", "Select stock"
- Auth/role: `tests/.auth/user.json` (admin)
- Permissions: facility-scoped
- Fixtures: load-fixtures provides facility, locations (Pharmacy, Bio-Chemistry), and product inventory (Paracetamol)

### Prerequisites

- Backend running on port 9000
- Fixtures loaded via `load-fixtures` command (provides test facility, locations, and inventory)
- User authenticated as admin

### Data setup

- Prefer fixtures: load-fixtures creates:
  - Test facility (getFacilityId())
  - Pharmacy location (accessible via `/facility/{facilityId}/services/` → "Main Pharmacy" → "Pharmacy")
  - Bio-Chemistry lab location (accessible via `/facility/{facilityId}/services/` → "Pathology Lab" → "Bio-Chemistry")
  - Paracetamol inventory with batch and expiry data in Pharmacy location
- Provenance: `tests/facility/services/locations/inventory/toDispatch.spec.ts` lines 16-50, 80-82

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/services/`, click "Main Pharmacy", then "Pharmacy"
   **Expect:** Pharmacy location page loads showing medication requests
   **Record through:** yes

2. **Action:** Extract `pharmacyLocationId` from URL (pattern: `/facility/{facilityId}/locations/{locationId}/medication_requests`), then navigate to `/facility/{facilityId}/locations/{pharmacyLocationId}/inventory/internal/dispatch`
   **Expect:** "To-Dispatch Orders" page loads
   **Record through:** yes

3. **Action:** Navigate to Bio-Chemistry via `/facility/{facilityId}/services/` → "Pathology Lab" → "Bio-Chemistry", extract `bioChemLabLocationId`, then go to `/facility/{facilityId}/locations/{bioChemLabLocationId}/inventory/internal/receive`
   **Expect:** "To-Receive Orders" page loads
   **Record through:** yes

4. **Action:** Click "Raise Stock Request" button
   **Expect:** Stock request dialog opens
   **Record through:** yes

5. **Action:** Fill "Name" with `qa-test-{timestamp}`, select "Pharmacy" from "Select Location" dropdown, check "Urgent" radio, click "Create"
   **Expect:** Order detail page loads with order heading visible
   **Record through:** yes

6. **Action:** Click "Add Item" dropdown, select "Medication", then select "Paracetamol", enter quantity "5", click "Save List"
   **Expect:** Table row shows "Paracetamol" with quantity "5"
   **Record through:** yes

7. **Action:** Click "Mark as Approved" button (wait up to 5 seconds)
   **Expect:** Order status changes to approved
   **Record through:** yes

8. **Action:** Navigate to `/facility/{facilityId}/locations/{pharmacyLocationId}/inventory/internal/dispatch`
   **Expect:** Order appears in dispatch table with "Pharmacy" destination
   **Record through:** yes

9. **Action:** Click "See Details" on the order row
   **Expect:** Order detail shows "Paracetamol" row with quantity "5"
   **Record through:** yes

10. **Action:** Click "Create Delivery Order" link
    **Expect:** Delivery order creation form loads
    **Record through:** yes

11. **Action:** Click "Create" button
    **Expect:** Delivery order edit page loads with "Load from order" button visible
    **Record through:** yes

12. **Action:** Click "Load from order", then click "Done"
    **Expect:** Paracetamol item appears in the form
    **Record through:** yes

13. **Action:** Click "Select stock" button (second instance, index 1), click the inventory item with price "₹20.00" (use `.locator("div").filter({ hasText: "₹20.00" }).nth(3)`), click outside to close (use `page.mouse.click(0, 0)`)
    **Expect:** Stock item selected, batch number and expiry date populate in the form
    **Record through:** yes

14. **Action:** Click "Save" button
    **Expect:** Delivery items saved, table now displays items with batch and expiry date columns visible
    **Record through:** yes

15. **Action:** Verify the supply delivery table has columns in this order: "#", "item", "batch", "expiry_date", "requested_qty"
    **Expect:** Table header shows "Expiry Date" column after "Batch" column
    **Record through:** yes

16. **Action:** Verify the first table row shows batch number and expiry date in dd/MM/yyyy format (e.g., "15/12/2025")
    **Expect:** Batch column shows batch number, expiry date column shows date in dd/MM/yyyy format
    **Record through:** yes

### Success looks like

- Supply delivery table displays "Expiry Date" column header after "Batch" column
- Table row shows expiry date in dd/MM/yyyy format next to batch number
- Expiry date that was entered in the form is now visible in the saved table view

## AC2 — Expiry date cell shows placeholder for missing data

### Research map

- Same as AC1
- Form allows saving without expiry date

### Prerequisites

- Same as AC1

### Data setup

- Same as AC1

### Steps

1. **Action:** Follow AC1 steps 1-12 to create a delivery order and load items
   **Expect:** Delivery order form loads with Paracetamol item
   **Record through:** yes

2. **Action:** Click "Select stock" button, select an inventory item
   **Expect:** Stock selected, batch populates
   **Record through:** yes

3. **Action:** Clear the expiry date field if populated (locate input with `type="date"`, clear it)
   **Expect:** Expiry date field is empty
   **Record through:** yes

4. **Action:** Click "Save" button
   **Expect:** Item saves successfully
   **Record through:** yes

5. **Action:** Check the expiry date column in the table for this item
   **Expect:** Expiry date cell shows "-" as placeholder
   **Record through:** yes

### Success looks like

- Table row with no expiry date shows "-" in the expiry date column

## AC3 — Internal transfer mode shows expiry date column

### Research map

- Same as AC1
- Internal mode: `internal={true}` prop on SupplyDeliveryTable

### Prerequisites

- Same as AC1

### Data setup

- Same as AC1 (internal transfer between Bio-Chemistry and Pharmacy is internal mode)

### Steps

1. **Action:** Follow AC1 steps 1-16 to create an internal transfer delivery order
   **Expect:** All steps complete successfully
   **Record through:** yes

2. **Action:** Verify the URL contains `/inventory/internal/` indicating internal transfer mode
   **Expect:** URL confirms internal transfer context
   **Record through:** yes

3. **Action:** Verify table columns include "Expiry Date" after "Batch" with consistent dd/MM/yyyy format
   **Expect:** Expiry date column present with same formatting as external purchases
   **Record through:** yes

### Success looks like

- Internal transfer delivery orders show expiry date column in the same position with same format as external purchases

## AC4 — External purchase shows expiry date between batch and requested quantity

### Research map

- Routes: `/facility/{facilityId}/locations/{locationId}/external_supply/purchase_orders`
- External mode: `internal={false}` prop on SupplyDeliveryTable
- Components: `src/pages/Facility/services/inventory/externalSupply/deliveryOrder/AddSupplyDeliveryForm.tsx`

### Prerequisites

- Backend running on port 9000
- Fixtures loaded (provides facility and locations)
- User authenticated as admin

### Data setup

- Prefer fixtures: load-fixtures provides facility and locations
- UI recipe for external purchase:
  1. Navigate to `/facility/{facilityId}/services/` → "Main Pharmacy" → "Pharmacy"
  2. Extract pharmacyLocationId from URL
  3. Navigate to `/facility/{facilityId}/locations/{pharmacyLocationId}/external_supply/purchase_orders`
  4. Create new purchase order with external vendor
- Provenance: URL pattern from `src/Routers/AppRouter.tsx:49-50`, form from `src/pages/Facility/services/inventory/externalSupply/deliveryOrder/AddSupplyDeliveryForm.tsx`

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/services/` → "Main Pharmacy" → "Pharmacy", extract pharmacyLocationId
   **Expect:** Pharmacy location loads
   **Record through:** yes

2. **Action:** Navigate to `/facility/{facilityId}/locations/{pharmacyLocationId}/external_supply/purchase_orders`
   **Expect:** External purchase orders list page loads
   **Record through:** yes

3. **Action:** Click "Create New Purchase Order" or similar button to start new external purchase
   **Expect:** Purchase order creation form loads
   **Record through:** yes

4. **Action:** Fill required vendor and order details, add a medication item (e.g., Paracetamol)
   **Expect:** Item added to order form
   **Record through:** yes

5. **Action:** Fill batch number field (e.g., "BATCH-001")
   **Expect:** Batch field populates
   **Record through:** yes

6. **Action:** Fill expiry date field with a future date using the date input (type="date")
   **Expect:** Expiry date field shows selected date
   **Record through:** yes

7. **Action:** Click "Save List" or equivalent button to save the order items
   **Expect:** Items save, table displays saved items
   **Record through:** yes

8. **Action:** Verify the table column order: "#", "item", "batch", "expiry_date", "requested_qty", "pack_size", "pack_qty"
   **Expect:** Expiry date column appears after batch and before requested quantity
   **Record through:** yes

9. **Action:** Verify the expiry date shows in dd/MM/yyyy format
   **Expect:** Expiry date displays formatted correctly
   **Record through:** yes

### Success looks like

- External purchase delivery table shows expiry date column between batch and requested quantity columns
- Date format is dd/MM/yyyy

## AC5 — Print layout shows expiry dates alongside batch numbers

### Research map

- Components: `src/pages/Facility/services/inventory/externalSupply/deliveryOrder/PrintDeliveryOrder.tsx`
- Print headers at line 74-81: includes "lot_batch_number" and "expiry_date"
- Data extraction at lines 88-94: uses `supplied_item` or `supplied_inventory_item.product` based on internal/external mode

### Prerequisites

- Completed AC1 or AC4 to have a delivery order with batch and expiry data

### Data setup

- Use delivery order created in AC1 (internal) or AC4 (external)

### Steps

1. **Action:** Navigate to the delivery order detail page from AC1 or AC4
   **Expect:** Delivery order details load with supply delivery table showing batch and expiry columns
   **Record through:** yes

2. **Action:** Click "Print" button or similar print action to open print preview
   **Expect:** Print preview dialog opens showing delivery order
   **Record through:** yes

3. **Action:** Verify the print layout table includes columns: "product", "lot_batch_number", "expiry_date", "quantity", "status", "condition"
   **Expect:** Print table shows all columns including batch and expiry date
   **Record through:** yes

4. **Action:** Verify batch number from the screen table matches batch number in print preview
   **Expect:** Batch numbers match
   **Record through:** yes

5. **Action:** Verify expiry date from the screen table matches expiry date in print preview (dd/MM/yyyy format)
   **Expect:** Expiry dates match in same format
   **Record through:** yes

6. **Action:** For external deliveries, verify batch and expiry come from `supplied_item` (not undefined/"-")
   **Expect:** External delivery print shows actual batch and expiry data, not "-"
   **Record through:** yes

### Success looks like

- Print preview shows batch and expiry date columns
- Data matches the screen table
- External deliveries show actual batch/expiry data from `supplied_item`, not placeholders

## Test plan / notes

### Playwright E2E Coverage

- Add test in `tests/facility/services/locations/inventory/externalPurchases.spec.ts` (new file) covering AC4 external purchase flow with expiry date verification
- Add assertions to existing `tests/facility/services/locations/inventory/toDispatch.spec.ts` to verify expiry date column presence and format in the table (extend existing "switch location and create delivery order" test)
- Add print preview test to verify AC5 for both internal and external deliveries

### CI Expectations

- All existing inventory tests pass (no regressions in table rendering or form submission)
- Lint passes with no new warnings
- Type checking passes with no TypeScript errors
- Build succeeds with no errors

### Manual Testing Notes

- Test with various date formats to ensure dd/MM/yyyy formatting is consistent
- Test with products that have no expiry date to verify "-" placeholder
- Test print layout in both internal and external modes
- Verify column order matches spec for both internal and external modes
