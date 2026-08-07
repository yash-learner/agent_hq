# Summary: Support for creating multiple diagnostic reports for SR

## Implementation Outcome

Successfully implemented support for creating multiple diagnostic reports per Service Request in the frontend. The implementation allows users to create one diagnostic report for each diagnostic report code defined in the Service Request's Activity Definition.

## Changes Made

Modified `DiagnosticReportForm.tsx` to enable sequential creation of multiple diagnostic reports:

- **Code filtering**: Calculate remaining unused diagnostic report codes by filtering out codes already used in existing reports
- **Sequential creation**: Removed the `hasReport` check to allow creating additional reports after the first one
- **Dynamic dropdown**: Updated the type dropdown to only show remaining unused codes from the Activity Definition
- **Disabled state**: Disable the create button and dropdown when all codes have been used, showing "All codes used" placeholder
- **Reset selection**: Clear selected code after successful report creation to allow selecting the next code
- **Auto-selection removal**: Removed effects that auto-selected latest report code, allowing manual selection for each new report

Added i18n key `all_codes_used` for the exhausted state message.

## Acceptance Criteria Status

All acceptance criteria are **implemented** in the code:

✅ **AC1**: From an SR whose AD has N diagnostic report codes, the user can create up to N diagnostic reports, one per code  
✅ **AC2**: The codes dropdown offers a remaining (not-yet-used) code for each new report  
✅ **AC3**: Reports can be created one after another without a reload, and already-used codes are no longer offered

## QA Status

**QA Verdict**: All criteria NOT EXERCISED due to missing test data

The QA process could not fully exercise the feature because the test environment lacks:
- Activity Definitions with multiple diagnostic report codes configured
- Service Requests using these multi-code Activity Definitions
- Available specimens required for diagnostic report creation

**Code inspection confirms** the implementation correctly handles:
- Filtering used codes from the dropdown
- Disabling UI when all codes are used
- Reactive UI updates without page reload
- Proper type safety across EMR types

## Review Status

**Round 1**: Clean — no findings

The implementation passed code review with no issues identified.

## Files Changed

- `public/locale/en.json` — Added `all_codes_used` i18n key
- `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx` — Core implementation

**Diff**: +58 lines, -47 lines across 2 files

## Recommendations

To enable full QA testing in the future:
1. Enhance fixtures with Activity Definitions that have multiple diagnostic report codes
2. Add Service Request fixtures using these multi-code Activity Definitions
3. Ensure specimens are in "available" status in fixtures
4. Consider adding automated Playwright tests with proper data seeding
