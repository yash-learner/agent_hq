# QA Plan: Add expiry date to purchase delivery table

## AC1 — Expiry date displays in dedicated column after batch

### Research map

- routes: facility services → locations → inventory → internal dispatch/receive
- components: `src/pages/Facility/services/inventory/SupplyDeliveryTable.tsx`
- i18n labels: "expiry_date" (already exists in `public/locale/en.json`)
- auth/role: `tests/.auth/user.json` (admin)
- permissions: facility-scoped (requires facilityId and locationId)
- fixtures needed: seeded facility from load_fixtures, internal inventory locations (Pharmacy, Bio-Chemistry)

### Prerequisites

- Backend running on port 9000
- Fixtures loaded (facility, locations, products)
- Admin authenticated

### Data setup

- Prefer fixtures: load_fixtures provides facility with locations (Pharmacy, Bio-Chemistry)
- Products: Paracetamol exists in fixtures
- Flow requires creating internal stock request → delivery order with expiry date
- Provenance: test flow from `tests/facility/services/locations/inventory/toDispatch.spec.ts`
- UI recipe:
  1. Navigate to Bio-Chemistry location → Inventory → Internal → Receive
  2. Create Stock Request for Paracetamol from Pharmacy
  3. Approve request
  4. Navigate to Pharmacy location → Inventory → Internal → Dispatch
  5. Create Delivery Order
  6. Load from order and select stock with expiry date
  7. Save and approve delivery order

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/services/`
   **Expect:** Services page loads with location cards
   **Record through:** yes

2. **Action:** Click "Main Pharmacy" → Click "Pharmacy" location
   **Expect:** Pharmacy location page loads (extract locationId from URL: `/facility/{facilityId}/locations/{locationId}/medication_requests`)
   **Record through:** yes

3. **Action:** Navigate to Pathology Lab → Bio-Chemistry location (extract locationId for Bio-Chemistry)
   **Expect:** Bio-Chemistry location page loads
   **Record through:** yes

4. **Action:** Navigate to `/facility/{facilityId}/locations/{bioChemLocationId}/inventory/internal/receive`
   **Expect:** Internal Receive inventory page loads
   **Record through:** yes

5. **Action:** Click "Raise Stock Request" button
   **Expect:** Stock request creation dialog opens
   **Record through:** yes

6. **Action:** Fill form:
   - Name: "QA Stock Request {timestamp}"
   - Select Location: Choose "Pharmacy"
   - Priority: Select "Urgent"
   - Click "Create"
     **Expect:** Stock request detail page loads with heading showing the request name
     **Record through:** yes

7. **Action:**
   - Click "Add Item" combobox
   - Select "Medication" category
   - Select "Paracetamol" product
   - Enter quantity: 5
   - Click "Save List"
     **Expect:** Table row shows Paracetamol with quantity 5
     **Record through:** yes

8. **Action:** Click "Mark as Approved" button
   **Expect:** Request status changes to approved
   **Record through:** yes

9. **Action:** Navigate to `/facility/{facilityId}/locations/{pharmacyLocationId}/inventory/internal/dispatch`
   **Expect:** Internal Dispatch page loads with stock requests table
   **Record through:** yes

10. **Action:** Find the request row (by name "QA Stock Request {timestamp}") and click "See Details"
    **Expect:** Request details page loads showing Paracetamol item
    **Record through:** yes

11. **Action:** Click "Create Delivery Order" link
    **Expect:** Delivery order creation page loads
    **Record through:** yes

12. **Action:** Click "Create" button to create the delivery order
    **Expect:** Delivery order detail page loads with "Load from order" button visible
    **Record through:** yes

13. **Action:**
    - Click "Load from order" button
    - Click "Done" to confirm loading items
      **Expect:** Delivery items form appears with Paracetamol row
      **Record through:** yes

14. **Action:** Click "Select stock" button for the Paracetamol item
    **Expect:** Stock selection dropdown opens showing available inventory with prices
    **Record through:** yes

15. **Action:** Click on a stock item with price (e.g., "₹20.00")
    **Expect:** Stock selected, dropdown closes
    **Record through:** yes

16. **Action:** In the expiry date field for the item, enter a future date (e.g., "2026-12-31")
    **Expect:** Date field accepts the value
    **Record through:** yes

17. **Action:** Click "Save" button to save the delivery items
    **Expect:** Items saved, table shows the delivery with batch and expiry date
    **Record through:** yes

18. **Action:** Scroll to the supply delivery table and locate the table header row
    **Expect:** Table headers show columns in order: "#", "Item", "Batch", "Expiry Date", "Requested Qty", etc.
    **Record through:** yes

19. **Action:** Locate the Paracetamol row in the supply delivery table body
    **Expect:**
    - Batch column shows the lot number (if available) or "-"
    - **Expiry Date column (immediately after Batch) shows the date in dd/MM/yyyy format (e.g., "31/12/2026")**
      **Record through:** yes

### Success looks like

- Supply delivery table has a new "Expiry Date" column positioned after the "Batch" column
- The expiry date "31/12/2026" is visible in the new column for the Paracetamol delivery
- Column header reads "Expiry Date"

---

## AC2 — Empty expiry date shows "-"

### Research map

- Same as AC1

### Prerequisites

- Same as AC1
- Same delivery order from AC1 or create a new one

### Data setup

- Same as AC1
- Create delivery item without setting expiry date

### Steps

1. **Action:** Continue from AC1 setup, or create a new delivery order following steps 1-15 from AC1
   **Expect:** Delivery order with items loaded
   **Record through:** yes

2. **Action:** When adding/editing a delivery item, leave the expiry date field empty (do not enter a date)
   **Expect:** Expiry date field remains empty
   **Record through:** yes

3. **Action:** Click "Save" to save the delivery items
   **Expect:** Items saved
   **Record through:** yes

4. **Action:** Examine the supply delivery table, specifically the Expiry Date column for the item without an expiry date
   **Expect:** The Expiry Date column for that item displays "-" instead of a date
   **Record through:** yes

### Success looks like

- Items without expiry dates show "-" in the Expiry Date column
- No empty cells or "undefined"/"null" text

---

## AC3 — Expiry dates display in dd/MM/yyyy format

### Research map

- Same as AC1

### Prerequisites

- Same as AC1
- Multiple delivery items with different expiry dates

### Data setup

- Same as AC1
- Create multiple delivery items with various expiry dates to verify consistent formatting

### Steps

1. **Action:** Continue from AC1, or create a new delivery order with multiple items, each with different expiry dates:
   - Item 1: Expiry date "2026-01-15"
   - Item 2: Expiry date "2026-12-31"
     **Expect:** Multiple items with different expiry dates saved
     **Record through:** yes

2. **Action:** Examine the Expiry Date column for all items in the supply delivery table
   **Expect:** All expiry dates display in dd/MM/yyyy format:
   - "15/01/2026"
   - "31/12/2026"
     **Record through:** yes

### Success looks like

- All expiry dates consistently formatted as dd/MM/yyyy (day/month/year)
- No ISO format dates (YYYY-MM-DD)
- Dates are clearly readable

---

## AC4 — Expiry date column appears in print view

### Research map

- routes: Same as AC1
- components: `src/pages/Facility/services/inventory/externalSupply/deliveryOrder/PrintDeliveryOrder.tsx`
- i18n labels: Same as AC1
- auth/role: `tests/.auth/user.json`
- permissions: facility-scoped
- fixtures needed: Same as AC1

### Prerequisites

- Delivery order created from AC1 with items that have expiry dates

### Data setup

- Use the delivery order created in AC1
- Provenance: Print component from `src/pages/Facility/services/inventory/externalSupply/deliveryOrder/PrintDeliveryOrder.tsx` already includes expiry_date in the table at lines 80, 93-104

### Steps

1. **Action:** On the delivery order detail page (from AC1), locate and click the print icon/button (Printer icon)
   **Expect:** Print preview dialog/page opens
   **Record through:** yes

2. **Action:** Examine the supply deliveries table in the print preview
   **Expect:**
   - Table headers include "lot_batch_number" and "expiry_date" columns (for internal deliveries)
   - Table rows show batch numbers and expiry dates in dd/MM/yyyy format
   - Expiry date column appears after the lot/batch column
     **Record through:** yes

3. **Action:** Verify the expiry date matches the value entered in AC1 (e.g., "31/12/2026")
   **Expect:** Expiry date displays correctly in print view
   **Record through:** yes

### Success looks like

- Print preview shows the expiry date column
- Expiry dates in print view match the table view
- Format is dd/MM/yyyy

---

## Test plan / notes

### Playwright E2E coverage

- Add E2E test for verifying expiry date column presence in supply delivery table
- Test should:
  1. Create internal stock request with product
  2. Create delivery order and load items
  3. Select stock and set expiry date
  4. Verify expiry date column header exists
  5. Verify expiry date displays in dd/MM/yyyy format
  6. Verify empty expiry date shows "-"
  7. Verify print view includes expiry date column
- Test file location: `tests/facility/services/locations/inventory/`
- Extend existing `toDispatch.spec.ts` or create new `supplyDeliveryTable.spec.ts`

### CI expectations

- TypeScript compilation passes (no type errors)
- ESLint passes (no linting errors)
- Prettier formatting applied
- No breaking changes to existing inventory flows
