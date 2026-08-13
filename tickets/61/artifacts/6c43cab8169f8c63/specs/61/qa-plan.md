# QA Plan: Add expiry date to purchase delivery table

## AC1 — Display expiry date in saved delivery table

### Research map

- routes: src/pages/Facility/services/inventory/externalSupply/deliveryOrder/DeliveryOrderShow.tsx → `/facility/:facilityId/locations/:locationId/inventory/external/:requestOrderId/delivery/:deliveryOrderId`
- routes: src/pages/Facility/services/inventory/ToReceive.tsx → `/facility/:facilityId/locations/:locationId/inventory/internal/receive`
- components: src/pages/Facility/services/inventory/SupplyDeliveryTable.tsx
- form input: src/pages/Facility/services/inventory/externalSupply/deliveryOrder/SmartExternalDeliveryRow.tsx (lines 334-357)
- i18n labels: "expiry_date", "batch", "item", "Save List"
- auth/role: tests/.auth/user.json (admin)
- permissions / facility-scoped: yes
- fixtures needed: seeded facility, location (Pharmacy), product knowledge (Paracetamol)

### Prerequisites

- Facility context active
- Backend running on port 9000 with fixtures loaded (`load_fixtures`)
- User authenticated as admin (test fixture credentials: `admin` / `admin`)

### Data setup

