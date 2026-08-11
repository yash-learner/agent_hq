# QA Plan: Purchase Delivery Table - Add Expiry Date Column

## AC1 — Expiry date column appears after batch column in dd/MM/yyyy format

### Research map

- routes: src/pages/Facility/locations/LocationLayout.tsx → `/facility/:facilityId/locations/:locationId/inventory/external/deliveries/:tab/:id`
- components: SupplyDeliveryTable.tsx, DeliveryOrderShow.tsx
- i18n labels: "expiry_date" (already exists)
- auth/role: tests/.auth/user.json
- permissions: facility-scoped: yes
- fixtures needed: facility with location, external delivery order with items containing expiry dates

### Prerequisites

- User logged in with facility admin or appropriate inventory permissions
- Facility with at least one location configured
- External delivery order must exist with supply deliveries that have expiry dates

### Data setup

- Prefer fixtures: load-fixtures provides a seeded facility and location; no delivery orders with expiry dates
- Provenance: Based on SmartExternalDeliveryRow.tsx form structure (line 334-350) and SupplyDeliveryTable.tsx
- UI recipe:
  1. Navigate to `/facility/{facilityId}/locations/{locationId}/inventory/external/deliveries/outgoing`
  2. Click "New Delivery Order" button
  3. Fill in required fields:
     - Supplier: Select any supplier from the list
     - Add at least one product to the delivery
  4. For each product row in the delivery form:
     - Select a product from the Product Knowledge dropdown
     - Enter batch/lot number in the "Batch" field
     - **Enter an expiry date** in the date picker field (e.g., 31/12/2026)
     - Enter quantity
     - Fill other required fields (pack size, purchase price if applicable)
  5. Click "Save List" to save the delivery items
  6. The table should now display with the saved items

### Steps

1. **Action:** Navigate to the external delivery order that contains items with expiry dates (created in Data setup)
   **Expect:** The delivery order page loads showing the SupplyDeliveryTable with saved delivery items
   **Record through:** yes

2. **Action:** Locate the table header row and verify the column headers
   **Expect:** The table has columns in this order: "#", "Item", "Batch", "Expiry Date", "Requested Qty", (and other columns). The "Expiry Date" column header appears immediately after the "Batch" column
   **Record through:** yes

3. **Action:** Examine the expiry date values in the table rows
   **Expect:** Each row displays the expiry date in dd/MM/yyyy format (e.g., "31/12/2026") in the "Expiry Date" column
   **Record through:** yes

### Success looks like

- Table header shows "Expiry Date" column after "Batch" column
- Expiry dates are visible in dd/MM/yyyy format for all items that have expiry dates
- No console errors or broken layouts

---

## AC2 — Items without expiry date show "-" placeholder

### Research map

- Same as AC1

### Prerequisites

- Same as AC1

### Data setup

- Same as AC1, but additionally: 7. Add another product row to the delivery order 8. Select a product but **do not enter an expiry date** (leave it empty) 9. Fill other required fields and save

### Steps

1. **Action:** View the delivery order table that contains items with and without expiry dates
   **Expect:** The table displays all items
   **Record through:** yes

2. **Action:** Locate the row for the item that has no expiry date entered
   **Expect:** The "Expiry Date" column for that row shows "-" as a placeholder
   **Record through:** yes

3. **Action:** Verify that items with expiry dates still show dates in dd/MM/yyyy format
   **Expect:** Items with expiry dates display correctly (e.g., "31/12/2026"), items without show "-"
   **Record through:** yes

### Success looks like

- Rows without expiry dates display "-" in the expiry date column
- Rows with expiry dates continue to display dates correctly
- No broken layouts or missing data

---

## AC3 — Expiry date column displays in internal transfer mode

### Research map

- routes: src/pages/Facility/locations/LocationLayout.tsx → `/facility/:facilityId/locations/:locationId/inventory/internal/:type/deliveries/:id`
- components: Same as AC1, but with `internal={true}` prop
- auth/role: tests/.auth/user.json
- permissions: facility-scoped: yes
- fixtures needed: facility with location, internal transfer delivery order with items containing expiry dates

### Prerequisites

- User logged in with facility admin or appropriate inventory permissions
- Facility with at least two locations configured for internal transfers

### Data setup

- Prefer fixtures: load-fixtures provides a seeded facility; internal deliveries with expiry dates not present
- Provenance: Based on DeliveryOrderShow.tsx and SupplyDeliveryTable.tsx with `internal={true}`
- UI recipe:
  1. Navigate to `/facility/{facilityId}/locations/{locationId}/inventory/internal/receive/deliveries`
  2. Click "New Delivery Order" button (or equivalent for internal transfers)
  3. Fill in required fields:
     - Origin location: Select a location within the facility
     - Destination location: Select a different location
     - Add at least one product to the delivery
  4. For each product row:
     - Select a product from inventory
     - Enter batch/lot number
     - **Enter an expiry date** (e.g., 15/06/2027)
     - Enter quantity
  5. Click "Save List" to save the delivery items
  6. Navigate to view the delivery order

