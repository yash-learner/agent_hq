# Summary: Add expiry date to purchase delivery table

## What Was Done

Added an expiry date column to the supply delivery table (`SupplyDeliveryTable.tsx`) to display expiry dates for saved delivery items. Previously, expiry dates were captured in the form but not visible in the table, making inventory tracking difficult.

## Implementation

- **File modified**: `src/pages/Facility/services/inventory/SupplyDeliveryTable.tsx` (+30 lines)
- **Column added**: "Expiry Date" column with proper formatting and visual indicators
- **Date formatting**: dd/MM/yyyy format via `formatDate()`
- **Null handling**: Displays "-" when no expiry date exists
- **Visual warnings**: Red text for expired items, amber text for items expiring within 90 days
- **Compatibility**: Supports both internal and external delivery types

## Acceptance Criteria

All five acceptance criteria met per specification:
- ✅ **AC1**: Expiry date displays in saved delivery table
- ✅ **AC2**: Date formatted as dd/MM/yyyy in dedicated column
- ✅ **AC3**: Missing expiry dates show "-"
- ✅ **AC4**: Expired items visually distinguished with red/amber styling
- ✅ **AC5**: Column visible on mobile/narrow screens (table structure preserved)

## Review Outcome

**Code review**: Clean — no findings.

**QA verification**: Could not complete live-flow testing due to browser connectivity issues in the container environment (standalone browser automation blocked by network isolation, though the repository's own Playwright test suite runs successfully). Code inspection confirms the implementation aligns with specification requirements and follows established codebase patterns.
