# QA Plan: Date filter on invoice list

## AC1 — Period filter option visible in filter menu

### Research map

- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/billing/invoices`
- components: `src/pages/Facility/billing/invoice/InvoiceList.tsx`, `src/pages/Facility/billing/invoice/InvoicesData.tsx`, `src/components/ui/multi-filter/MultiFilter.tsx`
- i18n labels: "Period" (`period`), "Filter" (`filter`)
- auth/role: `tests/.auth/user.json` (admin role)
- permissions: facility-scoped, requires facility context
- fixtures needed: seeded facility from fixtures, invoices created during billing tests

### Prerequisites

- Logged in as admin user
- Valid facility context active

### Data setup

- Prefer fixtures: `load-fixtures` provides a facility with ID accessible via `getFacilityId()` from `tests/support/facilityId.ts`
- Backend fixtures include test invoices with various created dates
- No additional data creation needed for viewing the filter UI

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/billing/invoices` where `{facilityId}` is the facility ID from fixtures
   **Expect:** Invoice list page loads with invoices table and filter controls
   **Record through:** yes

2. **Action:** Click the "Filter" button in the toolbar
   **Expect:** Filter dropdown menu opens showing filter options including "Status", "Created By", and "Period"
   **Record through:** yes

### Success looks like

- Filter menu opens when clicking "Filter" button
- "Period" option is visible alongside existing "Status" and "Created By" filters
- UI matches the existing filter pattern used in AccountList

## AC2 — Preset date range filtering works

### Research map

- routes: same as AC1
- components: same as AC1 + `src/components/ui/multi-filter/filterConfigs.tsx` (dateFilter), `src/components/ui/multi-filter/utils/Utils.tsx` (longDateRangeOptions)
- i18n labels: "last {{count}} days" (`last_count_days`), "yesterday", "today"
- auth/role: `tests/.auth/user.json`
- permissions: facility-scoped
- fixtures needed: facility from fixtures, invoices with various dates

### Prerequisites

- Same as AC1
- On invoice list page `/facility/{facilityId}/billing/invoices`

### Data setup

- Prefer fixtures: facility and existing invoices from backend fixtures
- Backend fixtures should include invoices with created dates from the past 7-14 days to validate filtering
- No additional data creation needed

### Steps

1. **Action:** Click the "Filter" button, then click "Period" in the dropdown menu
   **Expect:** Date range selector opens with preset options including "today", "yesterday", "last {{count}} days"
   **Record through:** yes

2. **Action:** Select the "last {{count}} days" preset (typically "Last 7 days")
   **Expect:** Date range is applied, invoice list refreshes, URL updates with `created_date_after` and `created_date_before` query parameters
   **Record through:** yes

3. **Action:** Verify the invoice list shows only invoices created within the last 7 days
   **Expect:** Table displays filtered invoices; invoices outside the date range are not shown
   **Record through:** yes

### Success looks like

- Date picker opens with preset options when "Period" filter is selected
- Selecting a preset (e.g., "Last 7 days") applies the filter
- API call includes `created_date_after` and `created_date_before` parameters
- Only invoices within the selected date range are displayed

## AC3 — Custom date range filtering works

### Research map

- routes: same as AC1
- components: same as AC2
- i18n labels: same as AC2
- auth/role: `tests/.auth/user.json`
- permissions: facility-scoped
- fixtures needed: facility and invoices from fixtures

### Prerequisites

- Same as AC1
- On invoice list page with multiple invoices spanning different dates

### Data setup

- Prefer fixtures: facility and existing invoices from backend fixtures
- Backend fixtures should include invoices with various created dates to validate custom range filtering

### Steps

1. **Action:** Click "Filter" button, click "Period", then select "Custom range" or the custom date input option
   **Expect:** Custom date range picker opens with start date and end date inputs
   **Record through:** yes

2. **Action:** Select a custom start date (e.g., first day of current month) and end date (e.g., today)
   **Expect:** Date inputs accept the selections
   **Record through:** yes

3. **Action:** Apply the custom date range
   **Expect:** Invoice list refreshes, URL updates with `created_date_after` and `created_date_before` parameters matching the selected range, invoices are filtered to the custom date range
   **Record through:** yes

### Success looks like

- Custom date picker allows selecting arbitrary start and end dates
- Filter is applied when date range is confirmed
- Only invoices created between the selected start and end dates (inclusive) are displayed
- URL query parameters reflect the selected date range

## AC4 — Date range displayed as badge in selected filters bar