### Steps

1. **Action:** Navigate to the internal transfer delivery order created in Data setup
   **Expect:** The delivery order page loads showing the SupplyDeliveryTable with the internal transfer items
   **Record through:** yes

2. **Action:** Verify the table structure and column headers
   **Expect:** The table shows "#", "Item", "Batch", "Expiry Date", "Requested Qty", etc. The "Expiry Date" column is present after the "Batch" column
   **Record through:** yes

3. **Action:** Check the expiry date values in the table
   **Expect:** Expiry dates display in dd/MM/yyyy format (e.g., "15/06/2027") consistently with external delivery tables
   **Record through:** yes

### Success looks like

- Internal transfer delivery table includes "Expiry Date" column after "Batch" column
- Expiry dates display in the same dd/MM/yyyy format as external deliveries
- No differences in format or layout between internal and external modes

---

## AC4 — Expiry date column appears between batch and requested quantity in external purchases

### Research map

- Same as AC1

### Prerequisites

- Same as AC1

### Data setup

- Same as AC1 (external delivery order)

### Steps

1. **Action:** Navigate to an external purchase delivery order with items
   **Expect:** The delivery order table displays
   **Record through:** yes

2. **Action:** Examine the column order in the table header
   **Expect:** The columns appear in this specific order: "Batch", "Expiry Date", "Requested Qty". Confirm that "Expiry Date" is positioned between "Batch" and "Requested Qty"
   **Record through:** yes

3. **Action:** Verify this column order is consistent across all rows
   **Expect:** All rows follow the same column structure with expiry date between batch and requested quantity
   **Record through:** yes

### Success looks like

- Column order is correct: Batch → Expiry Date → Requested Qty
- Layout is clean and columns are properly aligned
- No overlap or misalignment of column headers and data

---

## AC5 — Expiry dates appear in print layout

### Research map

- routes: src/pages/Facility/locations/LocationLayout.tsx → `/facility/:facilityId/locations/:locationId/inventory/external/deliveries/:tab/:id/print`
- components: PrintDeliveryOrder.tsx
- i18n labels: "expiry_date", "lot_batch_number"
- auth/role: tests/.auth/user.json
- permissions: facility-scoped: yes
- fixtures needed: same as AC1 (external delivery order with expiry dates)

### Prerequisites

- Same as AC1
- External delivery order with items that have expiry dates exists

### Data setup

- Same as AC1 (no additional setup needed; using the same delivery order)

### Steps

1. **Action:** From the delivery order view page, click the "Print" button or navigate to the print URL (`/facility/{facilityId}/locations/{locationId}/inventory/external/deliveries/outgoing/{deliveryOrderId}/print`)
   **Expect:** The print preview page loads showing the delivery order in print format
   **Record through:** yes

2. **Action:** Verify the print table includes expiry date information
   **Expect:** The print table displays a column or section for expiry dates. According to PrintDeliveryOrder.tsx (lines 80-81, 93-95, 103-105), for internal deliveries the table shows both "lot_batch_number" and "expiry_date" headers with values formatted as dd/MM/yyyy. External deliveries should display expiry dates alongside batch numbers
   **Record through:** yes

3. **Action:** Check the expiry date format in the print layout
   **Expect:** Expiry dates appear in dd/MM/yyyy format, matching the table view. Items without expiry dates show "-"
   **Record through:** yes

### Success looks like

- Print layout includes expiry date information
- Expiry dates are formatted consistently (dd/MM/yyyy) with the on-screen table
- Batch numbers and expiry dates are displayed together for easy reference
- Print layout is clean and readable

---

## Test plan / notes

### Playwright E2E Coverage

- Add Playwright test to verify expiry date column appears in SupplyDeliveryTable
- Test should create a delivery order with items having expiry dates and verify:
  - Column header "Expiry Date" is present after "Batch"
  - Expiry dates are displayed in dd/MM/yyyy format
  - Items without expiry dates show "-"
  - Both internal and external delivery modes work correctly
- Test should verify print layout includes expiry date information

### CI Requirements

- All existing Playwright tests must pass
- Linting must pass (`npm run lint`)
- Type checking must pass (`npx tsc --noEmit`)
- No console errors or warnings in the application

### Notes

- The expiry_date field already exists in the Product type (ProductBase.expiration_date)
- The i18n key "expiry_date" already exists in public/locale/en.json
- The form (SmartExternalDeliveryRow.tsx) already captures expiry dates
- Implementation adds the column to the table display to match the form input
