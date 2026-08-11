# QA Plan: Purchase Delivery Table - Add Expiry Date Column

## AC1 — Expiry date column appears in supply delivery table with dd/MM/yyyy format

### Research map

- routes: `src/pages/Facility/locations/LocationLayout.tsx` → `/facility/{facilityId}/locations/{locationId}/inventory/external/deliveries/:tab/:id`
- components: `src/pages/Facility/services/inventory/externalSupply/deliveryOrder/DeliveryOrderShow.tsx` (uses `SupplyDeliveryTable`)
- table component: `src/pages/Facility/services/inventory/SupplyDeliveryTable.tsx` (lines 193, 290-299)
- form: `src/pages/Facility/services/inventory/externalSupply/deliveryOrder/SmartExternalDeliveryRow.tsx` (lines 334-357)
- i18n labels: "expiry_date" (Expiry Date), "batch" (Batch), "item" (Item)
- auth/role: tests/.auth/user.json (admin)
- permissions / facility-scoped: yes, facility and location scoped
- fixtures needed: facility, location (Pharmacy or similar with inventory), supplier, product with batch

### Prerequisites

- Authenticated as admin (tests/.auth/user.json)
- Facility context active with inventory-enabled location
- Supplier configured in the facility

### Data setup

- Prefer fixtures: load-fixtures provides facility with ID from getFacilityId()
- Location: Navigate to facility services, select location with inventory (e.g., Pharmacy)
- UI recipe (external purchase delivery creation):
  1. Navigate to `/facility/{facilityId}/services/`
  2. Click on a service location (e.g., "Main Pharmacy")
  3. Click on a location (e.g., "Pharmacy")
  4. Extract locationId from URL (format: `/facility/{facilityId}/locations/{locationId}/medication_requests`)
  5. Go to `/facility/{facilityId}/locations/{locationId}/inventory/external/orders/incoming`
  6. Click "New Purchase Order"
  7. Fill form:
     - Name: `PO-${Date.now()}`
     - Supplier: Select any supplier from dropdown
     - Priority: Select "Routine" or "Urgent"
  8. Click "Create"
  9. Add item:
     - Click "Add Item" dropdown
     - Select "Medication"
     - Select "Paracetamol" (or any product from fixtures)
     - Enter quantity: 10
     - Click "Save List"
  10. Click "Mark as Approved"
  11. Click "Create Delivery Order" link
  12. Click "Create"
  13. Click "Load from order"
  14. Click "Done"
  15. For the first item row:
      - Fill Batch Number: `BATCH-${Date.now()}`
      - Fill Expiry Date: Future date (e.g., 2025-12-31)
      - Fill Pack Size: 10
      - Fill Pack Qty: 1
      - Fill Unit Price: 100
  16. Click "Save"
  17. Click "Mark as Approved"
  18. Navigate to `/facility/{facilityId}/locations/{locationId}/inventory/external/deliveries/outgoing`
  19. Find the delivery order row by name
  20. Click "View Details"

### Steps

1. **Action:** View the supply delivery table on the delivery order details page after following data setup
   **Expect:** Table displays columns in order: #, Item, Batch, Expiry Date, Requested Qty, Pack Size, Pack Qty, Dispatched Qty, Dispatched Date, Sale (Item Price), Purchase (PR, TPR), Tax, Disc, Status, Condition
   **Record through:** yes

2. **Action:** Locate the Expiry Date column (between Batch and Requested Qty columns)
   **Expect:** Column header shows "Expiry Date"
   **Record through:** yes

3. **Action:** Check the expiry date value in the first row
   **Expect:** Expiry date displays in dd/MM/yyyy format (e.g., 31/12/2025)
   **Record through:** yes

### Success looks like

- Expiry Date column is visible after Batch column
- Date format is dd/MM/yyyy (not ISO format or other formats)
- The expiry date entered during form fill matches the displayed value

## AC2 — Empty expiry date shows "-" placeholder

### Research map

- Same as AC1
- code reference: `src/pages/Facility/services/inventory/SupplyDeliveryTable.tsx:290-299` (ternary with "-" fallback)

### Prerequisites

- Same as AC1

### Data setup

- Same as AC1, but in step 15:
  - Fill Batch Number: `BATCH-${Date.now()}`
  - **Do NOT fill Expiry Date** (leave empty)
  - Fill Pack Size: 10
  - Fill Pack Qty: 1
  - Fill Unit Price: 100
- Complete remaining steps 16-20

### Steps

1. **Action:** View the supply delivery table with a delivery item that has no expiry date
   **Expect:** The Expiry Date cell shows "-" as placeholder
   **Record through:** yes

### Success looks like

- Empty expiry date cell displays "-" not blank space or "N/A"

## AC3 — Expiry date column displays in internal transfer mode

