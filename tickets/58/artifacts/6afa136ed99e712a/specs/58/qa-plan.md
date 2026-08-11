# QA Plan: Date Filter on Invoice List

## AC1 — Date filter appears in filter dropdown

### Research map

- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/billing/invoices`
- components: `src/pages/Facility/billing/invoice/InvoicesData.tsx` (filters array line 68-72)
- i18n labels: "period" (from AccountList pattern), filter button icons
- auth/role: `tests/.auth/facilityAdmin.json` (facility admin has billing access)
- permissions: facility-scoped billing access
- fixtures needed: `getFacilityId()` from setup

### Prerequisites

- Logged in as facility admin
- At least one facility with billing enabled (provided by fixtures)

### Data setup

- Prefer fixtures: `load-fixtures` creates a facility accessible via `getFacilityId()`
- No additional data setup required — the filter UI should be visible regardless of invoice count

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/billing/invoices` (using facilityId from `getFacilityId()`)
   **Expect:** Invoice list page loads with a filter button in the toolbar
   **Record through:** yes

2. **Action:** Click the filter button (funnel/filter icon button)
   **Expect:** Filter dropdown opens showing available filters: "Status", "Period", and "Created By"
   **Record through:** yes

### Success looks like

- Filter dropdown contains three filters: Status, Period (date filter), and Created By
- Period filter appears between Status and Created By filters

## AC2 — Filter by preset date range

### Research map

- components: `src/components/ui/multi-filter/dateFilter.tsx` (date range selector)
- i18n labels: "today", "yesterday", "last_7_days", "last_30_days" (from `longDateRangeOptions`)
- auth/role: `tests/.auth/facilityAdmin.json`
- permissions: facility-scoped
- fixtures needed: `getFacilityId()` from setup

### Prerequisites

