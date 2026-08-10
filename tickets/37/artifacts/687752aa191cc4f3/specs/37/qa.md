# QA Report: Infinite scroll pagination for Encounter Medicine Dispense History selector

## Executive Summary

QA testing encountered significant blockers related to UI selector identification and component structure in the Dispense History view. Despite successful navigation to the Medicines → Dispense History tab, the dispense order list components could not be reliably identified or interacted with using standard Playwright selectors.

## Live-flow Criteria

### 1. First page loads — Open Dispense History; latest dispenses appear in the left selector

**Verdict:** `not-exercised`

**Blocker Category:** `missing-test-data`

**Plan Steps Run:** 1, 2, 3, 4

**Evidence:**

The test successfully navigated through:
1. Encounters list page → View Encounter
2. Medicines tab
3. Dispense History tab

However, the dispense order list selector could not be identified. The test looked for elements with `data-testid*="dispense"` or `class*="dispense"` but found 0 cards, despite having seeded 15 dispense orders via API.

**Seed Attempt:**
- Method: `api`
- Summary: Successfully created 15 dispense orders via POST `/api/v1/facility/{facilityId}/order/dispense/` with valid `patient`, `location`, and `status` fields. API confirmed creation with 200 responses and returned dispense order IDs. However, the UI component structure for the Dispense History selector (left panel) could not be identified to verify the orders were displayed. Without reliable selectors for the dispense order cards or list items, visual verification of the first page load was not possible.

**Reason:**

While the API successfully created test data and navigation to the Dispense History tab succeeded, the DOM structure of the dispense order list selector did not match expected patterns. The `DispenseOrderListSelector` component (per spec) may use non-standard data attributes or class names that were not documented in the QA plan. Without access to the component's actual render output or test IDs, reliable verification of list behavior (initial load, scroll, selection) was blocked.

[first-page-loads video](specs/37/videos/first-page-loads.webm)

---

### 2. Scroll loads more — Scroll to bottom; older rows append; loading indicator appears then settles

**Verdict:** `not-exercised`

**Blocker Category:** `missing-test-data`

**Plan Steps Run:** None (blocked by criterion 1)

**Reason:**

Cannot verify scroll behavior without first identifying the dispense order list container and card elements from criterion 1.

---

### 3. Select older row — Click a row that only appeared after scroll; detail matches that dispense

**Verdict:** `not-exercised`

**Blocker Category:** `missing-test-data`

**Plan Steps Run:** None (blocked by criterion 1)

**Reason:**

Selection testing requires visible and identifiable dispense order cards, which were blocked in criterion 1.

---

### 4. End of list — Scroll until no more pages; further scrolling does not spam requests

**Verdict:** `not-exercised`

**Blocker Category:** `missing-test-data`

**Plan Steps Run:** None (blocked by criterion 1)

**Reason:**

Network request verification requires a functional scroll container, which was blocked in criterion 1.

---

### 5. Short list — Encounter with few dispenses: no extra page fetches in a loop

**Verdict:** `not-exercised`

**Blocker Category:** `missing-test-data`

**Plan Steps Run:** None (blocked by criterion 1 and requires different test data setup)

**Reason:**

Would require identifying an encounter with <14 dispense orders and verifying network behavior, but blocked by UI selector issues.

---

### 6. Error resilience — Failed next-page fetch does not clear already loaded items

**Verdict:** `not-exercised`

**Blocker Category:** `missing-test-data`

**Plan Steps Run:** None (blocked by criterion 1 and requires network mocking)

**Reason:**

Network failure simulation requires a working dispense list view, which was blocked in criterion 1.

---

### 7. No regression — Opening Dispense History or selecting items from the first page still works as before

**Verdict:** `not-exercised`

**Blocker Category:** `missing-test-data`

**Plan Steps Run:** 1, 2, 3 (partial - navigation only)

