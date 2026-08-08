# Specification: Add date range filter to facility invoice list

## Problem statement

The facility invoice list currently supports filtering by status and created-by only, making it difficult for billing clerks in high-volume facilities to narrow invoices to a specific created-date range (e.g., "this week", "last month"). The account list already implements period/date filtering with `created_date_after` / `created_date_before` query parameters. This inconsistency creates workflow friction for billing staff who need to answer "show invoices created between X and Y".

## Acceptance criteria

1. Given the user is on the facility invoice list page, when the filter bar renders, then a date/period filter control is visible alongside the existing status and created-by filters.
2. Given the date filter is open, when the user selects a preset range (e.g., "last 7 days"), then the invoice list updates to show only invoices whose `created_date` falls within that range and the URL contains `created_date_after` and `created_date_before` query parameters.
3. Given the date filter is open, when the user selects a custom from→to range, then the invoice list updates accordingly and both date query parameters are set in the URL.
4. Given a date filter is active, when the user clears the date filter, then both `created_date_after` and `created_date_before` are removed from the URL and the list shows invoices without date restriction.
5. Given date, status, and created-by filters are all set, when the list refreshes, then only invoices matching all three constraints are displayed (AND logic).
6. Given a URL with `created_date_after` and/or `created_date_before` parameters, when the page loads, then the date filter control reflects the URL state and the list displays filtered results.
7. Given a date range with no matching invoices, when the list loads, then the existing empty state is shown without console errors.

## Capability notes

- `src/pages/Facility/billing/invoice/InvoicesData.tsx:61-64` — existing filters array, add `dateFilter("created_date", ...)` here
- `src/pages/Facility/billing/account/AccountList.tsx:112` — reference implementation using `dateFilter("created_date", t("period"), longDateRangeOptions, false)`
- `src/components/ui/multi-filter/filterConfigs.tsx:183-209` — `dateFilter()` factory function; accepts key, label, preset options, and disableClear flag
- `src/components/ui/multi-filter/utils/Utils.tsx` — exports `longDateRangeOptions` and `FilterDateRange` type
- `src/Utils/utils.ts` — `dateTimeQueryString()` helper (used in AccountList at line 130-134 for query param mapping)

## Open questions

None.
