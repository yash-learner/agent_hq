# QA Plan: Infinite scroll pagination for Encounter Medicine Dispense History selector

## AC1 — First page loads on tab open

### Research map

- routes: `src/Routers/routes/EncounterRoutes.tsx` → `/facility/:facilityId/patient/:patientId/encounter/:encounterId`
- components: `src/components/Medicine/MedicationRequestTable/index.tsx` → `DispenseOrderListSelector.tsx`
- i18n labels: "Medicines", "Dispense History"
- auth/role: tests/.auth/user.json (admin)
- permissions / facility-scoped: yes
- fixtures needed: seeded facility, patient, encounter with 15+ dispense orders

### Prerequisites

- Backend running on port 9000
- Production build exists (`npm run build`)
- Database snapshot restored with fixtures

### Data setup

- Prefer fixtures: load-fixtures provides a facility, patient, and encounter via `getFacilityId()`, `getPatientId()`, `getEncounterId()` from `tests/support/`
- Provenance: Dispense orders are created via the UI "Dispense" button in Encounter → Medicines → Dispense History tab. The API route is POST `/api/v1/facility/{facilityId}/order/dispense/` from `src/types/emr/dispenseOrder/dispenseOrderApi.ts`
- UI recipe:
  1. Go to `/facility/{facilityId}/patient/{patientId}/encounter/{encounterId}`
  2. Click the "Medicines" tab
  3. Click the "Dispense History" tab
  4. Click the "+ Dispense" button (if visible and canWrite)
  5. Fill the dispense order form with:
     - Patient: auto-selected from encounter context
     - Location: select a location from the dropdown (fixture locations available)
     - Status: "draft" or "in_progress"
     - Optional: Name, Note
  6. Save the dispense order
  7. Repeat steps 4-6 at least 15 times to create enough orders to exceed one page (RESULTS_PER_PAGE_LIMIT = 14)
- Entity chain: Dispense orders are standalone entities linked to patient and location
- API seed (if UI creation is too slow):
  - POST `/api/v1/facility/{facilityId}/order/dispense/`
  - Auth: `getApiUrl()` + `getApiHeaders()` from `tests/helper/utils.ts` + `tests/.auth/user.json`
  - Body (from `src/types/emr/dispenseOrder/dispenseOrder.ts`):
    ```json
    {
      "patient": "{patientId}",
      "location": "{locationId}",
      "status": "draft",
      "name": "Test Dispense {timestamp}",
      "note": "QA test dispense order"
    }
    ```
  - Location ID: obtain from GET `/api/v1/facility/{facilityId}/location/` (first result from fixture)
  - Repeat 15+ times with unique names (e.g., `Test Dispense ${Date.now()}-${i}`)