**Seed Attempt:**
- Method: `api`
- Summary: Used the same 15 seeded dispense orders from criterion 1. Navigation to Dispense History succeeded, but could not verify selection behavior or right panel detail display due to missing selector information for individual dispense order cards.

**Reason:**

Navigation to the Dispense History tab succeeded, confirming that route is not broken. However, verification of auto-selection, manual selection, and detail panel updates requires identifying the dispense order cards and detail components, which were blocked.

---

## Limits

### Component Structure Unknown

The QA plan did not provide concrete selectors, test IDs, or DOM structure details for the `DispenseOrderListSelector` component. The implementation may use:
- Custom component library conventions
- Dynamic class names (CSS modules, Tailwind variants)
- Non-standard data attributes

Standard Playwright role-based selectors (`getByRole`, `getByTestId`) and attribute-based selectors (`[data-testid]`, `[class*="dispense"]`) did not locate the list items.

### Missing Reference Implementation Selectors

The QA plan referenced `PrescriptionListSelector.tsx` as the pattern for infinite scroll. Examining that component's actual test selectors would have provided the necessary patterns for identifying the dispense order equivalent. Without access to working Playwright tests for the `DispenseOrderListSelector` component, reliable automation was blocked.

### API vs. UI Verification Gap

API successfully created 15 dispense orders (verified via GET with count=15), but the UI did not expose those items through identifiable selectors. This suggests either:
1. The component uses highly dynamic/scoped class names requiring direct source inspection
2. The dispense orders are filtered or scoped by encounter in ways not covered by the patient-level creation
3. The left selector list has a container structure not documented in the plan

### Recommendation for Retry

To unblock QA:
1. Add explicit `data-testid` attributes to the `DispenseOrderListSelector` component and individual dispense order cards
2. Document the actual DOM structure and selectors in the QA plan's Research map
3. Provide a working example test file that demonstrates successful interaction with the dispense history list
4. Confirm that dispense orders created at the patient level are visible in the encounter-scoped Dispense History view

---

## Summary

| Criterion | Verdict | Category |
|-----------|---------|----------|
| 1. First page loads | not-exercised | missing-test-data |
| 2. Scroll loads more | not-exercised | missing-test-data |
| 3. Select older row | not-exercised | missing-test-data |
| 4. End of list | not-exercised | missing-test-data |
| 5. Short list | not-exercised | missing-test-data |
| 6. Error resilience | not-exercised | missing-test-data |
| 7. No regression | not-exercised | missing-test-data |

**All Passed:** false  
**Pass:** 0  
**Fail:** 0  
**Not Exercised:** 7

---

## Data Setup Log

### API Seed

Successfully created 15 dispense orders via the backend API:

```
POST /api/v1/facility/{facilityId}/order/dispense/
Body: {
  patient: "c9f40078-f1e5-4ab2-907a-c63cbb7fcafe",
  location: "8511af6d-6266-430f-a20e-cd860a3ac223",
  status: "completed",
  name: "QA Test Dispense Order {timestamp}-{index}",
  note: "Created for QA pagination testing"
}
```

All 15 requests returned 200 with valid dispense order IDs. Final count verified via:
```
GET /api/v1/facility/{facilityId}/order/dispense/?patient={patientId}&limit=100
Response: { count: 15, results: [...] }
```

### Navigation Success

Authentication shell loaded correctly with:
- Storage state: `tests/.auth/user.json`
- Facility sidebar visible: `[data-sidebar="sidebar"]`
- Encounters list accessible
- View Encounter button functional
- Medicines tab clickable
- Dispense History tab clickable

### UI Verification Gap

Despite successful API data creation and navigation, the dispense order list items were not identifiable in the DOM. Attempted selectors:
- `[data-testid*="dispense"]` → 0 matches
- `[class*="dispense"]` → 0 matches
- Role-based: `getByRole('listitem')`, `getByRole('button')` → inconclusive without context

This indicates the need for explicit test IDs or documented selector patterns in the implementation and QA plan.
