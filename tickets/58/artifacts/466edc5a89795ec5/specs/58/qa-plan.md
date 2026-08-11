# QA Plan: Date Filter on Invoice List

## AC1 — Date filter option visible alongside existing filters

### Research map

- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/billing/invoices`
- components: `src/pages/Facility/billing/invoice/InvoicesData.tsx` (filter configuration at line 68-72)
- i18n labels: "period", "filter", "invoices"
- auth/role: `tests/.auth/user.json`
- permissions / facility-scoped: yes (facility-scoped)
- fixtures needed: seeded facility (from load-fixtures)

### Prerequisites

- Facility context active
- User authenticated with billing permissions

### Data setup

- Prefer fixtures: `load-fixtures` provides a facility (accessible via `getFacilityId()`). No additional data needed for AC1 — this tests filter UI visibility only.

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/billing/invoices` by clicking Billing → Invoices in the sidebar
   **Expect:** Invoice list page loads with a "Filter" button visible
   **Record through:** yes

2. **Action:** Click the "Filter" button
   **Expect:** Filter menu opens showing available filter options
   **Record through:** yes

3. **Action:** Verify "Period" filter option is visible alongside "Status" and "Created By" filters
   **Expect:** "Period" filter option is displayed in the filter menu
   **Record through:** yes

### Success looks like

- Filter menu displays "Period" option alongside existing "Status" and "Created By" filters

## AC2 — Filter by preset date options

### Research map

- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/billing/invoices`
- components: `src/pages/Facility/billing/invoice/InvoicesData.tsx`, `src/components/ui/multi-filter/filterConfigs.tsx` (dateFilter function line 183-209)
- i18n labels: "period", "today", "yesterday", "last 7 days"
- auth/role: `tests/.auth/user.json`
- permissions / facility-scoped: yes
- fixtures needed: seeded facility + at least one invoice created today

### Prerequisites

- Facility context active
- At least one invoice exists that was created today

### Data setup

- Prefer fixtures: `load-fixtures` provides a facility and may include patient data
- If no invoice exists from today, create via UI:
  1. Navigate to `/facility/{facilityId}/billing/account`
  2. Click "Create Account" (if needed), fill in: name `qa-account-58-${Date.now()}`, select patient, service period (today), status "active", billing status "pending"
  3. Save account, note account ID from URL
  4. Navigate to `/facility/{facilityId}/billing/account/{accountId}`
  5. Click "Create Invoice" button
  6. Confirm invoice creation (will be in "draft" status)
  7. Note invoice number displayed
- Or via API seed (if UI path fails):
  - POST `/api/v1/facility/{facilityId}/account/`
    (path from `src/types/billing/account/accountApi.ts`)
  - Auth: `getApiUrl()` + `getApiHeaders()` from `tests/helper/utils.ts` + `tests/.auth/user.json`
  - Body: `{"name": "qa-account-58-{timestamp}", "status": "active", "billing_status": "pending", "patient": "{patientId from getPatientId()}", "service_period": {"start": new Date().toISOString()}}`
  - Then POST `/api/v1/facility/{facilityId}/invoice/`
    (path from `src/types/billing/invoice/invoiceApi.ts`)
  - Body: `{"account": "{accountId}", "status": "draft"}`
- Verify: Navigate to `/facility/{facilityId}/billing/invoices` and confirm the invoice appears in the list before proceeding

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/billing/invoices`
   **Expect:** Invoice list page loads showing invoices
   **Record through:** yes

2. **Action:** Click the "Filter" button, then click "Period"
   **Expect:** Date filter options menu opens showing preset options (Today, Yesterday, Last 7 days, etc.)
   **Record through:** yes

3. **Action:** Select "Today" from the options
   **Expect:** Invoice list refreshes to show only invoices created today, and a date filter badge appears
   **Record through:** yes

4. **Action:** Verify the invoice created today is visible in the list
   **Expect:** Invoice with today's date is displayed in the invoice list
   **Record through:** yes

### Success looks like

- Invoice list shows only invoices created today after applying "Today" filter
- Filter badge displays the selected date range (e.g., "15 Jan 2026")
- URL contains `created_date_after` query parameter

## AC3 — Filter by custom date range

### Research map

- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/billing/invoices`
- components: `src/pages/Facility/billing/invoice/InvoicesData.tsx`, date picker component
- i18n labels: "period", "custom"
- auth/role: `tests/.auth/user.json`
- permissions / facility-scoped: yes
- fixtures needed: seeded facility + invoices with different creation dates

### Prerequisites

- Facility context active
- Invoices exist from different dates (ideally at least 2 invoices from different days)

### Data setup

- Prefer fixtures: Use existing invoices from fixtures
- If insufficient data, follow AC2 data setup to create invoices, then wait or manually create invoices with different dates via API
- For testing purposes, invoices created on the same day are acceptable — the test verifies the custom date range UI works

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/billing/invoices`
   **Expect:** Invoice list page loads
   **Record through:** yes

2. **Action:** Click "Filter" button, then click "Period"
   **Expect:** Date filter options menu opens
   **Record through:** yes

3. **Action:** Select "Custom" from the options
   **Expect:** Date picker opens allowing selection of from and to dates
   **Record through:** yes

4. **Action:** Select today's date for "from" and today's date for "to" (or a range of your choice)
   **Expect:** Date selection is accepted
   **Record through:** yes

5. **Action:** Click "Apply" or similar button to apply the custom date range
   **Expect:** Invoice list refreshes showing only invoices within the selected date range
   **Record through:** yes

6. **Action:** Verify the URL contains both `created_date_after` and `created_date_before` query parameters
   **Expect:** URL shows both date parameters
   **Record through:** yes

### Success looks like

- Date picker allows custom from/to date selection
- Invoice list filters to selected date range
- URL contains both `created_date_after` and `created_date_before` parameters
- Filter badge displays the selected date range (e.g., "15 Jan - 20 Jan")

## AC4 — Filter badge displays selected date range

### Research map

- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/billing/invoices`
- components: `src/pages/Facility/billing/invoice/InvoicesData.tsx`, `src/components/ui/multi-filter/MultiFilter.tsx`
- i18n labels: "period"
- auth/role: `tests/.auth/user.json`
- permissions / facility-scoped: yes
- fixtures needed: seeded facility

### Prerequisites

- Facility context active

### Data setup

- Prefer fixtures: No additional data needed — this tests badge display

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/billing/invoices`
   **Expect:** Invoice list page loads
   **Record through:** yes

2. **Action:** Apply a date filter (e.g., select "Today" via Filter → Period → Today)
   **Expect:** Invoice list refreshes with filter applied
   **Record through:** yes

3. **Action:** Observe the filter badge area (typically near the filter button or above the table)
   **Expect:** A filter badge is displayed showing the selected date (e.g., "15 Jan 2026" for single day or "15 Jan - 20 Jan" for range)
   **Record through:** yes

4. **Action:** Apply a custom date range (Filter → Period → Custom, select from/to dates)
   **Expect:** Filter badge updates to show the date range (e.g., "15 Jan - 20 Jan")
   **Record through:** yes

### Success looks like

- Filter badge clearly displays the selected date or date range
- Badge format matches the expected pattern (e.g., "15 Jan 2026" or "15 Jan - 20 Jan")

## AC5 — Date filter persists via query parameters

### Research map

- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/billing/invoices`
- components: `src/pages/Facility/billing/invoice/InvoicesData.tsx` (qParams handling line 61-64, 66, 113-119)
- auth/role: `tests/.auth/user.json`
- permissions / facility-scoped: yes
- fixtures needed: seeded facility

### Prerequisites

- Facility context active

### Data setup

- Prefer fixtures: No additional data needed — this tests URL persistence

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/billing/invoices`
   **Expect:** Invoice list page loads
   **Record through:** yes

2. **Action:** Apply a date filter (e.g., Filter → Period → Today)
   **Expect:** URL updates to include `created_date_after` and/or `created_date_before` query parameters
   **Record through:** yes

3. **Action:** Copy the current page URL from the browser address bar
   **Expect:** URL is copied successfully
   **Record through:** no

4. **Action:** Open the copied URL in a new browser tab (or navigate away and back using the URL)
   **Expect:** Invoice list page loads with the date filter already applied
   **Record through:** yes

5. **Action:** Verify the filter badge still displays the date filter and the invoice list shows filtered results
   **Expect:** Date filter is preserved, badge is visible, filtered results are shown
   **Record through:** yes

