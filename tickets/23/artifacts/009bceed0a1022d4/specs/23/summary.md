# Summary: Support Multiple Diagnostic Reports per Service Request

The frontend now allows creating multiple diagnostic reports from a Service Request whose Activity Definition defines multiple diagnostic report codes. Previously, only one diagnostic report could be created even when the Activity Definition specified multiple codes.

## What Was Done

- Modified `DiagnosticReportForm.tsx` to filter diagnostic report codes, showing only codes not yet used by existing reports
- Implemented real-time dropdown updates that remove used codes after each report creation without requiring page reload
- Added logic to hide the dropdown and disable report creation when all Activity Definition codes have been used
- Maintained backward compatibility for Activity Definitions with no diagnostic report codes defined

## Acceptance Criteria Status

All 7 acceptance criteria passed with live-flow video verification:

1. ✅ All AD codes available in dropdown when no reports exist
2. ✅ Only unused codes shown after creating one report
3. ✅ Report creation removes code from dropdown without reload
4. ✅ No dropdown shown when all AD codes exhausted
5. ✅ One code remains available after creating first of two
6. ✅ State persists correctly after page reload
7. ✅ Single-report behavior unchanged for no-code Activity Definitions

## Review Outcome

**Final Status:** Clean (Round 3)

One blocker identified and fixed in Round 1: button disable logic incorrectly blocked report creation for Activity Definitions with no diagnostic report codes (AC7 regression). Fix applied in commit `6638eaf59`.

Round 2 identified missing API-based QA setup approach; corrected in qa-plan.md before verification.

## Commits

- `fd2655593` feat: support multiple diagnostic reports per service request
- `6638eaf59` fix: allow report creation for ADs without diagnostic codes
