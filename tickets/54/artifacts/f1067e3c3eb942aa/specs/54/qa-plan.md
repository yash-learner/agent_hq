# QA Plan: Save Purchase Delivery item with Shift + Enter

## AC1 — Enter in Pack Quantity field moves focus

### Research map

- routes: `/facility/{facilityId}/locations/{locationId}/inventory/external/deliveries/{tab}/{deliveryOrderId}` (from `src/pages/Facility/locations/LocationLayout.tsx` line 331)
- components: `AddSupplyDeliveryForm.tsx` (form), `SmartExternalDeliveryRow.tsx` (input fields)
- i18n labels: "Pack Quantity", "Unit Price", "Save", "Add Item"
- auth/role: `tests/.auth/user.json` (admin)
- permissions: facility-scoped
- fixtures needed: seeded facility with locations, delivery order with products

### Prerequisites

- Backend running on port 9000 with `load_fixtures` completed
- Facility from `getFacilityId()` (`tests/support/facilityId.ts`)
- User authenticated as admin (`tests/.auth/user.json`)

### Data setup

- Prefer fixtures: `load_fixtures` provides a facility (via `getFacilityId()`) and product knowledge (Paracetamol). No external delivery order exists in fixtures.
- Provenance: Existing tests in `tests/facility/services/locations/inventory/toReceive.spec.ts` and `toDispatch.spec.ts` demonstrate creating internal stock requests. External delivery orders follow similar patterns but use external routes.
- UI recipe to create external delivery order (12 steps):
  1. Navigate to `/facility/{facilityId}/services/`
  2. Click "Main Pharmacy" link to access pharmacy services
  3. Click "Pharmacy" link (navigates to `/facility/{facilityId}/locations/{locationId}/medication_requests`)
  4. Extract `locationId` from URL using regex: `/facility/([^/]+)/locations/([^/]+)/`
  5. Navigate to `/facility/{facilityId}/locations/{locationId}/inventory/external/orders/outgoing`
  6. Click "Create Order" button (or navigate to `/inventory/external/orders/outgoing/new`)
  7. Fill "Name" field with `qa-delivery-54-${Date.now()}`
  8. Select a facility from "Select Facility" dropdown (any available facility)
  9. Select "Urgent" priority radio button
  10. Click "Create" button (creates request order)
  11. Add a product (e.g., select "Medication" → "Paracetamol", quantity: 5) and save
  12. Click "Mark as Approved" button (order becomes eligible for delivery creation)
  13. Navigate to `/facility/{facilityId}/locations/{locationId}/inventory/external/deliveries/pending` and click "Create Delivery" for the approved order
- API seed alternative (if UI graph is deep):
  - POST `/api/v1/facility/{facilityId}/order/delivery/` (from `src/types/inventory/deliveryOrder/deliveryOrderApi.ts` lines 19-24)
  - Auth: `getApiUrl()` + `getApiHeaders()` from `tests/helper/utils.ts` + `tests/.auth/user.json` storage state
  - Body example (adapt from `src/pages/Facility/services/inventory/externalSupply/deliveryOrder/AddSupplyDeliveryForm.tsx` lines 90-150):
    ```json
    {
      "name": "qa-delivery-54-1234567890",
      "status": "pending",
      "from_location": "{locationId}",
      "to_location": "{anotherLocationId}"
    }
    ```
  - Note: Facility-scoped path required — never `/api/v1/order/delivery/`
- After seed: open `/facility/{facilityId}/locations/{locationId}/inventory/external/deliveries/pending/{deliveryOrderId}` and confirm the "Add Item" button and delivery form are visible before scoring

### Steps

1. **Action:** Click "Add Item" button to add a new item row
   **Expect:** New empty item row appears in the table with input fields
   **Record through:** yes

2. **Action:** Select a product from the "Product" dropdown (e.g., "Paracetamol")
   **Expect:** Product fields populate, Pack Quantity field becomes editable
   **Record through:** yes

3. **Action:** Click into the "Pack Quantity" input field and type "5", then press Enter key (without Shift)
   **Expect:** Focus moves to the next field (Unit Price), form does NOT submit, no toast appears
   **Record through:** yes

### Success looks like

- Cursor is in the Unit Price field
- No "Supply Delivery Created" toast message
- Item row still exists in edit mode (not saved to table)
- Page URL has not changed

## AC2 — Enter in Unit Price field moves focus

### Research map

- Same as AC1