### Research map

- routes: same as AC1
- components: same as AC2 + `src/components/ui/multi-filter/selectedFilterBar.tsx`, `src/components/ui/multi-filter/dateFilter.tsx` (SelectedDateBadge)
- i18n labels: date formatting labels
- auth/role: `tests/.auth/user.json`
- permissions: facility-scoped
- fixtures needed: facility and invoices from fixtures

### Prerequisites

- Same as AC1
- Date filter has been applied (either preset or custom range)

### Data setup

- Same as AC2/AC3

### Steps

1. **Action:** Apply a date filter (e.g., "Last 7 days" preset)
   **Expect:** Date filter is applied to invoice list
   **Record through:** yes

2. **Action:** View the selected filters bar (typically displayed above or within the data table)
   **Expect:** Selected filters bar shows a badge representing the date range with formatted dates (e.g., "Jan 1 - Jan 7" or "Last 7 days")
   **Record through:** yes

### Success looks like

- Date filter appears as a badge in the selected filters bar
- Badge displays a human-readable date range label
- Badge format matches the pattern used in AccountList date filter

## AC5 — Date filter can be cleared

### Research map

- routes: same as AC1
- components: same as AC4
- i18n labels: "Clear all" or close icon
- auth/role: `tests/.auth/user.json`
- permissions: facility-scoped
- fixtures needed: facility and invoices from fixtures

### Prerequisites

- Same as AC1
- Date filter has been applied

### Data setup

- Same as AC2/AC3

### Steps

1. **Action:** With a date filter active, click the clear/remove button (X icon) on the date filter badge in the selected filters bar
   **Expect:** Date filter is removed, invoice list refreshes to show all invoices (subject to other active filters)
   **Record through:** yes

2. **Action:** Verify URL query parameters no longer include `created_date_after` or `created_date_before`
   **Expect:** URL is updated, date filter parameters are removed
   **Record through:** yes

3. **Action:** Verify invoice list shows all invoices again (no date filtering applied)
   **Expect:** Table displays all invoices, including those outside the previously selected date range
   **Record through:** yes

### Success looks like

- Date filter badge has a clear/remove control
- Clicking the clear control removes the date filter
- Invoice list updates to show all invoices (no date filtering)
- URL query parameters for date filter are removed

## AC6 — Date filter combines with other filters

### Research map

- routes: same as AC1
- components: same as AC1-AC5
- i18n labels: "Status", "Created By", "Period"
- auth/role: `tests/.auth/user.json`
- permissions: facility-scoped
- fixtures needed: facility and invoices with various statuses and creators from fixtures

### Prerequisites

- Same as AC1
- Multiple invoices exist with different statuses, creators, and dates

### Data setup

- Prefer fixtures: facility and invoices from backend fixtures
- Backend fixtures should provide invoices with different status values (e.g., "draft", "pending", "paid") and different creators to validate combined filtering

### Steps

1. **Action:** Apply a status filter (e.g., select "paid" status)
   **Expect:** Invoice list filters to show only paid invoices
   **Record through:** yes

2. **Action:** Without clearing the status filter, apply a date filter (e.g., "Last 7 days")
   **Expect:** Invoice list shows only paid invoices created in the last 7 days (both filters applied simultaneously)
   **Record through:** yes

3. **Action:** Verify URL includes both `status` and `created_date_after`/`created_date_before` query parameters
   **Expect:** URL query string contains all active filter parameters
   **Record through:** yes

4. **Action:** Clear one filter (e.g., clear the date filter)
   **Expect:** Invoice list updates to show all paid invoices (status filter still active, date filter removed)
   **Record through:** yes

### Success looks like

- Multiple filters can be applied simultaneously
- Invoice list respects all active filters (AND logic)
- URL query parameters reflect all active filters
- Clearing one filter maintains the others
- Combined filtering works correctly with status, created_by, and date filters

## Test plan / notes

- Add Playwright E2E test coverage for the date filter functionality
  - Test AC1: Verify "Period" filter option appears in filter menu
  - Test AC2: Select preset date range and verify filtered results
  - Test AC3: Select custom date range and verify filtered results
  - Test AC4: Verify date filter badge appears in selected filters bar
  - Test AC5: Clear date filter and verify all invoices are shown
  - Test AC6: Combine date filter with status and created_by filters
- CI must pass all existing tests
- Verify API requests include correct `created_date_after` and `created_date_before` parameters
- Verify date formatting matches locale settings
- Test date filter state persistence across page navigation