### Research map

- Same as AC1
- route: `/facility/{facilityId}/locations/{locationId}/inventory/internal/dispatch/:tab/:id`
- internal prop set to true in DeliveryOrderShow and SupplyDeliveryTable

### Prerequisites

- Same as AC1

### Data setup

- Prefer fixtures: load-fixtures provides facility
- UI recipe (internal transfer delivery creation):
  1. Navigate to `/facility/{facilityId}/services/`
  2. Select two different locations (e.g., "Main Pharmacy" > "Pharmacy" and "Pathology Lab" > "Bio-Chemistry")
  3. Extract both locationIds from URLs
  4. Go to Bio-Chemistry location: `/facility/{facilityId}/locations/{bioChemLocationId}/inventory/internal/receive`
  5. Click "Raise Stock Request"
  6. Fill form:
     - Name: `SR-${Date.now()}`
     - Select Location: "Pharmacy"
     - Priority: "Urgent"
  7. Click "Create"
  8. Add item:
     - Click "Add Item" dropdown
     - Select "Medication"
     - Select "Paracetamol"
     - Enter quantity: 5
     - Click "Save List"
  9. Click "Mark as Approved"
  10. Go to Pharmacy location: `/facility/{facilityId}/locations/{pharmacyLocationId}/inventory/internal/dispatch`
  11. Find the stock request row by name
  12. Click "See Details"
  13. Click "Create Delivery Order"
  14. Click "Create"
  15. Click "Load from order"
  16. Click "Done"
  17. Click "Select stock" button on first row
  18. Select any stock item from the list
  19. Click outside the popover to close
  20. Click "Save"
  21. Click "Mark as Approved"
  22. Navigate to Pharmacy dispatch: `/facility/{facilityId}/locations/{pharmacyLocationId}/inventory/internal/dispatch`
  23. Click "Outgoing Deliveries" tab
  24. Find the delivery order row by name
  25. Click "View Details"

### Steps

1. **Action:** View the supply delivery table in internal transfer mode after following data setup
   **Expect:** Table displays Expiry Date column between Batch and Requested Qty columns (same position as external mode)
   **Record through:** yes

2. **Action:** Check the expiry date value (from selected stock)
   **Expect:** Expiry date displays in dd/MM/yyyy format or "-" if stock has no expiry
   **Record through:** yes

### Success looks like

- Internal transfer table has same Expiry Date column as external purchases
- Format and position are consistent

## AC4 — Expiry date column appears between batch and requested quantity in external purchases

### Research map

- Same as AC1
- This is the default behavior already verified in AC1

### Prerequisites

- Same as AC1

### Data setup

- Same as AC1

### Steps

1. **Action:** View the supply delivery table for external purchase (follow AC1 data setup)
   **Expect:** Column order is: ... Batch → Expiry Date → Requested Qty ...
   **Record through:** yes

### Success looks like

- Expiry Date column is positioned immediately after Batch column
- Requested Qty column appears after Expiry Date

## AC5 — Expiry date appears in print layout

### Research map

- print component: `src/pages/Facility/services/inventory/externalSupply/deliveryOrder/PrintDeliveryOrder.tsx`
- route: `/facility/{facilityId}/locations/{locationId}/inventory/external/deliveries/:tab/:id/print`
- headers include lot_batch_number and expiry_date for both internal and external (lines 74-82)

### Prerequisites

- Same as AC1

### Data setup

- Same as AC1 (reuse the delivery created in AC1)

### Steps

1. **Action:** Navigate to the delivery order print page: `/facility/{facilityId}/locations/{locationId}/inventory/external/deliveries/outgoing/{deliveryOrderId}/print`
   **Expect:** Print preview loads with delivery order details
   **Record through:** yes

2. **Action:** Locate the supply deliveries table in the print preview
   **Expect:** Table headers include: Product, Lot/Batch Number, Expiry Date, Quantity, Status, Condition
   **Record through:** yes

3. **Action:** Check the expiry date value in the printed table
   **Expect:** Expiry date displays in dd/MM/yyyy format matching the table view
   **Record through:** yes

### Success looks like

- Print layout includes both batch number and expiry date columns
- Format matches the table view (dd/MM/yyyy)
- Columns appear for both internal and external deliveries

## Test plan / notes

- Playwright E2E test should be added to cover:
  - External delivery creation with expiry date
  - Verification of expiry date in SupplyDeliveryTable
  - Internal transfer with inventory selection (expiry from stock)
  - Empty expiry date showing "-" placeholder
- Tests should use faker for unique names (PO-${Date.now()}, BATCH-${Date.now()})
- Test file location: `tests/facility/services/locations/inventory/supplyDelivery.spec.ts`
- CI must pass with no regression in existing inventory tests
