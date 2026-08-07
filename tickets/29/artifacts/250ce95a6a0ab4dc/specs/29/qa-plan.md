# QA Plan: Add date range filter to facility invoice list

This plan provides concrete steps for QA to verify the date range filter implementation on the facility invoice list page.

## AC1 — Date filter control visible in filter bar

### Research map

- route: `/facility/{facilityId}/billing/invoices` via `src/Routers/routes/FacilityRoutes.tsx`
- component: `src/pages/Facility/billing/invoice/InvoicesData.tsx` (lines 68-72)
- i18n labels: "period" (already in `public/locale/en.json`)
- auth/role: `tests/.auth/user.json` (admin)
- permissions: facility-scoped billing access
- fixtures: facility from `getFacilityId()`, account from `getAccountId()`

### Prerequisites

- Backend running on port 9000
- Production build exists (`npm run build`)
- Facility and account fixtures loaded via `load_fixtures` / setup

### Data setup

- Prefer fixtures: `getFacilityId()` from `tests/.auth/facilityMeta.json` created by `tests/setup/facility.setup.ts`
- No special data needed — invoice list page should be accessible

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/billing/invoices` (replace `{facilityId}` with fixture ID from facilityMeta.json)
   **Expect:** Page loads, showing the invoice list interface with a filter bar
   **Record through:** yes

2. **Action:** Locate the filter bar area (near the search input and existing status/created-by filters)
   **Expect:** A "Period" filter control is visible alongside other filters (status, created by)
   **Record through:** yes

### Success looks like

- Filter bar renders with the new "Period" date filter control
- Control is labeled "Period" (i18n key)
- Positioned consistently with other filters in the bar

---

## AC2 — Preset range updates list and URL params

### Research map

- component: `src/pages/Facility/billing/invoice/InvoicesData.tsx` (lines 68-72, 90-102)
- date options: `longDateRangeOptions` from `src/components/ui/multi-filter/utils/Utils.tsx` (today, yesterday, last 7 days, etc.)
- query params: `created_date_after`, `created_date_before` (ISO datetime strings)

### Prerequisites

- Completed AC1 — filter control is visible

### Data setup

- Prefer fixtures: At least 2-3 invoices with different `created_date` values
- If fixtures don't provide this:
  - **UI recipe (if invoices don't exist):**
    1. Navigate to `/facility/{facilityId}/billing/account/{accountId}` (use `getAccountId()`)
    2. Click "Create Invoice" button
    3. Fill required fields and create invoice
    4. Return to `/facility/{facilityId}/billing/invoices`
    5. Repeat for a second invoice if needed
- Provenance: Invoice creation form schema from `src/types/billing/invoice/invoiceApi.ts` (listInvoice, createInvoice routes)

### Steps

1. **Action:** Click the "Period" filter control to open the date picker
   **Expect:** Date picker dropdown opens, showing preset options (Today, Yesterday, Last 7 days, etc.)
   **Record through:** yes

2. **Action:** Select a preset range (e.g., "Last 7 days")
   **Expect:**
   - Date picker closes
   - Invoice list updates to show only invoices created in the last 7 days
   - URL contains query parameters: `created_date_after=<ISO-date>&created_date_before=<ISO-date>`
     **Record through:** yes

3. **Action:** Inspect the URL in the browser address bar
   **Expect:** URL shows both `created_date_after` and `created_date_before` with ISO datetime values (e.g., `2026-08-01T00:00:00.000Z`)
   **Record through:** yes

### Success looks like

- Preset range selection updates the invoice list
- URL parameters `created_date_after` and `created_date_before` are set correctly
- Only invoices within the selected date range are displayed

---

## AC3 — Custom from→to range works

### Research map

- component: `src/pages/Facility/billing/invoice/InvoicesData.tsx` (date filter configuration)
- date transformation: `dateTimeQueryString()` from `src/Utils/utils.ts` (lines 86-95)

### Prerequisites

- Completed AC1 and AC2
- At least 2 invoices with different created dates

### Data setup

- Same as AC2 (requires invoices spanning multiple days)

### Steps

1. **Action:** Click the "Period" filter control to open the date picker
   **Expect:** Date picker opens
   **Record through:** yes

2. **Action:** Select "Custom" option (if available) or directly pick "from" and "to" dates from the calendar
   **Expect:** Two date pickers appear for "from" and "to" selection
   **Record through:** yes

3. **Action:** Select a custom date range (e.g., from 7 days ago to today)
   **Expect:**
   - Date picker closes after selection
   - Invoice list updates to show only invoices created between the selected dates
   - URL contains `created_date_after` and `created_date_before` with the custom date range
     **Record through:** yes

### Success looks like

- Custom date range selection filters the invoice list correctly
- URL parameters reflect the custom from→to dates
- Date range badge displays in the filter bar showing the selected range

---

## AC4 — Clear filter removes date params

### Research map

- component: `src/pages/Facility/billing/invoice/InvoicesData.tsx` (filter clear logic)
- clear handler: `handleClearFilter` from `useMultiFilterState` hook

### Prerequisites

- Completed AC2 or AC3 (date filter is active)

### Data setup

- Active date filter from previous steps

### Steps

1. **Action:** With a date filter active (from AC2 or AC3), locate the clear/close button on the date filter badge
   **Expect:** A clear (×) button is visible on the filter badge
   **Record through:** yes

2. **Action:** Click the clear button on the date filter badge
   **Expect:**
   - Date filter badge is removed from the filter bar
   - Invoice list refreshes to show all invoices (no date restriction)
   - URL no longer contains `created_date_after` or `created_date_before` parameters
     **Record through:** yes

3. **Action:** Check the browser URL
   **Expect:** No `created_date_after` or `created_date_before` in the query string
   **Record through:** yes

### Success looks like

- Clearing the date filter removes both query parameters
- Invoice list shows all invoices without date restriction
- No date filter badge remains in the filter bar

---

## AC5 — Date + status + created_by filters combine (AND logic)

### Research map

- component: `src/pages/Facility/billing/invoice/InvoicesData.tsx` (filter combination logic)
- filters: status (`invoiceStatusFilter`), created_by (`createdByFilter`), created_date (`dateFilter`)
- query params: all passed to API in `queryParams` object (lines 94-139)

### Prerequisites

- Completed AC1-AC4
- Multiple invoices with varying statuses and created dates

### Data setup

- Prefer fixtures: Invoices with different statuses (e.g., "draft", "approved", "paid")
- If fixtures don't provide variation:
  - **UI recipe:** Create 2-3 invoices with different statuses via the account page
  - Status options available in the invoice status filter dropdown

### Steps

1. **Action:** On the invoice list page, apply a date filter (e.g., "Last 7 days")
   **Expect:** Invoice list updates to show only invoices from the last 7 days
   **Record through:** yes

2. **Action:** Additionally, apply a status filter (e.g., select "Draft" status)
   **Expect:** Invoice list now shows only "Draft" invoices created in the last 7 days
   **Record through:** yes

3. **Action:** Check the URL
   **Expect:** URL contains `created_date_after`, `created_date_before`, and `status` query parameters
   **Record through:** yes

4. **Action:** (Optional) If created_by filter is available, apply it as well
   **Expect:** Invoice list shows only invoices matching all three filter criteria (date + status + created_by)
   **Record through:** yes

### Success looks like

- Multiple filters applied simultaneously (date + status + created_by)
- Invoice list displays only invoices matching ALL filter criteria (AND logic)
- URL shows all active query parameters

---

## AC6 — URL deep-linking with date params

### Research map

- component: `src/pages/Facility/billing/invoice/InvoicesData.tsx` (initial filter state from URL, lines 107-127)
- URL param extraction: `qParams` from `useFilters` hook
- filter initialization: `useMultiFilterState` hook with `created_date` initial value

### Prerequisites

- Completed AC2 or AC3 (know valid date query params)

### Data setup

- Valid `created_date_after` and `created_date_before` ISO datetime strings
- Example URL: `/facility/{facilityId}/billing/invoices?created_date_after=2026-08-01T00:00:00.000Z&created_date_before=2026-08-07T23:59:59.999Z`

### Steps

1. **Action:** Copy a URL with date parameters from a previous test (AC2 or AC3)
   **Expect:** URL contains `created_date_after` and/or `created_date_before` query params
   **Record through:** yes

2. **Action:** Open a new browser tab, paste the URL, and press Enter
   **Expect:**
   - Invoice list page loads
   - Date filter badge is displayed in the filter bar with the date range from the URL
   - Invoice list shows only invoices matching the date range from the URL
     **Record through:** yes

3. **Action:** Inspect the filter bar
   **Expect:** Date filter control reflects the URL state (e.g., "Last 7 days" or "Custom: Aug 1 - Aug 7")
   **Record through:** yes

### Success looks like

- Direct URL navigation with date params loads the page correctly
- Date filter state is restored from the URL parameters
- Invoice list displays filtered results matching the URL state

---

## AC7 — Empty range shows empty state

### Research map

- component: `src/pages/Facility/billing/invoice/InvoicesData.tsx` (empty state rendering, lines 159-165)
- empty state: `EmptyState` component with i18n key "no_invoices"

### Prerequisites

- Completed AC1-AC3

### Data setup

- A date range that contains no invoices
- Example: select a date range far in the past (e.g., "Yesterday" when no invoices were created yesterday)

### Steps

1. **Action:** Apply a date filter that results in zero invoices (e.g., select a date range from 2 years ago)
   **Expect:** Invoice list area displays an empty state message
   **Record through:** yes

2. **Action:** Check the empty state content
   **Expect:**
   - Empty state icon visible (document/file icon)
   - Message: "No invoices" (or similar i18n key)
   - Suggestion: "Try adjusting your filters or search"
   - No console errors in browser DevTools
     **Record through:** yes

3. **Action:** Open browser DevTools Console (F12)
   **Expect:** No JavaScript errors or warnings related to the date filter or invoice list
   **Record through:** yes

### Success looks like

- Empty date range displays the standard empty state UI
- No console errors or crashes
- User-friendly message guides next action
- Loading skeleton not stuck in loading state

---

## Test plan / notes

### Playwright E2E coverage (implement phase)

- Add test file: `tests/facility/billing/invoiceListDateFilter.spec.ts`
- Test scenarios:
  1. Date filter control renders on invoice list page
  2. Selecting preset range updates list and URL params
  3. Custom date range filters correctly
  4. Clear filter removes date params and refreshes list
  5. Date filter combines with status filter (AND logic)
  6. URL with date params initializes filter state correctly
  7. Empty date range shows empty state without errors

### CI expectations

- All existing invoice-related tests continue to pass
- No ESLint warnings or TypeScript errors
- Production build succeeds (`npm run build`)
- No console errors during manual or automated testing

### Data considerations

- Fixtures from `load_fixtures` should provide at least 2 invoices with different created dates
- If fixtures are insufficient, tests may use the UI recipe to create test invoices
- Clean up test data between runs using the DB snapshot system (`npm run playwright:db-restore`)

### Known limitations

- Backend API must support `created_date_after` and `created_date_before` query parameters (verified in implementation phase)
- Date filtering applies to invoice `created_date` field only (not due date, payment date, or service period)