- Prefer fixtures: `load_fixtures` provides a facility with Main Pharmacy location and Paracetamol product knowledge
- Provenance: Location and product from existing test fixtures (tests/facility/services/locations/inventory/toReceive.spec.ts and toDispatch.spec.ts)
- Fixture IDs: Use `getFacilityId()` helper from tests/support/facilityId.ts
- No API seed required - UI workflow creates all data needed

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/services/`
   **Expect:** Services page loads showing Main Pharmacy and Pathology Lab locations
   **Record through:** yes

2. **Action:** Click "Main Pharmacy" link
   **Expect:** Location page loads with Pharmacy sublocation
   **Record through:** yes

3. **Action:** Click "Pharmacy" link
   **Expect:** Location dashboard loads showing medication requests and inventory tabs
   **Record through:** yes

4. **Action:** Click "External Supply" tab (or navigate to `/facility/{facilityId}/locations/{locationId}/inventory/external`)
   **Expect:** External supply page loads with "Raise Purchase Order" button visible
   **Record through:** yes

5. **Action:** Click "Raise Purchase Order" button
   **Expect:** Purchase order creation dialog opens
   **Record through:** yes

6. **Action:** Fill in order name with "QA-PO-61-{timestamp}" and select supplier, then click "Create"
   **Expect:** Purchase order created, page redirects to order details showing empty items list
   **Record through:** yes

7. **Action:** Click "Create Delivery Order" button
   **Expect:** Delivery order form opens with empty table for adding items
   **Record through:** yes

8. **Action:** In the first row, select "Medication" from product type dropdown, then select "Paracetamol" from product knowledge dropdown
   **Expect:** Product selected, batch and expiry date fields become enabled
   **Record through:** yes

9. **Action:** Fill in batch number with "BATCH-QA-61", expiry date with a future date (e.g., 01/01/2027 formatted as 2027-01-01 in the date input), quantity with "10", pack size with "10", pack quantity with "1"
   **Expect:** All fields populated, form accepts the values
   **Record through:** yes

10. **Action:** Click "Save List" button
    **Expect:** Item saved to delivery table, row appears in table below with Paracetamol, BATCH-QA-61, quantity 10
    **Record through:** yes

11. **Action:** Inspect the delivery table row that was just saved
    **Expect:** Table row contains a column showing expiry date formatted as "01/01/2027" (dd/MM/yyyy format)
    **Record through:** yes

### Success looks like

- Expiry date column is visible in the delivery table header
- Saved item row displays expiry date "01/01/2027" in dd/MM/yyyy format
- Column is positioned between "Batch" and "Requested Qty" columns

## AC2 — Expiry date column with dd/MM/yyyy format

### Research map

- Same as AC1
- date formatting: src/pages/Facility/services/inventory/SupplyDeliveryTable.tsx uses formatDate from date-fns
- reference: src/pages/Facility/services/pharmacy/DispensedMedicationList.tsx (lines 181-228) for date display pattern

### Prerequisites

- Same as AC1
- Continuing from AC1 state or create new delivery with expiry date

### Data setup

- Same as AC1

### Steps

1. **Action:** Continuing from AC1 step 11, or navigate to an existing delivery order with saved items
   **Expect:** Delivery table visible with saved items
   **Record through:** yes

2. **Action:** Locate the expiry date column in the table header
   **Expect:** Column header shows "Expiry Date" (from i18n key "expiry_date")
   **Record through:** yes

3. **Action:** Inspect the expiry date cell for the saved item
   **Expect:** Date displays in dd/MM/yyyy format (e.g., "01/01/2027" for January 1, 2027)
   **Record through:** yes

### Success looks like

- Expiry date is formatted consistently as dd/MM/yyyy (day/month/year)
- Format matches the pattern used in PrintDeliveryOrder.tsx (line 104)

## AC3 — Display "-" for missing expiry date

### Research map

- Same as AC1
- null handling: src/pages/Facility/services/inventory/SupplyDeliveryTable.tsx line 296 checks for missing expiry date

### Prerequisites

- Same as AC1

### Data setup

- Same as AC1

### Steps

1. **Action:** In the delivery order form, add a new item by selecting a product but leave the expiry date field blank
   **Expect:** Product selected with quantity but no expiry date entered
   **Record through:** yes

2. **Action:** Click "Save List" button to save the item
   **Expect:** Item saved to delivery table without expiry date
   **Record through:** yes

3. **Action:** Inspect the expiry date column for this new item row
   **Expect:** Cell displays "-" (hyphen) indicating no expiry date available
   **Record through:** yes

### Success looks like

- Empty expiry date field results in "-" displayed in the table cell
- No blank or undefined text shown
- Consistent with batch column pattern (line 286-288 in SupplyDeliveryTable.tsx)

## AC4 — Visual distinction for expired items

### Research map

- styling: src/pages/Facility/services/inventory/SupplyDeliveryTable.tsx lines 300-316 applies conditional classes
- reference: src/pages/Facility/services/pharmacy/DispensedMedicationList.tsx lines 217-227 for expiry styling pattern
- classes: red text for expired (text-red-600), amber for expiring soon (text-amber-600)

### Prerequisites

- Same as AC1

### Data setup

- Same as AC1

### Steps

1. **Action:** In the delivery order form, add an item with an expired date (e.g., 01/01/2020 or 2020-01-01)
   **Expect:** Item form accepts past date for expiry
   **Record through:** yes

2. **Action:** Click "Save List" button
   **Expect:** Item with expired date saved to delivery table
   **Record through:** yes

3. **Action:** Inspect the expiry date cell for the expired item
   **Expect:** Date text displays in red color (text-red-600 class applied) with medium font weight
   **Record through:** yes

4. **Action:** Add another item with a date expiring within 90 days (e.g., 60 days from today)
   **Expect:** Item saved to table with near-expiry date
   **Record through:** yes

5. **Action:** Inspect the expiry date cell for the expiring-soon item
   **Expect:** Date text displays in amber/yellow color (text-amber-600 class applied) with medium font weight
   **Record through:** yes

6. **Action:** Compare with an item that has an expiry date far in the future (e.g., 2027)
   **Expect:** Future expiry date displays in default text color (no special styling)
   **Record through:** yes

### Success looks like

- Expired dates (past) show in red text with medium font weight
- Expiring soon dates (within 90 days) show in amber text with medium font weight
- Future dates show in normal text color
- Visual distinction is clear and immediately noticeable

## AC5 — Mobile/responsive table behavior

### Research map

- table component: src/components/Common/Table.tsx provides responsive table structure
- table usage: src/pages/Facility/services/inventory/SupplyDeliveryTable.tsx wraps in Table component

### Prerequisites

- Same as AC1
- Delivery table with multiple items and expiry dates visible

### Data setup

- Same as AC1

### Steps

1. **Action:** With the delivery table visible on desktop view, resize browser window to mobile width (375px or use browser DevTools device emulation)
   **Expect:** Table adapts to narrow screen, horizontal scrolling may appear
   **Record through:** yes

2. **Action:** Scroll the table horizontally (if scrollable)
   **Expect:** All columns including expiry date column remain readable and properly aligned
   **Record through:** yes

3. **Action:** Inspect expiry date column at mobile width
   **Expect:** Column header and cell text remain visible and properly formatted (dd/MM/yyyy format intact)
   **Record through:** yes

4. **Action:** Verify text wrapping or truncation behavior
   **Expect:** Date values do not wrap or truncate awkwardly; dd/MM/yyyy format is preserved
   **Record through:** yes

### Success looks like

- Expiry date column is visible and readable at mobile screen widths
- Date format remains dd/MM/yyyy without breaking or truncating
- Table scrolls smoothly if needed to show all columns
- No layout issues or overlapping content

## Test plan / notes

### Playwright E2E coverage

- Add test case to verify expiry date column appears in delivery table after saving items
- Test case for date format validation (dd/MM/yyyy)
- Test case for "-" display when expiry date is null/undefined
- Test case for red styling on expired dates and amber on expiring-soon dates
- Test responsive behavior (viewport testing)

### CI expectations

- Build must succeed with no TypeScript errors
- Lint checks must pass (no new ESLint warnings)
- Date formatting must use date-fns formatDate as per codebase standard
- Visual regression tests (if available) should not show unexpected layout changes

### Implementation notes

- Expiry date column added to SupplyDeliveryTable.tsx between "Batch" and "Requested Qty" columns
- Date formatting uses formatDate(new Date(expiryDate), "dd/MM/yyyy") from date-fns
- Conditional styling applied using cn() utility with text-red-600 for expired, text-amber-600 for expiring soon (within 90 days)
- Supports both internal and external delivery types (checks both supplied_inventory_item and supplied_item paths)
- No backend API changes required; expiration_date field already exists in ProductBase type
