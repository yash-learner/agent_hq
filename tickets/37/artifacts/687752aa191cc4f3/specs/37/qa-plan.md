# QA Plan: Infinite Scroll Pagination for Encounter Medicine Dispense History

## 1. First page loads — Open Dispense History; latest dispenses appear in the left selector

### Research map

- Routes: Encounter Medicine tab → `/facility/{facilityId}/patient/{patientId}/encounter/{encounterId}` → Medicines tab → Dispense History tab
- Components: `src/components/Medicine/DispenseOrderListSelector.tsx`, `src/components/Medicine/MedicationRequestTable/index.tsx`
- i18n labels: "Medicines" (tab), "Dispense History" (tab), "Dispense Orders" (selector)
- Auth/role: `tests/.auth/user.json` (admin access)
- Permissions: Requires read access to patient encounter clinical data
- Fixtures: Patient with encounter and multiple dispense orders (15+ needed to test pagination)

### Prerequisites

- Backend running on port 9000 (`DJANGO_SETTINGS_MODULE=config.settings.local DJANGO_READ_DOT_ENV_FILE=true .venv/bin/python manage.py runserver 0.0.0.0:9000`)
- Frontend production build completed (`npm run build`)
- Database with fixtures loaded (`npm run playwright:db-restore` or `npm run playwright:db-reset`)
- Authenticated as admin user (`tests/.auth/user.json`)

### Data setup

- **Prefer fixtures**: Load-fixtures provides facility, patient, and encounter via `getFacilityId()`, `getPatientId()`, `getEncounterId()` from `tests/support/`
- **Provenance**: Dispense orders created via API using `DispenseOrderCreate` type from `src/types/emr/dispenseOrder/dispenseOrder.ts:50-53` and route from `src/types/emr/dispenseOrder/dispenseOrderApi.ts:14-18`
- **API seed** (required to ensure 15+ dispense orders for pagination testing):
  - Path: `POST /api/v1/facility/{facilityId}/order/dispense/` (from `dispenseOrderApi.create`)
  - Auth: `getApiUrl()` + `getApiHeaders()` from `tests/helper/utils.ts` with `tests/.auth/user.json`
  - Body (repeat 15+ times with variations):
    ```typescript
    {
      patient: patientId,  // string - from getPatientId()
      location: locationId,  // string - from facility locations list
      status: "completed",  // DispenseOrderStatus enum from dispenseOrder.ts:20-26 (valid: "draft" | "in_progress" | "completed" | "abandoned" | "entered_in_error")
      name: "QA Test Dispense Order",  // optional string
      note: "Created for QA pagination testing"  // optional string
    }
    ```
  - Type definition: `DispenseOrderCreate` extends `Omit<DispenseOrderBase, "id">` with `patient: string` and `location: string` (required fields); `name` and `note` are optional from `DispenseOrderBase` (lines 28-33)
  - Complete body per type: All required fields (`patient`, `location`, `status`) provided; optional fields (`name`, `note`) included for test clarity
  - Note: If load-fixtures already provides 15+ dispense orders for the test patient/encounter, skip API seeding
  - Verification approach: Query `GET /api/v1/facility/{facilityId}/order/dispense/?patient={patientId}` to check count before testing

