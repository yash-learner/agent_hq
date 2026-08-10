# QA Plan: Add expiry date to purchase delivery table

## AC1 — Display expiry date in dd/MM/yyyy format for saved items with expiry date

### Research map

- routes: src/Routers/routes/FacilityRoutes.tsx → /facility/:facilityId/locations/:locationId/inventory/internal/dispatch, /facility/:facilityId/locations/:locationId/inventory/internal/receive
- components: src/pages/Facility/services/inventory/SupplyDeliveryTable.tsx, src/pages/Facility/services/inventory/externalSupply/deliveryOrder/DeliveryOrderShow.tsx
- i18n labels: "expiry", "batch", "Save List", "Mark as Approved", "Create Delivery Order"
- auth/role: tests/.auth/user.json (admin)
- permissions / facility-scoped: yes (facility context required)
- fixtures needed: seeded facility, Main Pharmacy location, Pathology Lab → Bio-Chemistry location

### Prerequisites

- Backend running on port 9000 with fixtures loaded (`npm run playwright:db-reset` in backend)
- Facility context: use `getFacilityId()` from tests/support/facilityId.ts
- Main Pharmacy and Bio-Chemistry locations exist (from load-fixtures)

### Data setup

- Prefer fixtures: load-fixtures provides:
  - Facility with Main Pharmacy service and Pharmacy location (fixture creates stock items)
  - Bio-Chemistry location under Pathology Lab service
  - Product: Paracetamol (medication) with pre-existing stock in Pharmacy location
  - Stock items with expiration dates and pricing (₹20.00) from fixture data
- Provenance:
  - Location discovery: `tests/facility/services/locations/inventory/toDispatch.spec.ts` lines 56-79
  - Stock selection pattern: same file lines 107-109 (selects stock by price "₹20.00")
  - API paths: `src/types/inventory/product/inventoryApi.ts` line 6 for inventory listing
    `/api/v1/facility/{facilityId}/location/{locationId}/product/`
  - Stock structure: `src/types/inventory/product/product.ts` line 24 defines `expiration_date` field
- UI recipe (to create internal delivery order that displays expiry):
  1. Navigate to `/facility/{facilityId}/services/`
  2. Click "Main Pharmacy" → Click "Pharmacy" link
  3. Record pharmacyLocationId from URL: `/facility/{facilityId}/locations/{pharmacyLocationId}/medication_requests`
  4. Navigate back to `/facility/{facilityId}/services/`
  5. Click "Pathology Lab" → Click "Bio-Chemistry" link
  6. Record bioChemLabLocationId from URL: `/facility/{facilityId}/locations/{bioChemLabLocationId}/service_requests`
  7. Navigate to `/facility/{facilityId}/locations/{bioChemLabLocationId}/inventory/internal/receive`
  8. Click "Raise Stock Request"
  9. Fill Name: `qa-expiry-test-{Date.now()}`
  10. Select Location: "Pharmacy" (from dropdown)
  11. Select Priority: "Urgent" (radio button)
  12. Click "Create"
  13. Click "Add Item" dropdown → "Medication" → "Paracetamol"
  14. Enter quantity: "5" in spinbutton
  15. Click "Save List"
  16. Verify table row shows "Paracetamol" and "5"
  17. Click "Mark as Approved"
  18. Navigate to `/facility/{facilityId}/locations/{pharmacyLocationId}/inventory/internal/dispatch`
  19. Locate order row containing the created order name
  20. Click "See Details" button on that row
  21. Verify table shows "Paracetamol" and "5"
  22. Click "Create Delivery Order" link
  23. Click "Create" button
  24. Click "Load from order" button
  25. Click "Done" button
  26. Click "Select stock" button (appears for each item row - use .nth(1) if multiple rows)
  27. In stock picker modal, click on stock item showing "₹20.00" (fixture stock with expiry date)
  28. Click outside modal to close picker (mouse click at 0,0 or press Escape)
  29. Verify form now shows batch and expiry date fields populated
  30. Click "Save" button
- After seed: navigate to delivery order details to verify expiry column in SupplyDeliveryTable
- Fixture validation: The fixtures created by `load-fixtures` include stock items in Pharmacy location
  for Paracetamol with expiration dates. These are discoverable via the stock picker when creating
  a delivery order.

### Steps

1. **Action:** After completing the Data setup steps above, verify the supply delivery table displays the expiry date
   **Expect:** The table has a column header "Expiry" between "Batch" and "Requested Qty" columns
   **Record through:** yes

2. **Action:** Locate the saved delivery item row in the table and check the expiry date column
   **Expect:** The expiry date is displayed in dd/MM/yyyy format (e.g., "15/12/2025") in the Expiry column
   **Record through:** yes

### Success looks like

- The SupplyDeliveryTable displays an "Expiry" column header between "Batch" and "Requested Qty"
- The expiry date value is formatted as dd/MM/yyyy for items with an expiry date

## AC2 — Display "-" for items without expiry date

### Research map

- Same as AC1

### Prerequisites

- Same as AC1

### Data setup

