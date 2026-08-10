# QA Plan — Infinite scroll pagination for Encounter Medicine Dispense History selector

## Summary

Verify that the Dispense History list in the encounter Medicines tab loads the first page immediately and then loads older rows as the user scrolls on both desktop and mobile.

## 1. First page loads immediately — Desktop

### Research map

- Routes: `src/Routers/routes/EncounterRoutes.tsx` → `/facility/{facilityId}/patient/{patientId}/encounter/{encounterId}`
- Components: `src/components/Medicine/DispenseOrderListSelector.tsx`, `src/components/Medicine/MedicationRequestTable/index.tsx`
- i18n labels: "Medicines", "Dispense History", "Select Dispense Order"
- Auth/role: `tests/.auth/user.json` (admin)
- Permissions: facility-scoped, requires clinical data read access
- Fixtures needed: facility (seeded), patient (seeded), encounter (seeded)

### Prerequisites

- Backend running on port 9000 with fixtures loaded
- Facility, patient, and encounter created by setup

### Data setup

- Prefer fixtures: `load_fixtures` creates facility, patient, and encounter; IDs available via `getFacilityId()`, `getPatientId()`, `getEncounterId()` from `tests/support/`
- Provenance: Dispense order create API from `src/types/emr/dispenseOrder/dispenseOrderApi.ts` (line 14-18)
- If fixtures have fewer than 15 dispense orders, create additional via API:
  - POST `/api/v1/facility/{facilityId}/order/dispense/`
  - Auth: `getApiUrl()` + `getApiHeaders()` from `tests/helper/utils.ts` + `tests/.auth/user.json`
  - Body: `{"patient": "{patientId}", "location": "{locationId}", "status": "completed"}`
    (per `src/types/emr/dispenseOrder/dispenseOrder.ts:50-53` — `DispenseOrderCreate` requires only `patient`, `location`, `status`)
  - Repeat 20+ times to ensure multiple pages (page size = 14 per `src/common/constants.tsx:1`)
