# QA plan — Infinite pagination for Dispense History

## Summary

Verify that the Dispense History list in the encounter Medicines tab loads the first page immediately and then loads older rows as the user scrolls on both desktop and mobile.

## Research map

- **Routes**: `src/Routers/routes/` → `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}?tab=medicines`
- **Components**:
  - `src/components/Medicine/DispenseOrderListSelector.tsx` (left-side selector with infinite scroll)
  - `src/pages/Encounters/tabs/medicines.tsx` (Medicines tab container)
  - `src/components/Medicine/MedicationRequestTable/index.tsx` (tab switcher)
- **i18n labels**: "Medicines", "Dispense History", "dispense_orders", "select_dispense_order"
- **Auth/role**: `tests/.auth/user.json` (admin with full access)
- **Permissions**: Requires `canReadClinicalData` for the encounter
- **Fixtures needed**:
  - Seeded facility (from `load_fixtures` / `getFacilityId()`)
  - Patient with encounter (from `getPatientId()` / `getEncounterId()`)
  - Multiple dispense orders (>14) for infinite scroll testing

## Prerequisites

- Backend must be running on port 9000 with fixtures loaded
- Frontend built (`npm run build`) and preview server or dev server running
- Test user authenticated with admin role (`tests/.auth/user.json`)
- Facility, patient, and encounter IDs available from fixtures

## Data setup

### Prefer fixtures

The `load_fixtures` command provides:

- Facility: Use `getFacilityId()` from `tests/support/facilityId.ts`
- Patient: Use `getPatientId()` from `tests/support/patientId.ts`
- Encounter: Use `getEncounterId()` from `tests/support/encounterId.ts`

### If dispense orders are insufficient (need 20+ for thorough testing)

**API seed required** (deep graph — dispense orders depend on facility, location, patient, encounter, and medication items):

1. **POST** `/api/v1/facility/{facilityId}/order/dispense/`
   - **Auth**: Use `getApiUrl()` + `getApiHeaders()` from `tests/helper/utils.ts` with `tests/.auth/user.json`
   - **Body template** (create 20+ dispense orders with varying timestamps):

   ```json
   {
     "patient": "{patientId}",
     "encounter": "{encounterId}",
     "location": "{locationId}",
     "status": "completed",
     "created_date": "2024-01-{day}T10:00:00Z"
   }
   ```
   - **Provenance**: Route path from `src/types/emr/dispenseOrder/dispenseOrderApi.ts` (line 10)
   - **Location ID**: Query `/api/v1/facility/{facilityId}/location/` to get a valid location ID, or use the location from the encounter

2. **Verify**: Before running the criterion steps, navigate to:
   - Desktop: `/facility/{facilityId}/patient/{patientId}/encounter/{encounterId}?tab=medicines`
   - Click "Dispense History" tab
   - Confirm the left sidebar shows at least 14+ dispense order cards before proceeding

**Alternative UI seed** (if API seed is blocked):

1. Navigate to `/facility/{facilityId}/locations/{locationId}/medication_dispense/`
2. Use the "Create Dispense Order" flow repeatedly (20+ times) to create enough records
3. Select the test patient and encounter in each creation
4. Verify the dispense orders appear in the Encounter → Medicines → Dispense History list

## 1. First page loads — Desktop

### Research map

- Component: `DispenseOrderListSelector` with `useInfiniteQuery` (lines 40-66)
- Initial load: First 14 items from `RESULTS_PER_PAGE_LIMIT`

### Steps

1. **Action:** Open browser at `/facility/{facilityId}/patient/{patientId}/encounter/{encounterId}?tab=medicines`
   **Expect:** The page loads showing the Medicines tab with four sub-tabs: Prescriptions, Medication Statements, Medicine Administration, Dispense History
   **Record through:** yes

2. **Action:** Click the "Dispense History" tab
   **Expect:**
   - The left sidebar displays a scrollable list of dispense order cards (up to 14 initially visible)
   - Each card shows: dispense order name/timestamp, location name
   - The first dispense order is automatically selected (highlighted with blue border and vertical accent)
   - The right panel shows the dispense history details for the selected order
     **Record through:** yes
     **Still after:** Capture the initial list showing ~14 items

## 2. Scroll loads more — Desktop

### Research map

- Hook: `useOnInView` from `react-intersection-observer` (line 70-74)
- Ref attached to last card in list (line 202)
- Skeleton loader shown while fetching (line 232)

### Steps

1. **Action:** In the left sidebar, scroll down to the bottom of the dispense order list
   **Expect:**
   - As the last visible card approaches the bottom of the viewport, a skeleton loader appears below the list
   - The next page of dispense orders (up to 14 more items) loads and appends to the existing list
   - The scroll position remains stable (no jump back to top)
   - The skeleton loader disappears once the new items are loaded
     **Record through:** yes

2. **Action:** Continue scrolling down through the newly loaded items
   **Expect:**
   - Additional pages load as you reach the bottom of each page
   - The list continues to grow without full-page reload or flickering
     **Record through:** yes

## 3. Select older row — Desktop

### Research map

- Click handler: `onSelectDispenseOrder` callback (lines 201, 113-120)
- Selected state: Card gets `bg-white border-primary-600 shadow-md` styling (lines 162-164)

### Steps

1. **Action:** Scroll until at least 20+ dispense orders are visible in the list, then click a dispense order card that was loaded after the initial page (e.g., the 18th item)
   **Expect:**
   - The clicked card becomes highlighted (white background, blue border, vertical blue accent on right)
   - The previously selected card returns to gray background
   - The right panel updates to show the dispense history details for the newly selected order
   - The card remains selected and visible in the list
     **Record through:** yes

