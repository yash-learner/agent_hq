# QA Plan: Date Filter on Invoice List

## AC1 — Date filter option visible

### Research map

- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/billing/invoices`
- components: `src/pages/Facility/billing/invoice/InvoicesData.tsx` (lines 68-72), `src/components/ui/multi-filter/MultiFilter.tsx`
- i18n labels: "period", "filter", "clear_all"
- auth/role: `tests/.auth/user.json` (admin)
- permissions: facility-scoped
- fixtures needed: facility, account, invoices

### Prerequisites

- User logged in as admin (tests/.auth/user.json)
- Facility context active via getFacilityId()

### Data setup

- Prefer fixtures: `load-fixtures` provides a facility (via getFacilityId())
- Fixtures provide accounts and patients
- Need invoices: create via UI using the existing account from fixtures
- UI recipe (if no invoices exist):
  1. Go to `/facility/{facilityId}/billing/invoices`
  2. If list is empty, navigate to `/facility/{facilityId}/billing/accounts`
  3. Select an account with status "active"
  4. Click "Create Invoice" button
  5. Select charge items and click "Create Invoice"
  6. Return to `/facility/{facilityId}/billing/invoices`

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/billing/invoices`
   **Expect:** Invoice list page loads with filter button visible
   **Record through:** yes

2. **Action:** Click the "Filter" button in the toolbar
   **Expect:** Filter dropdown opens showing "Status", "Period", and "Created By" filter options
   **Record through:** yes
   **Still after:** yes

### Success looks like

- Filter dropdown displays "Period" option alongside existing "Status" and "Created By" filters

---

## AC2 — Preset date options filter invoices

### Research map

- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/billing/invoices`
- components: `src/pages/Facility/billing/invoice/InvoicesData.tsx` (lines 88-99), `src/components/ui/multi-filter/utils/Utils.ts` (longDateRangeOptions)
- i18n labels: "today", "yesterday", "last_7_days", "last_30_days", "period"
- auth/role: `tests/.auth/user.json` (admin)
- permissions: facility-scoped
- fixtures needed: facility, multiple invoices with different created dates

### Prerequisites

- User logged in as admin (tests/.auth/user.json)
- Facility context active
- Multiple invoices exist with varying created dates

### Data setup

- Prefer fixtures: `load-fixtures` provides a facility (via getFacilityId())
- Need multiple invoices created on different dates for meaningful filtering
- UI recipe (create test invoices with date variance):
  1. Go to `/facility/{facilityId}/billing/accounts`
  2. Select an active account
  3. Create Invoice #1 (will have today's date)
  4. Note: Additional invoices with past dates require API seed (see below)
- API seed (for invoices with past dates):
  - POST `/api/v1/facility/{facilityId}/invoice/`
    (from `src/types/billing/invoice/invoiceApi.ts`)
  - Auth: `getApiUrl()` + `getApiHeaders()` from `tests/helper/utils.ts` + `tests/.auth/user.json`
  - Body:
    ```json
    {
      "account": "{accountId}",
      "charge_items": ["{chargeItemId}"],
      "status": "issued"
    }
    ```
    Note: Backend timestamps with current time; manual date modification not supported. For QA, verify filter with "today" option shows newly created invoices.
- Verify: Navigate to `/facility/{facilityId}/billing/invoices` and confirm at least one invoice appears before testing filters

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/billing/invoices` and note the total number of invoices displayed
   **Expect:** Invoice list loads with all invoices visible
   **Record through:** yes

2. **Action:** Click "Filter" button, select "Period" filter, and choose "Today" preset
   **Expect:** Invoice list refreshes to show only invoices created today; filter badge shows "Today"
   **Record through:** yes
   **Still after:** yes

3. **Action:** Clear the date filter, then select "Period" filter and choose "Last 7 Days" preset
   **Expect:** Invoice list shows invoices created in the last 7 days; filter badge displays date range
   **Record through:** yes
   **Still after:** yes

### Success looks like

- Invoice list dynamically filters based on preset date selection
- Filter badge displays the selected preset or date range
- Only invoices matching the date criteria are visible

---

## AC3 — Custom date range filters invoices

### Research map

- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/billing/invoices`
- components: `src/pages/Facility/billing/invoice/InvoicesData.tsx` (lines 88-99), date picker component
- i18n labels: "from", "to", "apply", "period"
- auth/role: `tests/.auth/user.json` (admin)
- permissions: facility-scoped
- fixtures needed: facility, invoices

### Prerequisites

- User logged in as admin (tests/.auth/user.json)
- Facility context active
- Multiple invoices exist

### Data setup

- Same as AC2 above
- Ensure at least one invoice exists for testing

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/billing/invoices`, click "Filter", select "Period", and click "Custom" option
   **Expect:** Date picker opens with "from" and "to" date inputs
   **Record through:** yes

2. **Action:** Select a "from" date (e.g., 7 days ago) and "to" date (e.g., today), then click "Apply"
   **Expect:** Invoice list refreshes showing only invoices created between selected dates (inclusive); filter badge shows date range (e.g., "15 Jan - 20 Jan")
   **Record through:** yes
   **Still after:** yes

### Success looks like

- Custom date range picker allows selection of start and end dates
- Invoice list filters to show only invoices within the selected range
- Filter badge displays the custom date range clearly

---

## AC4 — Date filter badge displays correctly

### Research map

- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/billing/invoices`
- components: `src/pages/Facility/billing/invoice/InvoicesData.tsx`, `src/components/ui/multi-filter/filterConfigs.tsx` (SelectedDateBadge)
- i18n labels: "period"
- auth/role: `tests/.auth/user.json` (admin)
- permissions: facility-scoped
- fixtures needed: facility, invoices

### Prerequisites

- User logged in as admin (tests/.auth/user.json)
- Facility context active
- At least one invoice exists

### Data setup

- Same as AC2 above
- Ensure at least one invoice exists for testing

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/billing/invoices`, apply "Period" filter with "Today" preset
   **Expect:** Filter badge appears above the invoice list showing "Today" or the specific date
   **Record through:** yes
   **Still after:** yes