- **UI verification**: Navigate to the encounter's Medicine → Dispense History tab; confirm the left selector shows dispense orders before scoring

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/encounters/patients/all` and open an encounter with the test patient
   **Expect:** Encounter page loads successfully
   **Record through:** yes

2. **Action:** Click the "Medicines" tab
   **Expect:** Medicine management interface appears with tabs for Prescriptions, Medication Statements, Medicine Administration, and Dispense History
   **Record through:** yes

3. **Action:** Click the "Dispense History" tab
   **Expect:** Dispense History view loads with left selector showing list of dispense orders and right panel showing details
   **Record through:** yes

4. **Action:** Observe the left selector list
   **Expect:** The first page of dispense orders (14 items) appears immediately in the left selector, ordered newest first
   **Record through:** yes

### Success looks like

- Left selector displays the latest 14 dispense orders
- Orders are sorted newest first (most recent at top)
- First order is automatically selected
- Right panel shows the medication dispense details for the selected order
- No loading spinner visible after initial load completes

## 2. Scroll loads more — Scroll to bottom; older rows append; loading indicator appears then settles

### Prerequisites

- Continue from criterion 1 with Dispense History tab open
- Left selector showing first 14 dispense orders
- 15+ total dispense orders exist in the database for pagination

### Steps

1. **Action:** Scroll the left selector list downward until reaching near the bottom (within the last 2-3 visible items)
   **Expect:** Loading indicator (skeleton cards) appears at the bottom of the list
   **Record through:** yes

2. **Action:** Wait for loading to complete (approximately 1-2 seconds)
   **Expect:** Additional older dispense orders (next page) appear below the existing items
   **Record through:** yes

3. **Action:** Verify the total count increased
   **Expect:** More than 14 dispense orders are now visible in the left selector (should show ~28 if 15+ total exist)
   **Record through:** yes

4. **Action:** Observe the scroll position
   **Expect:** Scroll position is maintained (not jumped back to top); newly loaded items are appended at bottom
   **Record through:** yes

### Success looks like

- Loading skeleton cards briefly visible during fetch
- New dispense orders append to existing list (no re-render of earlier items)
- Scroll position preserved
- Older orders appear chronologically after newer ones (consistent ordering)
- Selection state maintained (if an order was selected, it stays selected)

## 3. Select older row — Click a row that only appeared after scroll; detail matches that dispense

### Prerequisites

- Continue from criterion 2 with multiple pages of dispense orders loaded
- At least one dispense order visible that was loaded via infinite scroll (page 2+)

### Steps

1. **Action:** Identify a dispense order card that appeared after scrolling (in the second page batch)
   **Expect:** Visual confirmation that this order was not in the initial 14 items
   **Record through:** yes

2. **Action:** Click on the identified dispense order card
   **Expect:** The card highlights with primary border and indicator; right panel updates to show this order's details
   **Record through:** yes

3. **Action:** Verify the details match the selected order
   **Expect:** Right panel displays medication dispense entries for the selected dispense order (matching location, created date shown on card)
   **Record through:** yes

### Success looks like

- Selected older dispense order highlights correctly
- Right panel shows accurate dispense history for that order
- Details include medications, dosages, quantities, status, and timestamps
- No error or empty state in right panel

## 4. End of list — Scroll until no more pages; further scrolling does not spam requests

### Prerequisites

- Continue from criterion 3 with Dispense History tab open
- Multiple pages already loaded

### Steps

1. **Action:** Continue scrolling down through the left selector list until all dispense orders are loaded
   **Expect:** Loading indicator appears for each subsequent page, then disappears when data loads
   **Record through:** yes

2. **Action:** Observe when the end is reached
   **Expect:** A subtle horizontal line or visual separator appears at the bottom of the list (indicating end)
   **Record through:** yes

3. **Action:** Scroll to the absolute bottom and pause for 3 seconds
   **Expect:** No additional loading indicators appear; no network requests triggered (verify in browser DevTools Network tab if available)
   **Record through:** yes

4. **Action:** Scroll up and down again near the bottom
   **Expect:** End-of-list indicator remains; no repeated fetch attempts
   **Record through:** yes

### Success looks like

- Clear visual indication that all dispense orders have loaded
- Network tab shows no repeated requests to the dispense order list endpoint after reaching the end
- Smooth scrolling without loading spinner loops

## 5. Short list — Encounter with few dispenses: no extra page fetches in a loop

### Prerequisites

- Backend running on port 9000
- Frontend production build completed
- Patient/encounter with fewer than 14 dispense orders (single page of data)

### Data setup

- **Prefer fixtures** if load-fixtures provides a patient with < 14 dispense orders
- **Alternative**: Use the existing test patient but temporarily filter or identify an encounter with minimal dispense history
- **Verification**: Check `GET /api/v1/facility/{facilityId}/order/dispense/?patient={patientId}` returns `count < 14`

### Steps

1. **Action:** Navigate to an encounter with fewer than 14 dispense orders
   **Expect:** Encounter page loads successfully
   **Record through:** yes

2. **Action:** Click "Medicines" tab → "Dispense History" tab
   **Expect:** Dispense History view loads with short list visible in left selector
   **Record through:** yes

3. **Action:** Observe browser DevTools Network tab (open during this step)
   **Expect:** Initial API request to fetch dispense orders completes; only one request made
   **Record through:** yes

4. **Action:** Scroll down to the bottom of the short list and pause for 5 seconds
   **Expect:** No additional network requests to the dispense order endpoint; no loading spinner appears
   **Record through:** yes

5. **Action:** Scroll up and down within the short list
   **Expect:** Still no additional fetch requests triggered
   **Record through:** yes

### Success looks like

- Single page of data displayed correctly
- No infinite loading loop
- Network tab shows only one request (initial fetch) with no repeated calls
- End-of-list indicator may or may not appear (acceptable either way for single-page lists)

## 6. Error resilience — Failed next-page fetch does not clear already loaded items

### Prerequisites

- Continue from any previous criterion with Dispense History tab open and first page loaded
- Ability to simulate network failure (browser DevTools throttling or backend interruption)

### Data setup

- No additional setup required
- Test uses existing dispense orders from previous criteria

### Steps

1. **Action:** Open browser DevTools → Network tab → Enable "Offline" mode (or set throttling to simulate failure)
   **Expect:** Network connectivity disabled
   **Record through:** yes

2. **Action:** With Dispense History tab open and first page loaded, scroll down to trigger the next page fetch
   **Expect:** Loading indicator appears briefly, then an error state or toast notification may appear (depending on implementation)
   **Record through:** yes

3. **Action:** Verify the first page of dispense orders remains visible
   **Expect:** Previously loaded dispense orders (page 1) are still displayed; they were not cleared
   **Record through:** yes

4. **Action:** Re-enable network connectivity (disable "Offline" mode)
   **Expect:** Network restored
   **Record through:** yes

5. **Action:** Scroll down again to retry fetching the next page
   **Expect:** Loading indicator appears; next page successfully loads and appends to the list
   **Record through:** yes

### Success looks like

- First page data persists despite failed subsequent fetch
- User can retry by scrolling again after network restoration
- No blank screen or complete list reset on error
- Graceful error handling (toast notification acceptable, but page 1 data visible)

## 7. No regression — Opening Dispense History or selecting items from the first page still works as before

### Prerequisites

- Backend running on port 9000
- Frontend production build completed
- Patient/encounter with dispense orders available

### Steps

1. **Action:** Navigate to an encounter and open the Dispense History tab
   **Expect:** Dispense History loads successfully as in previous CARE releases
   **Record through:** yes

2. **Action:** Verify the first dispense order in the left selector is automatically selected
   **Expect:** First order highlighted; right panel shows its dispense details
   **Record through:** yes

3. **Action:** Click on a different dispense order from the first page (within the initial 14 items)
   **Expect:** Selected order highlights; right panel updates with correct dispense details
   **Record through:** yes

4. **Action:** Verify the "Dispense" button (if applicable) and other controls work as expected
   **Expect:** All existing functionality (view, dispense actions) remains operational
   **Record through:** yes

### Success looks like

- Dispense History tab opens without errors
- Auto-selection of first order functions correctly
- Manual selection within first page works as before
- Right panel displays accurate dispense details
- No UI glitches or console errors
- Existing workflows (dispense, review) unaffected

## Test plan / notes

### Playwright E2E Coverage

- Add test file: `tests/facility/patient/encounter/medicine/dispenseHistoryInfiniteScroll.spec.ts`
- Test scenarios:
  - Initial page load shows 14 dispense orders
  - Scrolling triggers page 2 fetch and appends results
  - End-of-list stops fetching after all pages loaded
  - Short list (< 14 items) does not trigger extra fetches
  - Selection of older rows (page 2+) works correctly
- Use `getEncounterId()`, `getPatientId()`, `getFacilityId()` for fixture IDs
- Seed 20+ dispense orders via API in `beforeAll` setup to guarantee pagination behavior
- Verify network request count via Playwright's `page.on('request')` listener

### CI Expectations

- All linters and type checks pass (`npm run lint`, `npm run format`)
- Production build succeeds (`npm run build`)
- Playwright tests pass in CI environment with backend fixture data
- No console errors or warnings related to infinite scroll implementation

### Manual Testing Notes

- Test on both desktop (left sidebar) and mobile (drawer) layouts
- Verify scrolling performance with 50+ dispense orders (no lag or jank)
- Check DevTools Network tab for efficient request batching (14 items per page)
- Confirm query keys properly scoped to prevent cross-patient data leaks
