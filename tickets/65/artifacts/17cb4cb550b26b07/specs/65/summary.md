# Summary: Add expiry date to purchase delivery table

## What Was Done

Added an expiry date column to the supply delivery table (`SupplyDeliveryTable.tsx`) that displays the expiration date of delivered inventory items. The column appears after the "Batch" column and shows dates in dd/MM/yyyy format, or "-" when no expiry date is present.

## Acceptance Criteria

- ✅ **AC1**: Expiry date displays in dedicated column after batch column
- ✅ **AC2**: Empty expiry date shows "-" 
- ✅ **AC3**: Expiry dates display in dd/MM/yyyy format
- ✅ **AC4**: Expiry date column appears in print view (already existed, no changes needed)

## Review & QA Outcome

**Code Review**: Clean — no findings. Implementation correctly adds the expiry date column with proper formatting, null handling, and i18n support.

**QA Status**: Not exercised in live UI due to headless browser dialog interaction limitations. However, code inspection confirmed all acceptance criteria are correctly implemented:
- Column positioning and header verified
- Date formatting using standard `formatDate()` utility
- Null fallback to "-" implemented
- Print view (`PrintDeliveryOrder.tsx`) already included expiry date column

## Changes Made

**File**: `src/pages/Facility/services/inventory/SupplyDeliveryTable.tsx`
- Line 193: Added `<TableHead>` for "expiry_date" column
- Lines 290-298: Added `<TableCell>` with expiry date rendering logic
  - Safe property access via optional chaining
  - dd/MM/yyyy format via `formatDate()` helper
  - "-" fallback for missing values

**i18n**: "expiry_date" key already exists in locale files

The implementation is complete, follows codebase patterns, and is ready for human review.
