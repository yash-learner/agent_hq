# Spec: Date Filter on Invoice List

## Problem Statement

The invoice list in the billing module currently supports filtering by status and creator but lacks date-based filtering. This makes it difficult for users to view invoices created within a specific time period. The accounts list already has a working date filter implementation that should be replicated for invoices to provide consistent filtering capabilities.

## Acceptance Criteria

1. Given a user is on the facility invoice list page, when they click the filter button, then they should see a "date" or "period" filter option alongside existing status and created_by filters.
2. Given a user selects the date filter, when they choose a preset option (today, yesterday, last 7 days, etc.), then the invoice list should refresh to show only invoices created within that date range.
3. Given a user selects the date filter, when they choose a custom date range with from and to dates, then the invoice list should show only invoices created between those dates (inclusive).
4. Given a user has applied a date filter, when they view the filter badges, then they should see the selected date range displayed (e.g., "15 Jan 2026" or "15 Jan - 20 Jan").
5. Given a user applies a date filter, when the page URL is copied and opened in a new tab, then the date filter should persist via query parameters (created_date_after, created_date_before).
6. Given a user has applied multiple filters including date, when they clear all filters, then the date filter should also be cleared and all invoices should be displayed.
7. Given a user applies a date filter with only a start date, when viewing results, then invoices created on or after that date should be shown; similarly, only an end date should show invoices on or before that date.

## Capability Notes

- `src/pages/Facility/billing/invoice/InvoicesData.tsx:61-64` — Current filters array (status, created_by); date filter needs to be added here.
- `src/pages/Facility/billing/account/AccountList.tsx:108-115` — Reference implementation showing date filter with `created_date_after`/`created_date_before` pattern.
- `src/components/ui/multi-filter/filterConfigs.tsx:183-209` — `dateFilter` function exists and accepts key, label, `longDateRangeOptions`, and disableClear params.
- `src/Utils/utils.ts:86-95` — `dateTimeQueryString` utility exists for converting Date objects to ISO string query params.
- `src/types/billing/invoice/invoiceApi.ts:10-18` — Invoice list API route exists; query params need to include `created_date_after` and `created_date_before`.

## Open Questions

None.
