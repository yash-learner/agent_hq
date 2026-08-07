# Implementation Tasks: Add date range filter to facility invoice list

## Task 1: Add date range filter to InvoicesData component

**Repository:** yash-learner/care_fe_agent_hq

**Description:**
Add a date/period filter to the facility invoice list that allows filtering invoices by `created_date` range. This mirrors the existing pattern from `AccountList.tsx` using the `dateFilter()` helper and `created_date_after` / `created_date_before` query parameters.

**Changes required:**

1. **File:** `src/pages/Facility/billing/invoice/InvoicesData.tsx`
   
   - **Imports (lines ~1-42):**
     - Add `dateFilter` to the existing import from `@/components/ui/multi-filter/filterConfigs`
     - Import `longDateRangeOptions` and `FilterDateRange` from `@/components/ui/multi-filter/utils/Utils`
     - Import `dateTimeQueryString` from `@/Utils/utils`
   
   - **Filter configuration (lines ~61-64):**
     - Add `dateFilter("created_date", t("period"), longDateRangeOptions, false)` to the `filters` array
     - Insert after existing `invoiceStatusFilter` and `createdByFilter`
   
   - **Query parameter mapping (lines ~66-80 in `onFilterUpdate`):**
     - Add a case to handle the `created_date` key (similar to AccountList lines 123-136)
     - Transform `FilterDateRange` object into `created_date_after` and `created_date_before` query params
     - Use `dateTimeQueryString()` for date formatting:
       - `created_date_after`: `dateTimeQueryString(dateRange?.from as Date)` if from exists
       - `created_date_before`: `dateTimeQueryString(dateRange?.to as Date, true)` if to exists (note the `true` flag for end-of-day)
     - Clear the intermediate `created_date` key after transformation
   
   - **Initial filter state (lines ~82-92 in `useMultiFilterState` call):**
     - Extract `created_date_after` and `created_date_before` from `qParams` before the hook call
     - Initialize `selectedFilters` to include the date range if present in URL params:
       ```typescript
       created_date: created_date_after || created_date_before ? {
         from: created_date_after ? new Date(created_date_after) : undefined,
         to: created_date_before ? new Date(created_date_before) : undefined,
       } : undefined
       ```

2. **File:** `public/locale/en.json`
   - Verify that the key `"period"` exists (used as the date filter label)
   - If missing, add: `"period": "Period"` at the end of the file
   - All other date range strings (`"today"`, `"yesterday"`, `"last_count_days"`, etc.) should already exist

**Estimated size:** ~50 lines changed (imports + filter config + query mapping + initial state)

**Dependencies:** None (first task)

**Acceptance criteria coverage:**
- AC1: Date/period filter visible in filter bar ✓
- AC2: Preset range updates list and URL params ✓
- AC3: Custom from→to range works ✓
- AC4: Clear filter removes date params ✓
- AC5: Date + status + created_by filters combine (AND logic) ✓
- AC6: URL deep-linking with date params ✓
- AC7: Empty range shows empty state ✓

**Testing approach:**
- Manual verification against running app (dev server)
- Follow QA plan steps in spec (preset ranges, custom ranges, clear, combine, reload, empty state)
- No Playwright tests required unless specifically requested (manual QA sufficient for filter addition)

**Notes:**
- Pattern is identical to AccountList.tsx implementation
- No backend changes required (API already supports `created_date_after` and `created_date_before`)
- Keep changes localized to filter configuration and query parameter mapping
- The `dateFilter()` helper, `longDateRangeOptions`, and `dateTimeQueryString()` utilities already exist
- The `useMultiFilterState` hook already handles filter state management

---

## Summary

This is a **single-task ticket** that touches only the frontend repository. The implementation is straightforward and follows established patterns from AccountList.tsx.

**Total tasks:** 1  
**Total estimated lines changed:** ~50  
**Repositories touched:** yash-learner/care_fe_agent_hq (frontend only)

**Acceptance criteria coverage verification:**
- ✅ AC1: Filter UI present
- ✅ AC2: Preset range functionality
- ✅ AC3: Custom range functionality
- ✅ AC4: Clear filter functionality
- ✅ AC5: Filter combination (AND logic)
- ✅ AC6: URL persistence and deep-linking
- ✅ AC7: Empty state handling

All acceptance criteria are covered by Task 1.