- After seed: navigate to encounter and confirm Medicines tab → Dispense History shows the list

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/patient/{patientId}/encounter/{encounterId}`, click the "Medicines" tab, then click the "Dispense History" tab.
   **Expect:** The left-side dispense history list immediately shows the latest ~14 dispense orders; the detail pane on the right shows dispense entries for the selected (first) order.
   **Record through:** yes

## 2. Scroll loads additional older dispense orders — Desktop

### Research map

- Same as criterion 1
- Scroll detection: `src/components/Medicine/DispenseOrderListSelector.tsx:66-70` uses `useOnInView` from `react-intersection-observer`
- Page fetch: `useInfiniteQuery` with `fetchNextPage` (line 40)

### Prerequisites

- Same as criterion 1
- Encounter has 20+ dispense orders (from Data setup)

### Data setup

- Same as criterion 1

### Steps

1. **Action:** In the Dispense History tab, scroll to the bottom of the left-side dispense order list.
   **Expect:** The list appends the next page of older dispense orders below the existing items; a loading skeleton appears briefly at the bottom while fetching.
   **Record through:** yes

2. **Action:** Continue scrolling until the end of the available history.
   **Expect:** No more pages are requested once the list reaches the end; the loading indicator stops appearing.
   **Record through:** yes

## 3. Select older row after loading — Desktop

### Research map

- Same as criterion 1
- Selection handler: `src/components/Medicine/DispenseOrderListSelector.tsx:72-78`

### Prerequisites

- Same as criterion 1
- User has scrolled to load at least one additional page

### Data setup

- Same as criterion 1

### Steps

1. **Action:** Scroll until a row that was not initially visible appears (from page 2+), then click it.
   **Expect:** The selected row is highlighted with a blue border and blue indicator; the detail pane on the right updates to show dispense entries for the selected order.
   **Record through:** yes

## 4. Short list does not trigger fetch loop — Desktop

### Research map

- Same as criterion 1

### Prerequisites

- Backend running on port 9000 with fixtures loaded
- Encounter with fewer than 14 dispense orders

### Data setup

- Prefer fixtures: Use `getEncounterId()` to get an encounter; if it has 14+ orders, create a new encounter via UI or API
- UI recipe (if needed):
  1. Go to `/facility/{facilityId}/encounters/patients/all?status=in_progress`
  2. Create a new patient or open an existing patient
  3. Create a new encounter (if not present)
  4. Do not create dispense orders (or create only 5-10)
- Verify: navigate to encounter Medicines → Dispense History; list should have fewer than 14 items

### Steps

1. **Action:** Open the encounter Medicines tab, then Dispense History tab, and observe the list and network tab.
   **Expect:** The available dispense orders appear immediately; no repeated fetch requests appear in the network tab; no loading indicator loops at the bottom.
   **Record through:** yes

## 5. First page loads immediately — Mobile

### Research map

- Same as criterion 1
- Mobile UI: `src/components/Medicine/DispenseOrderListSelector.tsx:118-165` uses Drawer component

### Prerequisites

- Same as criterion 1
- Mobile viewport (e.g., iPhone 12 Pro, 390x844)

### Data setup

- Same as criterion 1

### Steps

1. **Action:** Switch to mobile viewport, navigate to `/facility/{facilityId}/patient/{patientId}/encounter/{encounterId}`, click "Medicines" tab, then "Dispense History" tab.
   **Expect:** The "Select Dispense Order" button appears (or the first selected order name); tapping it opens a drawer with the dispense order list showing the latest ~14 items.
   **Record through:** yes

## 6. Scroll loads additional older dispense orders — Mobile

### Research map

- Same as criterion 5

### Prerequisites

- Same as criterion 1
- Mobile viewport
- Encounter has 20+ dispense orders

### Data setup

- Same as criterion 1

### Steps

1. **Action:** In the mobile drawer, scroll to the bottom of the dispense order list.
   **Expect:** The list appends the next page of older dispense orders below the existing items; a loading skeleton appears briefly at the bottom while fetching.
   **Record through:** yes

2. **Action:** Continue scrolling until the end of the available history.
   **Expect:** No more pages are requested once the list reaches the end; the loading indicator stops appearing.
   **Record through:** yes

## 7. Select older row after loading — Mobile

### Research map

- Same as criterion 5

### Prerequisites

- Same as criterion 1
- Mobile viewport
- User has scrolled to load at least one additional page in the mobile drawer

### Data setup

- Same as criterion 1

### Steps

1. **Action:** In the mobile drawer, scroll until a row that was not initially visible appears (from page 2+), then tap it.
   **Expect:** The drawer closes; the selected order name appears on the button; the detail pane on the page updates to show dispense entries for the selected order.
   **Record through:** yes

## Test plan / notes

- Playwright E2E test coverage should verify infinite scroll behavior:
  - Test that scrolling triggers `fetchNextPage` when the sentinel element enters viewport
  - Test that `hasNextPage` prevents fetching when all pages are loaded
  - Test that selecting an item from page 2+ updates the detail pane correctly
- CI must pass linting and build checks
- Use `tests/.auth/user.json` (admin) for all test scenarios
- Confirm that `RESULTS_PER_PAGE_LIMIT` (14 items per page) is consistent with the API response
- If creating dispense orders via API, ensure `locationId` is obtained from a valid facility location (e.g., from `load_fixtures` or UI-created location)

## Success looks like

- The first page of dispense history loads immediately without delay
- Scrolling to the bottom loads the next page of older dispense orders without resetting scroll position or selection
- Older rows can be selected successfully after they are loaded, and the detail pane updates correctly
- The list stops requesting more pages at the end of the available history; no infinite fetch loop
- The experience works consistently on both desktop and mobile (drawer) views
- Short-history cases (< 14 items) do not trigger repeated fetch loops