- Same as AC1 through step 26 (stock picker opened)
- At step 27: To test "-" display, QA has two options:
  1. If stock picker shows items without expiry dates (fixture may or may not provide these):
     Select a stock item that does not display an expiry date in the picker
  2. If all fixture stock has expiry dates: Create new stock without expiry via API:
     - POST `/api/v1/facility/{facilityId}/product/`
       (from `src/types/inventory/product/productApi.ts` line 23)
     - Auth: Use `getApiUrl()` + `getApiHeaders()` from `tests/helper/utils.ts` with `tests/.auth/user.json`
     - Body example (omit `expiration_date`):
       ```json
       {
         "product_knowledge": "{productKnowledgeId for Paracetamol}",
         "status": "active",
         "batch": { "lot_number": "BATCH-NO-EXPIRY" },
         "standard_pack_size": 10,
         "extensions": {}
       }
       ```
     - Then select this new stock item in the picker
- Continue from AC1 step 28 onwards
- Verify in table that item without expiry shows "-" in Expiry column

### Steps

1. **Action:** In the supply delivery table, look for any items that do not have an expiry date
   **Expect:** The Expiry column displays "-" for items without an expiry date
   **Record through:** yes

### Success looks like

- Items without expiry date show "-" in the Expiry column

## AC3 — Expiry column positioned between batch and requested quantity

### Research map

- Same as AC1

### Prerequisites

- Same as AC1

### Data setup

- Same as AC1

### Steps

1. **Action:** View the supply delivery table header row
   **Expect:** Column order from left to right includes: ... → "Batch" → "Expiry" → "Requested Qty" → ...
   **Record through:** yes

### Success looks like

- The "Expiry" column is positioned directly between "Batch" and "Requested Qty" columns

## AC4 — Expiry date visible in internal delivery table (location to location)

### Research map

- Same as AC1

### Prerequisites

- Same as AC1

### Data setup

- Same as AC1 (the toDispatch test already creates an internal delivery order)

### Steps

1. **Action:** After completing the Data setup, view the supply delivery table on the internal dispatch page
   **Expect:** The "Expiry" column is visible in the table with the expiry date displayed
   **Record through:** yes

2. **Action:** Navigate to the receiving location's incoming deliveries page: `/facility/{facilityId}/locations/{bioChemLabLocationId}/inventory/internal/receive`, click "Incoming Deliveries" tab
   **Expect:** The "Expiry" column is visible in the incoming deliveries table with the expiry date displayed
   **Record through:** yes

### Success looks like

- Both outgoing (dispatch) and incoming (receive) internal delivery tables display the Expiry column with the date

## AC5 — Expiry date visible in external delivery table (from supplier)

### Research map

- routes: /facility/:facilityId/locations/:locationId/inventory/external/receive
- components: Same as AC1
- i18n labels: Same as AC1 plus "Create Purchase Order"
- auth/role: tests/.auth/user.json (admin)
- permissions / facility-scoped: yes
- fixtures needed: Same as AC1

### Prerequisites

- Same as AC1

### Data setup

- Prefer fixtures: load-fixtures provides facility and locations, but may not provide external purchase orders
- Provenance:
  - Component: `src/pages/Facility/services/inventory/externalSupply/deliveryOrder/DeliveryOrderShow.tsx` line 152
    uses SupplyDeliveryTable with `internal={false}`
  - Form: `src/pages/Facility/services/inventory/externalSupply/deliveryOrder/AddSupplyDeliveryForm.tsx` line 102
    includes expiry_date field in schema
- Note: External supply flow uses the same SupplyDeliveryTable component as internal flow,
  so if internal flow (AC1-AC4) displays expiry correctly, external flow will too.
- UI recipe (simplified verification - if external orders exist in fixtures):
  1. Navigate to `/facility/{facilityId}/locations/{pharmacyLocationId}/inventory/external/receive`
     (or similar external inventory path - check sidebar navigation)
  2. If external delivery orders exist, view the table
  3. Verify "Expiry" column is present and displays dates in dd/MM/yyyy format
- UI recipe (full external order creation - if needed):
  1. Navigate to external inventory page for a location
  2. Create Request Order (Purchase Order) with supplier details
  3. Add items (Medication → Paracetamol)
  4. Approve the request order
  5. Create Delivery Order from the request
  6. Add delivery items with batch numbers and expiry dates
  7. Save and verify the table displays expiry dates
- After seed: verify external delivery table shows "Expiry" column with dates in dd/MM/yyyy format

### Steps

1. **Action:** Navigate to external inventory page and view purchase deliveries
   **Expect:** The "Expiry" column is visible in the external purchase delivery table
   **Record through:** yes

2. **Action:** Verify that expiry dates are displayed for external deliveries
   **Expect:** Expiry dates are shown in dd/MM/yyyy format in the Expiry column
   **Record through:** yes

### Success looks like

- External purchase delivery table displays the Expiry column with dates in dd/MM/yyyy format

## AC6 — "Expiry" label displayed in table header

### Research map

- Same as AC1

### Prerequisites

- Same as AC1

### Data setup

- Same as AC1

### Steps

1. **Action:** View any supply delivery table (internal or external)
   **Expect:** The column header displays "Expiry" (or localized equivalent) for the expiry date column
   **Record through:** yes

### Success looks like

- The column header shows "Expiry" text

## Test plan / notes

- Playwright E2E: Add test coverage in `tests/facility/services/locations/inventory/` directory
  - Test should verify expiry column presence in table
  - Test should verify date formatting (dd/MM/yyyy)
  - Test should verify "-" display for missing expiry dates
  - Test should cover both internal (location-to-location) and external (supplier) delivery scenarios
- CI: Ensure `npm run lint` and `npm run build` pass
- TypeScript: No type changes required; `expiration_date` field already exists in ProductBase type