### Prerequisites

- Same as AC1
- Complete AC1 steps 1-3 (so Pack Quantity is filled and focus is ready for Unit Price)

### Data setup

- Same as AC1

### Steps

1. **Action:** In the Unit Price field (focused from AC1), type "10.50", then press Enter key (without Shift)
   **Expect:** Focus moves to the next field (likely MRP or tax field if present), form does NOT submit, no toast appears
   **Record through:** yes

### Success looks like

- Cursor has moved to the next editable field
- No "Supply Delivery Created" toast message
- Item row still exists in edit mode (not saved to table)

## AC3 — Enter in informational component fields (MRP) moves focus

### Research map

- Same as AC1
- informational_codes: facility-specific, configured in facility settings

### Prerequisites

- Same as AC1
- Facility must have at least one informational monetary component configured (e.g., MRP)
- Complete AC1-AC2 steps (Pack Quantity and Unit Price filled)

### Data setup

- Same as AC1
- Note: If facility from fixtures doesn't have MRP field visible, this criterion can be marked as "N/A - no informational fields configured" during QA

### Steps

1. **Action:** If MRP or other informational price field is visible, click into it, type "12.00", then press Enter key (without Shift)
   **Expect:** Focus moves to the next field, form does NOT submit, no toast appears
   **Record through:** yes

### Success looks like

- Cursor has moved to the next editable field
- No "Supply Delivery Created" toast message
- Item row still exists in edit mode

## AC4 — Enter in Total Purchase Price field moves focus

### Research map

- Same as AC1

### Prerequisites

- Same as AC1
- Complete AC1-AC3 steps (previous fields filled)

### Data setup

- Same as AC1

### Steps

1. **Action:** Click into the "Total Purchase Price" field, type "50.00", then press Enter key (without Shift)
   **Expect:** Focus moves to the next field (or wraps to first field / no-op if last), form does NOT submit, no toast appears
   **Record through:** yes

### Success looks like

- No "Supply Delivery Created" toast message
- Item row still exists in edit mode (not saved to table)

## AC5 — Shift + Enter submits the form

### Research map

- Same as AC1
- keyboard shortcut: `shift+enter` → `submit-action` (from `keyboardShortcuts.json`, global context)

### Prerequisites

- Same as AC1
- Complete AC1-AC4 steps (item fully filled with valid data)

### Data setup

- Same as AC1

### Steps

1. **Action:** With cursor in any input field of the item row, press Shift + Enter
   **Expect:** Form submits, "Supply Delivery Created" toast appears, item disappears from edit form, appears in the deliveries table
   **Record through:** yes

### Success looks like

- Green success toast: "Supply Delivery Created" or similar
- Item row removed from the form
- New supply delivery appears in the "Completed Deliveries" or table view
- Product name (e.g., "Paracetamol") visible in the deliveries table

## AC6 — Save button submits on Enter press

### Research map

- Same as AC1

### Prerequisites

- Same as AC1
- Need a fresh item row with data filled (repeat AC1-AC4 data entry)

### Data setup

- Same as AC1

### Steps

1. **Action:** After filling item fields, Tab or click to focus the "Save" button (button with "Save" text and keyboard shortcut badge)
   **Expect:** Save button is focused (visible focus ring or outline)
   **Record through:** yes

2. **Action:** Press Enter key (without Shift)
   **Expect:** Form submits, "Supply Delivery Created" toast appears, item saved to table
   **Record through:** yes

### Success looks like

- Green success toast: "Supply Delivery Created"
- Item appears in the deliveries table

## AC7 — Save button click submits the form

### Research map

- Same as AC1

### Prerequisites

- Same as AC1
- Need a fresh item row with data filled

### Data setup

- Same as AC1

### Steps

1. **Action:** After filling item fields (Pack Quantity, Unit Price, etc.), click the "Save" button with the mouse
   **Expect:** Form submits, "Supply Delivery Created" toast appears, item saved to table
   **Record through:** yes

### Success looks like

- Green success toast: "Supply Delivery Created"
- Item appears in the deliveries table

## Test plan / notes

- Playwright E2E test coverage should be added for keyboard behavior:
  - Test Enter in Pack Quantity field does not submit
  - Test Enter in Unit Price field does not submit
  - Test Shift+Enter submits the form
  - Test Save button click submits
- CI must pass (lint, build, type-check)
- Manual testing recommended on Chrome, Firefox, Safari to verify keyboard event handling consistency