## 4. End of list — Desktop

### Research map

- Pagination logic: `getNextPageParam` returns `null` when `currentOffset >= lastPage.count` (lines 61-64)
- Hook: `hasNextPage` becomes `false`, preventing further fetches (line 71)

### Steps

1. **Action:** Continue scrolling through the entire dispense order list until no more items load
   **Expect:**
   - The skeleton loader stops appearing once all dispense orders have been fetched
   - No repeated network requests occur (check browser Network tab: no duplicate `/api/v1/facility/.../order/dispense/` requests with identical offsets)
   - The list stops at the last available dispense order
     **Record through:** yes

2. **Action:** Scroll up and down through the complete list
   **Expect:**
   - The full list remains stable and scrollable
   - No additional loading or requests occur
     **Record through:** yes

## 5. Short list — Desktop

### Research map

- Empty check: Component returns `null` if no dispense orders (line 103-105)
- Single page: If `count <= 14`, `hasNextPage` is `false` from first load

### Steps

1. **Action:** Open an encounter with fewer than 14 dispense orders (or create a new test patient/encounter with only 5 dispense orders)
   **Expect:**
   - The dispense order list shows all available items immediately
   - No skeleton loader appears at the bottom
   - No repeated fetch requests in Network tab
     **Record through:** yes

2. **Action:** Scroll to the bottom of the short list
   **Expect:**
   - The list ends naturally with no loading indicator
   - No infinite request loop or skeleton flashing
     **Record through:** yes

## Mobile checks

### Research map

- Mobile component: `Drawer` with `DrawerContent` (lines 122-169)
- Same `DispenseOrderList` component used in drawer (lines 159-166)

## 6. First page loads — Mobile

### Steps

1. **Action:** Resize browser to mobile viewport (e.g., 375x667) or use mobile device emulator, then navigate to `/facility/{facilityId}/patient/{patientId}/encounter/{encounterId}?tab=medicines`
   **Expect:** The Medicines tab loads with responsive layout
   **Record through:** yes

2. **Action:** Tap the "Dispense History" tab
   **Expect:**
   - Instead of a sidebar, a button appears showing the currently selected dispense order (or "Select Dispense Order" if none selected)
   - Tapping the button opens a drawer from the bottom showing the full list of dispense orders
   - The first dispense order is auto-selected and highlighted
     **Record through:** yes

## 7. Scroll loads more — Mobile

### Steps

1. **Action:** In the mobile drawer, scroll down to the bottom of the dispense order list
   **Expect:**
   - The skeleton loader appears at the bottom
   - Additional dispense orders load and append to the list
   - The drawer remains open and scrollable
     **Record through:** yes

2. **Action:** Continue scrolling to load more pages
   **Expect:**
   - Pages load incrementally as you reach the bottom
   - No drawer close or full reload
     **Record through:** yes

## 8. Select older row — Mobile

### Steps

1. **Action:** Scroll until 20+ dispense orders are visible in the drawer, then tap a dispense order card from the second or third page
   **Expect:**
   - The card becomes highlighted
   - The drawer closes automatically (line 79)
   - The button now displays the selected dispense order's details
   - Tapping the button again reopens the drawer with the same item still selected
   - The right panel (or mobile detail view) shows the correct dispense history for the selected order
     **Record through:** yes

## 9. End of list — Mobile

### Steps

1. **Action:** In the mobile drawer, scroll to the end of all available dispense orders
   **Expect:**
   - The skeleton loader stops appearing
   - No repeated network requests
   - The drawer remains stable at the end of the list
     **Record through:** yes

## 10. Short list — Mobile

### Steps

1. **Action:** Open the Dispense History drawer on mobile for an encounter with fewer than 14 dispense orders
   **Expect:**
   - All dispense orders appear immediately
   - No loading loop or repeated requests
     **Record through:** yes

## Error resilience check

### Steps

1. **Action:** (Optional/Best-effort) If a test environment allows, simulate a network error on the second page fetch (e.g., via browser DevTools Network throttling or proxy)
   **Expect:**
   - The first page of dispense orders remains visible
   - An error message or toast appears indicating the fetch failed
   - The user can retry (e.g., by scrolling again or refreshing)
   - The already loaded items are not cleared from the list
     **Record through:** yes / not exercised

## Success looks like

- The first page of dispense history (up to 14 items) loads immediately on opening the Dispense History tab
- Scrolling the left sidebar/drawer loads older records incrementally without full-page reload
- Older rows can be selected successfully after they are loaded, and the detail panel updates correctly
- The list stops requesting more pages when all dispense orders have been loaded
- Short lists (< 14 items) do not trigger repeated fetch loops
- The experience works consistently on both desktop (sidebar) and mobile (drawer) layouts

## Test plan / notes

- **Playwright E2E**: Consider adding a test spec in `tests/facility/patient/encounter/medicine/` to verify:
  - Initial load shows up to 14 dispense orders
  - Scrolling loads additional pages
  - Selection of items from page 2+ works correctly
  - Short lists do not trigger infinite loops
- **CI expectations**: CI should pass with no new linting, type errors, or build failures
- **Network tab verification**: During QA, keep the browser Network tab open to confirm:
  - First request: `limit=14&offset=0`
  - Second request (on scroll): `limit=14&offset=14`
  - Subsequent requests increment offset by 14
  - No duplicate identical requests indicating a loop
- **Data preparation**: If the test environment lacks sufficient dispense orders, use the API seed recipe above to create 20+ orders before running the live checks