2. **Action:** Clear the filter, then apply a custom date range (e.g., 15 Jan 2026 to 20 Jan 2026)
   **Expect:** Filter badge displays the date range as "15 Jan - 20 Jan" or similar formatted text
   **Record through:** yes
   **Still after:** yes

### Success looks like

- Filter badge clearly shows the selected date or date range
- Badge format is consistent with date display patterns elsewhere in the app

---

## AC5 — Date filter persists via URL

### Research map

- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/billing/invoices`
- components: `src/pages/Facility/billing/invoice/InvoicesData.tsx` (lines 135-136, qParams usage)
- query params: `created_date_after`, `created_date_before`
- auth/role: `tests/.auth/user.json` (admin)
- permissions: facility-scoped
- fixtures needed: facility, invoices

### Prerequisites

- User logged in as admin (tests/.auth/user.json)
- Facility context active
- At least one invoice exists

### Data setup

- Same as AC2 above
- Ensure at least one invoice exists for testing

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/billing/invoices`, apply "Period" filter with custom date range
   **Expect:** URL updates to include `created_date_after` and `created_date_before` query parameters
   **Record through:** yes

2. **Action:** Copy the current URL from the address bar
   **Expect:** URL contains query parameters like `?created_date_after=2026-01-15T00:00:00Z&created_date_before=2026-01-20T23:59:59Z`
   **Record through:** yes

3. **Action:** Open the copied URL in a new browser tab (or refresh the page)
   **Expect:** Invoice list loads with the date filter already applied; filter badge displays the date range; filtered results match the original view
   **Record through:** yes
   **Still after:** yes

### Success looks like

- URL query parameters persist the date filter state
- Opening the URL in a new tab restores the exact filter state
- Date filter badge and invoice list match the filtered state from the original tab

---

## AC6 — Clear all filters removes date filter

### Research map

- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/billing/invoices`
- components: `src/pages/Facility/billing/invoice/InvoicesData.tsx` (lines 108, handleClearAll), `src/components/ui/multi-filter/MultiFilter.tsx`
- i18n labels: "clear_all", "period", "status"
- auth/role: `tests/.auth/user.json` (admin)
- permissions: facility-scoped
- fixtures needed: facility, invoices

### Prerequisites

- User logged in as admin (tests/.auth/user.json)
- Facility context active
- Multiple invoices exist with varying statuses and dates

### Data setup

- Same as AC2 above
- Ensure invoices exist with different statuses for multi-filter testing

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/billing/invoices`, apply multiple filters: "Status" = "issued" AND "Period" = "Today"
   **Expect:** Invoice list shows only issued invoices created today; both filter badges appear
   **Record through:** yes

2. **Action:** Click the "Clear All" button in the filter area
   **Expect:** All filter badges disappear; invoice list refreshes to show all invoices regardless of status or date; URL no longer contains filter query parameters
   **Record through:** yes
   **Still after:** yes

### Success looks like

- "Clear All" removes date filter along with all other active filters
- Invoice list returns to unfiltered state showing all invoices
- Filter badges and URL parameters are cleared

---

## AC7 — Partial date filter (start only or end only)

### Research map

- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/billing/invoices`
- components: `src/pages/Facility/billing/invoice/InvoicesData.tsx` (lines 88-99)
- query params: `created_date_after` (start only) or `created_date_before` (end only)
- auth/role: `tests/.auth/user.json` (admin)
- permissions: facility-scoped
- fixtures needed: facility, invoices

### Prerequisites

- User logged in as admin (tests/.auth/user.json)
- Facility context active
- Multiple invoices with different creation dates

### Data setup

- Same as AC2 above
- Ensure multiple invoices exist spanning several days

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/billing/invoices`, click "Filter", select "Period", choose "Custom", enter only a "from" date (e.g., 7 days ago), leave "to" empty, click "Apply"
   **Expect:** Invoice list shows invoices created on or after the "from" date; filter badge shows "From: [date]" or similar
   **Record through:** yes
   **Still after:** yes

2. **Action:** Clear the filter, then apply "Period" filter with only a "to" date (e.g., yesterday), leave "from" empty, click "Apply"
   **Expect:** Invoice list shows invoices created on or before the "to" date; filter badge shows "Until: [date]" or similar
   **Record through:** yes
   **Still after:** yes

### Success looks like

- Date filter supports partial ranges (start only or end only)
- Invoice list correctly filters based on single-bound date criteria
- Filter badge clearly indicates the partial range

---

## Test plan / notes

### Playwright E2E Coverage

- Add test file: `tests/facility/billing/invoiceFilters.spec.ts`
- Test cases should cover:
  1. Preset date filter options (today, yesterday, last 7 days, last 30 days)
  2. Custom date range filtering
  3. URL persistence of `created_date_after` and `created_date_before` params
  4. Filter badge rendering for date ranges
  5. Clear all filters interaction
  6. Partial date ranges (start only, end only)
- Use `tests/helper/utils.ts` for API helpers (`getApiUrl`, `getApiHeaders`)
- Use `getFacilityId()` from `tests/support/facilityId.ts` for facility context
- Create test invoices via API seed with different timestamps if needed

### CI Expectations

- Linting: Code follows existing patterns in `InvoicesData.tsx` and `AccountList.tsx`
- Type safety: Query params and date handling are properly typed
- Build: Production build completes successfully
- Tests: New Playwright tests pass in CI pipeline