- Logged in as facility admin
- At least one invoice exists in the facility (may need to be created via UI if fixtures don't provide)

### Data setup

- Prefer fixtures: If `load-fixtures` provides invoices, use those
- UI recipe (if no invoices exist):
  1. Navigate to `/facility/{facilityId}/billing/account/{accountId}` (using `getAccountId()`)
  2. Create an invoice via the UI (specific steps depend on UI workflow)
  3. Navigate back to `/facility/{facilityId}/billing/invoices`

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/billing/invoices`
   **Expect:** Invoice list page loads
   **Record through:** no

2. **Action:** Click the filter button, then click "Period" filter
   **Expect:** Date range selector opens with preset options: "Today", "Yesterday", "Last 7 days", "Last 30 days", "Custom"
   **Record through:** yes

3. **Action:** Click "Today" preset option
   **Expect:** Filter applies, invoice list refreshes, and badge shows today's date (e.g., "11 Aug 2026")
   **Record through:** yes

4. **Action:** Note the number of invoices displayed
   **Expect:** Only invoices created today are shown
   **Record through:** no

5. **Action:** Click "Period" filter badge, then select "Last 7 days"
   **Expect:** Filter updates, invoice list refreshes, badge shows date range (e.g., "4 Aug - 11 Aug")
   **Record through:** yes

### Success looks like

- Date preset options apply correctly
- Invoice list updates to show only invoices in the selected date range
- Filter badge displays the selected date range

## AC3 — Filter by custom date range

### Research map

- components: `src/components/ui/multi-filter/dateFilter.tsx` (custom date picker)
- auth/role: `tests/.auth/facilityAdmin.json`
- permissions: facility-scoped
- fixtures needed: `getFacilityId()` from setup

### Prerequisites

- Logged in as facility admin
- Multiple invoices exist with different creation dates

### Data setup

- Same as AC2 — ensure invoices exist for testing

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/billing/invoices`
   **Expect:** Invoice list page loads
   **Record through:** no

2. **Action:** Click filter button, then click "Period" filter
   **Expect:** Date range selector opens
   **Record through:** no

3. **Action:** Click "Custom" option
   **Expect:** Custom date picker appears with "From" and "To" date inputs
   **Record through:** yes

4. **Action:** Select a start date (e.g., 1 week ago) in the "From" field and an end date (e.g., today) in the "To" field
   **Expect:** Date picker accepts both dates
   **Record through:** yes

5. **Action:** Click "Apply" or outside the picker to confirm
   **Expect:** Filter applies, invoice list refreshes, badge shows the custom date range (e.g., "4 Aug - 11 Aug")
   **Record through:** yes

### Success looks like

- Custom date picker allows selecting arbitrary date ranges
- Invoice list filters to show only invoices created within the selected range
- Filter badge displays the custom date range

## AC4 — Filter badge displays selected date range

### Research map

- components: `src/components/ui/multi-filter/filterConfigs.tsx` (`SelectedDateBadge`)
- auth/role: `tests/.auth/facilityAdmin.json`
- permissions: facility-scoped
- fixtures needed: `getFacilityId()` from setup

### Prerequisites

- Logged in as facility admin
- Invoice list page loaded

### Data setup

- Same as AC2 — ensure invoices exist

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/billing/invoices` and apply a "Today" date filter
   **Expect:** Filter badge appears showing today's date (e.g., "11 Aug 2026")
   **Record through:** yes

2. **Action:** Apply a custom date range (e.g., "1 Aug 2026" to "7 Aug 2026")
   **Expect:** Filter badge updates to show the range (e.g., "1 Aug - 7 Aug")
   **Record through:** yes

### Success looks like

- Filter badges accurately display the selected date or date range
- Date format is consistent with other date filters in the app (e.g., AccountList)

## AC5 — Date filter persists via query parameters

### Research map

- components: URL query params `created_date_after` and `created_date_before` (from `InvoicesData.tsx` line 137-138)
- auth/role: `tests/.auth/facilityAdmin.json`
- permissions: facility-scoped
- fixtures needed: `getFacilityId()` from setup

### Prerequisites

- Logged in as facility admin
- Invoice list page loaded with date filter applied

### Data setup

- Same as AC2 — ensure invoices exist

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/billing/invoices` and apply a date filter (e.g., "Last 7 days")
   **Expect:** Filter applies, URL updates to include query parameters
   **Record through:** no

2. **Action:** Inspect the URL
   **Expect:** URL contains `created_date_after` and `created_date_before` query parameters (e.g., `?created_date_after=2026-08-04T00:00:00.000Z&created_date_before=2026-08-12T00:00:00.000Z`)
   **Record through:** yes

3. **Action:** Copy the URL and open it in a new browser tab
   **Expect:** Page loads with the date filter already applied, showing the same filtered results
   **Record through:** yes

### Success looks like

- Date filter state is encoded in the URL query parameters
- Opening the URL in a new tab or sharing it preserves the filter

## AC6 — Clear all filters includes date filter

### Research map

- components: `src/components/ui/multi-filter/MultiFilter.tsx` (clear all functionality)
- auth/role: `tests/.auth/facilityAdmin.json`
- permissions: facility-scoped
- fixtures needed: `getFacilityId()` from setup

### Prerequisites

- Logged in as facility admin
- Invoice list page loaded

### Data setup

- Same as AC2 — ensure invoices exist

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/billing/invoices` and apply multiple filters: Status (e.g., "Paid"), Date (e.g., "Last 7 days"), and Created By
   **Expect:** All filters apply, invoice list shows filtered results, multiple filter badges appear
   **Record through:** yes

2. **Action:** Click "Clear all" or "Reset filters" button
   **Expect:** All filter badges disappear, invoice list refreshes to show all invoices (unfiltered)
   **Record through:** yes

3. **Action:** Inspect the URL
   **Expect:** URL no longer contains filter query parameters (`status`, `created_date_after`, `created_date_before`, `created_by` are removed)
   **Record through:** no

### Success looks like

- Clear all removes the date filter along with all other filters
- Invoice list returns to showing all invoices
- URL query parameters are cleared

## AC7 — Single date boundary filters

### Research map

- components: `src/pages/Facility/billing/invoice/InvoicesData.tsx` (date range handling line 95-100)
- auth/role: `tests/.auth/facilityAdmin.json`
- permissions: facility-scoped
- fixtures needed: `getFacilityId()` from setup

### Prerequisites

- Logged in as facility admin
- Multiple invoices exist with different creation dates

### Data setup

- Same as AC2 — ensure invoices with various dates exist

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/billing/invoices`, click filter, select "Period", click "Custom"
   **Expect:** Custom date picker opens
   **Record through:** no

2. **Action:** Set only a "From" date (e.g., 7 days ago) and leave "To" date empty, then apply
   **Expect:** Filter applies, invoice list shows only invoices created on or after the "From" date
   **Record through:** yes

3. **Action:** Clear the filter, then set only a "To" date (e.g., today) and leave "From" date empty, then apply
   **Expect:** Filter applies, invoice list shows only invoices created on or before the "To" date
   **Record through:** yes

### Success looks like

- Start date only: shows invoices from that date forward
- End date only: shows invoices up to and including that date
- Filter badge displays appropriately for single-boundary filters

## Test plan / notes

- **Playwright E2E:** Add test coverage in `tests/facility/billing/` for date filter interactions (preset selection, custom range, URL persistence, clear all)
- **CI:** Linter and formatter must pass (`npm run lint`, `npm run format`)
- **Backend compatibility:** Ensure backend invoice list API accepts `created_date_after` and `created_date_before` query parameters (backend team should verify)
- **Data generation:** Use `faker` for generating test invoice data if needed; avoid hardcoded dates that could cause flaky tests
- **Accessibility:** Verify date picker is keyboard-navigable and screen reader friendly
