# Implementation Plan: Add date range filter to facility invoice list

## Overview

Add a date/period filter to the facility invoice list (`InvoicesData.tsx`) that allows billing clerks to filter invoices by `created_date` range. This mirrors the existing pattern from `AccountList.tsx` using the `dateFilter()` helper and `created_date_after` / `created_date_before` query parameters.

## Classification

**CRUD** — This is a straightforward UI enhancement that adds filtering capability to an existing list view. No data model changes, migrations, services, authorization changes, or clinical-safety impacts.

## Repositories touched

- **yash-learner/care_fe_agent_hq** (frontend only)

## Implementation approach

### 1. Add date filter to InvoicesData component

**File:** `src/pages/Facility/billing/invoice/InvoicesData.tsx`

- **Import additions:**
  - Add `dateFilter` to existing import from `@/components/ui/multi-filter/filterConfigs`
  - Add `longDateRangeOptions` and `FilterDateRange` from `@/components/ui/multi-filter/utils/Utils`
  - Add `dateTimeQueryString` from `@/Utils/utils`

- **Filter configuration (lines 61-64):**
  - Add `dateFilter("created_date", t("period"), longDateRangeOptions, false)` to the existing `filters` array
  - Existing filters: `invoiceStatusFilter("status")`, `createdByFilter("created_by")`

- **Query parameter mapping (lines 66-80):**
  - Extend the `onFilterUpdate` function to handle `created_date` key similar to AccountList (lines 123-136)
  - Transform `FilterDateRange` into `created_date_after` and `created_date_before` query params using `dateTimeQueryString()`
  - Clear the intermediate `created_date` key after transformation

- **Initial filter state (lines 82-92):**
  - Extract `created_date_after` and `created_date_before` from `qParams` (similar to AccountList line 108)
  - Initialize `selectedFilters` to include the date range if present in URL params

### 2. Internationalization

**File:** `public/locale/en.json`

- Add `"period"` key if not already present (used as the date filter label)
- All other date range strings (`"today"`, `"last_7_days"`, etc.) should already exist from `longDateRangeOptions`

### 3. Testing considerations

- **Manual verification:**
  - Filter UI renders correctly
  - Preset ranges update the list and URL params
  - Custom from→to ranges work
  - Clear filter removes date params
  - Date + status + created_by filters combine correctly (AND logic)
  - URL deep-linking with date params works
  - Empty result range shows empty state without errors

- **Playwright tests (if needed):**
  - Add test coverage in `tests/facility/` that exercises the date filter interactions
  - Follow patterns from existing invoice list tests
  - Verify URL param persistence and filter combination

## API verification

The backend API (`/api/v1/facility/{facilityId}/invoice/`) accepts query parameters including `created_date_after` and `created_date_before` (standard Django filter pattern). No backend changes required.

The `invoiceApi.listInvoice` endpoint:
- Path: `/api/v1/facility/{facilityId}/invoice/`
- Method: GET
- Default ordering: `-created_date`
- Supports standard query params for filtering (status, account, created_by, created_date_after, created_date_before)

## Dependencies

No new dependencies required. All necessary utilities already exist:
- `dateFilter()` helper from `filterConfigs.tsx`
- `longDateRangeOptions` from `Utils.tsx`
- `dateTimeQueryString()` from `utils.ts`
- `useMultiFilterState` hook already in use

## Risks and considerations

- **API parameter support:** Assuming the backend invoice list endpoint accepts `created_date_after` and `created_date_before` following standard Django filter conventions. If not, backend changes would be required (blocked until verified).
- **Timezone handling:** `dateTimeQueryString()` handles timezone conversion consistently with other date filters in the app.
- **Performance:** Date filtering is handled server-side; no client-side performance impact.
- **Backward compatibility:** Adding optional query params does not break existing functionality or bookmarked URLs.

## Success criteria

1. Date/period filter visible in invoice list filter bar
2. Preset and custom date ranges filter invoices correctly
3. URL params (`created_date_after`, `created_date_before`) reflect filter state
4. Deep-linking with date params works
5. Filter clears correctly
6. Combines with existing filters (AND logic)
7. Empty results show appropriate empty state
8. All user-facing strings use i18next
9. No console errors or warnings
