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

- Prefer fixtures: load-fixtures provides a facility with Main Pharmacy and Bio-Chemistry locations already configured
- Provenance: Location navigation from tests/facility/services/locations/inventory/toDispatch.spec.ts (lines 56-79)
- UI recipe (to create a delivery order with expiry date):
  1. Go to `/facility/{facilityId}/services/`
  2. Click "Main Pharmacy" → Click "Pharmacy" link
  3. Go back to `/facility/{facilityId}/services/`
  4. Click "Pathology Lab" → Click "Bio-Chemistry" link
  5. Extract bioChemLabLocationId from URL pattern `/facility/{facilityId}/locations/([^/]+)/service_requests`
  6. Navigate to `/facility/{facilityId}/locations/{bioChemLabLocationId}/inventory/internal/receive`
  7. Click "Raise Stock Request"
  8. Fill Name: `qa-stock-request-{Date.now()}`
  9. Select Location: "Pharmacy"
  10. Select Priority: "Urgent"
  11. Click "Create"
  12. In Add Item dropdown, select "Medication" → "Paracetamol"
  13. Enter quantity: "5"
  14. Click "Save List"
  15. Click "Mark as Approved"
  16. Navigate to `/facility/{facilityId}/locations/{pharmacyLocationId}/inventory/internal/dispatch`
  17. Click "See Details" on the created order
  18. Click "Create Delivery Order"
  19. Click "Create"
  20. Click "Load from order"
  21. Click "Done"
  22. Click "Select stock" button for the first item
  23. Select a stock item with expiry date (click on item row with price)
  24. Click outside to close the stock picker
  25. Verify expiry date is visible in the form
  26. Click "Save"
- After seed: the expiry date should now be visible in the supply delivery table

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

- Same as AC1, but select a stock item without an expiry date (if available)
- If no stock without expiry exists: note that fixtures may not provide this scenario; QA can verify by checking the table for any "-" values in the Expiry column

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

- Prefer fixtures: load-fixtures provides facility and locations
- Provenance: Similar to internal flow but for external supply
- UI recipe (to create external delivery with expiry):
  1. Navigate to `/facility/{facilityId}/locations/{pharmacyLocationId}/inventory/external/receive`
  2. Click "Create Purchase Order" (or similar button to initiate external purchase)
  3. Fill in supplier details and add items
  4. Add batch and expiry date for items
  5. Save the purchase delivery
- Note: If external purchase flow differs from internal, QA should adapt steps based on actual UI
- After seed: verify the purchase delivery table shows expiry column

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
