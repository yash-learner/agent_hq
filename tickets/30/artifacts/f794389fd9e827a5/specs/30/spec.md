# Spec: Date filter on invoice list

## Problem Statement

The invoice list in billing currently supports filtering by status and creator but lacks date filtering. Accounts already have a date/period filter for temporal queries. Users need the same filtering capability on invoices to search by creation date or date range, enabling workflows like "show invoices from last week" or "invoices between March 1-15."

## Acceptance Criteria

1. Given I am on the invoice list page, when I open the filter menu, then I see a "Period" date filter option alongside existing status and creator filters.
2. Given I select a preset date range (e.g., "Last 7 days"), when the filter is applied, then only invoices created within that range are displayed.
3. Given I select a custom date range with start and end dates, when I apply the filter, then the list shows invoices created between those dates inclusive.
4. Given I have applied a date filter, when I view the selected filters bar, then the date range is displayed as a badge (e.g., "Jan 1 - Jan 7").
5. Given I clear the date filter, when the filter is removed, then all invoices (subject to other filters) are displayed again.
6. Given I combine date filtering with status and creator filters, when all are applied, then the invoice list respects all filter criteria simultaneously.

## Capability Notes

- `src/pages/Facility/billing/invoice/InvoicesData.tsx` -- invoice list component, currently filters by status and created_by (lines 61-64); needs date filter added to filters array and query handling
- `src/pages/Facility/billing/account/AccountList.tsx` -- account list with existing date filter implementation (line 112: `dateFilter("created_date", t("period"), longDateRangeOptions, false)`) serving as reference pattern
- `src/components/ui/multi-filter/filterConfigs.tsx` -- exports `dateFilter` config function (line 183) that creates the filter UI component with preset and custom date ranges
- `src/components/ui/multi-filter/utils/Utils.tsx` -- exports `longDateRangeOptions` (line 291) for preset ranges like "Last 7 days", "Last month", etc.
- `src/Utils/utils.ts` -- exports `dateTimeQueryString` function (line 86) that converts Date objects to API-compatible ISO strings for created_date_after/created_date_before query params

## Open Questions

None.