### Success looks like

- URL contains `created_date_after` and `created_date_before` query parameters when date filter is applied
- Opening the URL in a new tab restores the exact same filtered state
- Filter badge and filtered results match the original selection

## AC6 — Clear all filters removes date filter

### Research map

- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/billing/invoices`
- components: `src/pages/Facility/billing/invoice/InvoicesData.tsx`, `src/components/ui/multi-filter/MultiFilter.tsx` (clear all functionality)
- i18n labels: "clear all", "clear filters"
- auth/role: `tests/.auth/user.json`
- permissions / facility-scoped: yes
- fixtures needed: seeded facility

### Prerequisites

- Facility context active

### Data setup

- Prefer fixtures: No additional data needed — this tests filter clearing

### Steps

1. **Action:** Navigate to `/facility/{facilityId}/billing/invoices`
   **Expect:** Invoice list page loads
   **Record through:** yes

2. **Action:** Apply multiple filters: date filter (e.g., Today) and status filter (e.g., Draft)
   **Expect:** Invoice list shows filtered results, filter badges appear, URL contains `created_date_after` and `status` parameters
   **Record through:** yes

3. **Action:** Click the "Clear all" or "Clear filters" button
   **Expect:** All filter badges disappear, URL parameters are removed, invoice list shows all invoices
   **Record through:** yes

4. **Action:** Verify the URL no longer contains `created_date_after` or `created_date_before` parameters
   **Expect:** URL is clean without date filter parameters
   **Record through:** yes

5. **Action:** Verify all invoices (not just filtered ones) are now visible in the list
   **Expect:** Full unfiltered invoice list is displayed
   **Record through:** yes

### Success looks like

- "Clear all" button removes all filters including the date filter
- URL is cleared of all filter query parameters
- Invoice list shows all invoices without any filters applied

## AC7 — Filter with only start date or only end date

### Research map

- routes: `src/Routers/routes/FacilityRoutes.tsx` → `/facility/:facilityId/billing/invoices`
- components: `src/pages/Facility/billing/invoice/InvoicesData.tsx` (handles partial date ranges)
- auth/role: `tests/.auth/user.json`
- permissions / facility-scoped: yes
- fixtures needed: seeded facility + invoices

### Prerequisites

- Facility context active
- Invoices exist

### Data setup

- Prefer fixtures: Use existing invoices from fixtures
- If no invoices exist, follow AC2 data setup to create at least one invoice

### Steps (Start date only)

1. **Action:** Navigate directly to `/facility/{facilityId}/billing/invoices?created_date_after={today's date in ISO format}`
   **Expect:** Invoice list page loads showing invoices created on or after today
   **Record through:** yes

2. **Action:** Verify invoices created today are visible
   **Expect:** Today's invoices are shown
   **Record through:** yes

3. **Action:** Verify the URL contains only `created_date_after` parameter (no `created_date_before`)
   **Expect:** URL shows only the start date parameter
   **Record through:** yes

### Steps (End date only)

4. **Action:** Navigate to `/facility/{facilityId}/billing/invoices?created_date_before={tomorrow's date in ISO format}`
   **Expect:** Invoice list page loads showing invoices created on or before tomorrow (including today)
   **Record through:** yes

5. **Action:** Verify invoices created today are visible
   **Expect:** Today's invoices are shown
   **Record through:** yes

6. **Action:** Verify the URL contains only `created_date_before` parameter (no `created_date_after`)
   **Expect:** URL shows only the end date parameter
   **Record through:** yes

### Success looks like

- Start date only: Shows invoices created on or after the specified date
- End date only: Shows invoices created on or before the specified date
- Both partial date ranges work correctly and display appropriate results

## Test plan / notes

- **Playwright E2E coverage:** `tests/facility/billing/invoiceFilters.spec.ts` includes tests for all acceptance criteria:
  - Filtering by preset date options (Today)
  - Custom date range selection
  - Query parameter persistence
  - Clear all filters
  - Start date only and end date only filters
  - Combination with other filters (status)
- **CI expectations:** All tests should pass in the Playwright suite. Build and lint must pass.
- **Implementation note:** The date filter implementation already exists in `InvoicesData.tsx` — this QA plan verifies it works correctly per the spec.
