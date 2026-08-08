# QA Plan: Add date range filter to facility invoice list

## AC1 — Date filter visible in filter bar

### Research map

- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/billing/invoices`
- components: `src/pages/Facility/billing/invoice/InvoicesData.tsx`, `src/components/ui/multi-filter/MultiFilter.tsx`
- i18n labels: "Period" (from `t("period")`), "Add Filter"
- auth/role: `tests/.auth/user.json` (admin)
- permissions / facility-scoped: yes (requires active facility context)
- fixtures needed: facility (provided by `getFacilityId()`)

### Prerequisites

- Facility context active
- User logged in with admin credentials

### Data setup

- Prefer fixtures: `getFacilityId()` returns the seeded facility ID from `tests/.auth/facilityMeta.json`
- No additional data required for filter visibility test

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/billing/invoices`
   **Expect:** Invoice list page loads showing the header "Invoices" and filter controls
   **Record through:** yes

2. **Action:** Click the "Add Filter" button in the filter bar
   **Expect:** A dropdown menu opens showing available filter options including "Status", "Created By", and "Period"
   **Record through:** yes

3. **Action:** Verify "Period" option is visible in the dropdown
   **Expect:** "Period" menu item is visible and clickable
   **Record through:** yes

### Success looks like

- The "Add Filter" button exists and opens a menu
- "Period" appears in the filter options alongside "Status" and "Created By"
- No console errors

---

## AC2 — Preset date range filter (Last 7 Days)

### Research map

- routes: Same as AC1
- components: `src/pages/Facility/billing/invoice/InvoicesData.tsx` (lines 71, 88-99), `src/components/ui/multi-filter/utils/Utils.tsx` (`longDateRangeOptions`)
- i18n labels: "Period", "Last 7 Days"
- auth/role: `tests/.auth/user.json` (admin)
- permissions / facility-scoped: yes
- fixtures needed: facility + account + invoices with varied created dates

### Prerequisites

- Facility context active
- User logged in with admin credentials
- At least 2-3 invoices with different created_date values exist

### Data setup