- After seed: open `/facility/{facilityId}/patient/{patientId}/encounter/{encounterId}` → Medicines → Dispense History; confirm the selector shows entries

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/patient/{patientId}/encounter/{encounterId}`, click "Medicines" tab, then "Dispense History" tab
   **Expect:** The left sidebar (desktop) or drawer button (mobile) displays the first 14 dispense orders, sorted by latest first. The most recent dispense order is auto-selected and its detail view shows in the right panel.
   **Record through:** yes

2. **Action:** Count the visible dispense order entries in the left selector
   **Expect:** Exactly 14 entries are visible (RESULTS_PER_PAGE_LIMIT = 14)
   **Record through:** yes

### Success looks like

- Dispense History tab loads successfully with first page of 14 dispense orders visible
- Most recent order is auto-selected
- No console errors

---

## AC2 — Scroll to bottom loads next page

### Research map

- Same as AC1
- Intersection observer triggers at last item in list
- Loading indicator appears during fetch

### Prerequisites

- Same as AC1
- At least 15 dispense orders exist (to have a second page)

### Data setup

- Same as AC1 (15+ dispense orders created)

### Steps

1. **Action:** On desktop, scroll the left sidebar dispense order list to the bottom until the last (14th) entry is visible and near the top of the viewport
   **Expect:** A loading skeleton with 5 placeholder cards appears at the bottom of the list. After ~1-2 seconds, the next page of dispense orders (entries 15+) appends below the existing 14 entries. No duplicate entries appear.
   **Record through:** yes

2. **Action:** Click on one of the newly loaded dispense orders (entry 15 or later)
   **Expect:** The clicked dispense order is selected (highlighted with blue border and indicator), and its detail view loads in the right panel
   **Record through:** yes

3. **Action:** On mobile, open the drawer button, scroll the drawer content to the bottom
   **Expect:** Same behavior as desktop — loading skeleton appears, next page loads and appends
   **Record through:** yes

### Success looks like

- Scrolling to bottom triggers next page fetch
- Loading skeleton displays during fetch
- New entries append without duplicates
- Selection and detail view work for paginated entries
- Works on both desktop and mobile

---

## AC3 — End of list stops fetching

### Research map

- Same as AC1
- `getNextPageParam` returns `null` when `currentOffset >= lastPage.count`
- No additional requests after all pages loaded

### Prerequisites

- Same as AC1
- Exactly 20 dispense orders exist (to have 2 pages: 14 + 6)

### Data setup

- Prefer fixtures: Use API seed to create exactly 20 dispense orders
- Provenance: Same as AC1 (use API POST to create controlled count)
- API seed: Create exactly 20 dispense orders via POST `/api/v1/facility/{facilityId}/order/dispense/` (repeat 20 times)

### Steps

1. **Action:** Navigate to Dispense History tab, scroll to load the second page (entries 15-20)
   **Expect:** Second page loads with 6 entries (total now 20 visible)
   **Record through:** yes

2. **Action:** Scroll to the very bottom of the list and wait 5 seconds
   **Expect:** No loading skeleton appears. No additional fetch requests are made (check Network tab for no new requests to `/api/v1/facility/.../order/dispense/`). The list remains at 20 entries.
   **Record through:** yes

### Success looks like

- After all pages loaded, scrolling to bottom does not trigger further requests
- No loading skeleton appears at end of list
- Network tab shows no repeated requests

---

## AC4 — Selection works for paginated rows

### Research map

- Same as AC1
- Selection state persists across pagination

### Prerequisites

- Same as AC1
- At least 15 dispense orders exist

### Data setup

- Same as AC1 (15+ dispense orders)

### Steps

1. **Action:** Load Dispense History tab, scroll to load second page, click on entry #15 (first entry on page 2)
   **Expect:** Entry #15 is highlighted with blue border and indicator. The right panel shows the dispense history detail for entry #15 (medication dispenses for that order).
   **Record through:** yes

2. **Action:** Click on entry #1 (first entry on page 1), then scroll back down and click entry #18
   **Expect:** Each click updates the selection highlight and right panel detail to the clicked entry. Selection state is correct for entries on any page.
   **Record through:** yes

### Success looks like

- Clicking any dispense order (page 1 or page 2+) correctly updates selection and detail view
- Selection highlight moves to the clicked entry

---

## AC5 — Short lists do not trigger repeated fetches

### Research map

- Same as AC1
- `getNextPageParam` returns `null` when `currentOffset >= lastPage.count`

### Prerequisites

- Same as AC1
- Exactly 10 dispense orders exist (less than one page)

### Data setup

- Prefer fixtures: Use API seed to create exactly 10 dispense orders
- Provenance: Same as AC1 (use API POST to create controlled count)
- API seed: Create exactly 10 dispense orders via POST `/api/v1/facility/{facilityId}/order/dispense/` (repeat 10 times)

### Steps

1. **Action:** Navigate to Dispense History tab and observe the selector
   **Expect:** Exactly 10 entries are visible. No loading skeleton appears at the bottom. No pagination requests are triggered (check Network tab — only one request to `/api/v1/facility/.../order/dispense/` with offset=0).
   **Record through:** yes

2. **Action:** Scroll to the bottom of the 10-entry list and wait 5 seconds
   **Expect:** No loading skeleton appears. No additional fetch requests are made. The list remains at 10 entries.
   **Record through:** yes

### Success looks like

- Short lists (< RESULTS_PER_PAGE_LIMIT) load once and do not trigger pagination
- No unnecessary fetch requests
- No loading skeleton appears

---

## AC6 — Pagination works on desktop and mobile

### Research map

- Same as AC1
- Desktop: `.hidden.lg:block` sidebar with `overflow-y-auto`
- Mobile: `.lg:hidden` Drawer with `overflow-y-auto` content

### Prerequisites

- Same as AC1
- At least 15 dispense orders exist

### Data setup

- Same as AC1 (15+ dispense orders)

### Steps

1. **Action:** On desktop viewport (1280x720), navigate to Dispense History tab and scroll the left sidebar to the bottom
   **Expect:** Next page loads and appends. Scrolling and pagination work correctly.
   **Record through:** yes

2. **Action:** Resize viewport to mobile (375x667), click the drawer button to open the dispense order list, scroll to the bottom
   **Expect:** Next page loads and appends in the drawer. Scrolling and pagination work correctly in mobile drawer.
   **Record through:** yes

3. **Action:** On mobile, select a dispense order from page 2, close the drawer
   **Expect:** Drawer button shows the selected dispense order. Right panel shows the detail view.
   **Record through:** yes

### Success looks like

- Desktop sidebar infinite scroll works correctly
- Mobile drawer infinite scroll works correctly
- Selection and detail view work on both layouts

---

## AC7 — Loading indicator appears during pagination

### Research map

- Same as AC1
- `isFetchingNextPage` flag controls loading skeleton display
- `<CardListSkeleton count={5} />` renders at bottom of list

### Prerequisites

- Same as AC1
- At least 15 dispense orders exist

### Data setup

- Same as AC1 (15+ dispense orders)

### Steps

1. **Action:** Navigate to Dispense History tab, scroll to the bottom to trigger next page load
   **Expect:** A loading skeleton with 5 gray placeholder cards appears at the bottom of the list immediately after scrolling to the last entry. The skeleton is visible for ~1-2 seconds while the next page loads.
   **Record through:** yes

2. **Action:** Wait for the next page to finish loading
   **Expect:** The loading skeleton disappears and is replaced by the newly loaded dispense order entries (page 2). The list now shows 14+ entries.
   **Record through:** yes

### Success looks like

- Loading skeleton appears at bottom during pagination
- Skeleton has 5 placeholder cards
- Skeleton disappears after page loads

---

## Test plan / notes

### Playwright E2E Coverage

- Add test file `tests/facility/patient/encounter/medicine/dispenseOrderPagination.spec.ts`:
  - Test AC1: first page loads (14 entries)
  - Test AC2: scroll triggers next page (28 entries after scroll)
  - Test AC3: end of list stops fetching (no skeleton after last page)
  - Test AC5: short list does not trigger pagination (10 entries, no skeleton)
- Use `getEncounterId()`, `getPatientId()`, `getFacilityId()` from `tests/support/`
- Use API seed to create controlled counts of dispense orders (10, 15, 20, 28+)
- Use `page.evaluate()` to scroll the selector to bottom programmatically
- Assert on skeleton visibility, entry counts, and network requests
- Use `page.waitForResponse()` to capture pagination API calls

### CI must pass

- All existing Playwright tests must pass
- Lint and type check must pass
- No console errors during test runs

### Performance notes

- RESULTS_PER_PAGE_LIMIT = 14 (from `src/common/constants.tsx`)
- Intersection observer has minimal performance impact
- `useInfiniteQuery` caches all loaded pages in memory
- Works with existing backend pagination API (no backend changes needed)