- Prefer fixtures: `getFacilityId()` returns facility ID, `getAccountId()` returns account ID from `tests/.auth/accountMeta.json` (created by `tests/setup/patientAccount.setup.ts`)
- Provenance: Invoice creation via `src/types/billing/invoice/invoiceApi.ts` `createInvoice` route
- **Backend limitation:** The backend auto-assigns `created_date` on invoice creation (see `InvoiceList` type at `src/types/billing/invoice/invoice.ts:47`). The `InvoiceCreate` type (lines 34-40) does NOT include `created_date` in the request body, so all invoices created in rapid succession will have nearly identical timestamps.
- **For QA:** Since backend fixtures don't provide invoices with varied `created_date` values, and API creation can't set custom `created_date`, this test validates UI behavior and URL params only. The actual filtering by date range requires invoices created at different times (manual data or production usage).
- UI recipe (if invoices don't exist):
  1. Go to `/facility/{facilityId}/patient/{patientId}/accounts?status=active` (use `getFacilityId()` and `getPatientId()`)
  2. Click "Go to account" or "Create Account" (if needed)
  3. Navigate to the account's invoice tab
  4. Click "Create Invoice"
  5. Fill required fields: select account (pre-filled), status="draft", issue_date=today
  6. Click "Create"
  7. Repeat to create a second invoice (note: both will have similar `created_date`)

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/billing/invoices`
   **Expect:** Invoice list page loads
   **Record through:** yes

2. **Action:** Click "Add Filter" → Select "Period" → Click "Last 7 Days" preset button
   **Expect:** The filter is applied; a filter badge appears showing "Period: Last 7 Days" (or similar text)
   **Record through:** yes

3. **Action:** Check the browser URL
   **Expect:** URL contains query parameters `created_date_after=YYYY-MM-DD` and `created_date_before=YYYY-MM-DD` representing the last 7 days range
   **Record through:** yes

4. **Action:** Observe the invoice list
   **Expect:** List updates (loading indicator appears briefly); invoices that fall within the date range are displayed (or empty state if none exist)
   **Record through:** yes

### Success looks like

- Filter badge displays the applied "Period" filter
- URL contains `created_date_after` and `created_date_before` params with correct date values
- No console errors during filter application

---

## AC3 — Custom date range filter (From/To)

### Research map

- routes: Same as AC1
- components: Same as AC2
- i18n labels: "Period", "Custom", "From", "To"
- auth/role: `tests/.auth/user.json` (admin)
- permissions / facility-scoped: yes
- fixtures needed: Same as AC2

### Prerequisites

- Same as AC2

### Data setup

- Same as AC2 (invoices with varied `created_date` preferred but not required for UI validation)

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/billing/invoices`
   **Expect:** Invoice list page loads
   **Record through:** yes

2. **Action:** Click "Add Filter" → Select "Period" → Click "Custom" button
   **Expect:** A date range picker opens showing "From" and "To" date input fields
   **Record through:** yes

3. **Action:** Enter a custom date range: From = 10 days ago, To = today
   - Fill "From" field with date 10 days ago (format: YYYY-MM-DD)
   - Fill "To" field with today's date
   - Press Escape or click outside to apply
     **Expect:** The filter is applied; filter badge appears showing the custom date range
     **Record through:** yes

4. **Action:** Check the browser URL
   **Expect:** URL contains `created_date_after=<from-date>` and `created_date_before=<to-date>` matching the entered values
   **Record through:** yes

5. **Action:** Observe the invoice list
   **Expect:** List updates to show invoices in the date range (or empty state if none exist)
   **Record through:** yes

### Success looks like

- Custom date inputs accept dates and apply the filter
- URL contains both date params with the custom values
- Filter badge displays the custom date range
- No console errors

---

## AC4 — Clear date filter

### Research map

- routes: Same as AC1
- components: Same as AC2, plus filter badge clear button
- i18n labels: "Period", clear icon/button
- auth/role: `tests/.auth/user.json` (admin)
- permissions / facility-scoped: yes
- fixtures needed: facility only

### Prerequisites

- Same as AC1

### Data setup

- Same as AC1 (no invoice data required for clear test)

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/billing/invoices` and apply "Last 7 Days" filter (as in AC2)
   **Expect:** Filter badge appears showing "Period" filter
   **Record through:** yes

2. **Action:** Locate the filter badge for "Period" and click the clear/close button (X icon)
   **Expect:** The filter badge disappears
   **Record through:** yes

3. **Action:** Check the browser URL
   **Expect:** URL no longer contains `created_date_after` or `created_date_before` params
   **Record through:** yes

4. **Action:** Observe the invoice list
   **Expect:** List refreshes to show all invoices without date restriction
   **Record through:** yes

### Success looks like

- Filter badge is removed after clicking clear
- URL params are removed
- List shows unfiltered results
- No console errors

---

## AC5 — Combine date filter with status filter

### Research map

- routes: Same as AC1
- components: Same as AC2, plus `invoiceStatusFilter` from `src/components/ui/multi-filter/filterConfigs.tsx`
- i18n labels: "Period", "Status", "Draft"
- auth/role: `tests/.auth/user.json` (admin)
- permissions / facility-scoped: yes
- fixtures needed: facility + invoices with status "draft" and varied created dates

### Prerequisites

- Same as AC2

### Data setup

- Same as AC2 (requires invoices with "draft" status; UI-created invoices default to "draft")

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/billing/invoices`
   **Expect:** Invoice list page loads
   **Record through:** yes

2. **Action:** Apply "Last 7 Days" date filter (click "Add Filter" → "Period" → "Last 7 Days")
   **Expect:** "Period" filter badge appears; URL contains date params
   **Record through:** yes

3. **Action:** Apply status filter: click "Add Filter" → "Status" → check "Draft" → press Escape
   **Expect:** "Status" filter badge appears; URL contains `status=draft`
   **Record through:** yes

4. **Action:** Check the browser URL
   **Expect:** URL contains all three params: `created_date_after`, `created_date_before`, and `status=draft`
   **Record through:** yes

5. **Action:** Observe the invoice list
   **Expect:** List shows only draft invoices within the last 7 days (or empty state if none match)
   **Record through:** yes

### Success looks like

- Both filter badges are visible ("Period" and "Status")
- URL contains date and status params
- List applies both constraints (AND logic)
- No console errors

---

## AC6 — Restore date filter from URL on reload

### Research map

- routes: Same as AC1
- components: Same as AC2, plus `useFilters` hook and `useMultiFilterState`
- i18n labels: "Period"
- auth/role: `tests/.auth/user.json` (admin)
- permissions / facility-scoped: yes
- fixtures needed: facility only

### Prerequisites

- Same as AC1

### Data setup

- Same as AC1 (no invoice data required for URL restore test)

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/billing/invoices` and apply "Last 7 Days" filter
   **Expect:** Filter is applied; URL contains date params
   **Record through:** yes

2. **Action:** Copy the full URL from the address bar
   **Expect:** URL includes `created_date_after` and `created_date_before` params
   **Record through:** yes

3. **Action:** Reload the page (F5 or navigate to the copied URL in a new tab)
   **Expect:** Page reloads with filter still active
   **Record through:** yes

4. **Action:** Verify the filter badge is visible and URL still has date params
   **Expect:** "Period" filter badge is shown; URL params persist
   **Record through:** yes

5. **Action:** Observe the invoice list
   **Expect:** List shows filtered results matching the date range from URL
   **Record through:** yes

### Success looks like

- Filter state is restored from URL params on page load
- Filter badge displays the restored filter
- List shows correct filtered results
- No console errors

---

## AC7 — Empty state when no invoices in date range

### Research map

- routes: Same as AC1
- components: Same as AC2, plus `EmptyState` component from `src/components/ui/empty-state`
- i18n labels: "Period", "Custom", empty state text
- auth/role: `tests/.auth/user.json` (admin)
- permissions / facility-scoped: yes
- fixtures needed: facility only

### Prerequisites

- Same as AC1

### Data setup

- Same as AC1 (no invoice data required; filter will target future dates with no invoices)

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/billing/invoices`
   **Expect:** Invoice list page loads
   **Record through:** yes

2. **Action:** Apply custom date filter for future dates: click "Add Filter" → "Period" → "Custom"
   - Set "From" to next month (e.g., 2026-09-01)
   - Set "To" to 7 days after "From" (e.g., 2026-09-08)
   - Press Escape
     **Expect:** Filter is applied; filter badge appears
     **Record through:** yes

3. **Action:** Check the browser URL
   **Expect:** URL contains future date params
   **Record through:** yes

4. **Action:** Observe the invoice list and browser console
   **Expect:** Empty state is displayed (e.g., "No invoices found" or similar message); no JavaScript errors in console
   **Record through:** yes

### Success looks like

- Empty state renders gracefully when no invoices match the filter
- URL contains the date params
- No console errors or crashes
- Page remains functional (can clear filter and see invoices again)

---

## Test plan / notes

### Playwright E2E Coverage

- Test file: `tests/facility/billing/invoiceListDateFilter.spec.ts`
- 7 test scenarios corresponding to AC1-AC7
- Tests verify UI behavior, URL param management, and filter state without asserting on filtered result counts (due to backend `created_date` auto-assignment limitation)
- Backend must be running on port 9000 with fixtures loaded
- DB snapshot system ensures clean state between runs

### CI Requirements

- ESLint: No new warnings in modified files
- TypeScript: Type-check passes
- Build: Production build succeeds
- Playwright: All tests in `tests/facility/billing/invoiceListDateFilter.spec.ts` pass

### Known Limitations

- Backend auto-assigns `created_date` on invoice creation; cannot be set via API
- Playwright tests validate filter UI and params only, not filtered result counts
- QA plan includes manual data setup via UI for live verification with varied invoice dates
- Production usage with real invoice creation over time will provide varied `created_date` values for full filter validation
