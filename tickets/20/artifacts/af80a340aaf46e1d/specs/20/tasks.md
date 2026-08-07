# Implementation Tasks: Support Multiple Diagnostic Reports per Service Request

## Overview

This ticket is frontend-only work in the `care_fe` repository. All changes touch React components that manage diagnostic report creation from Service Requests. The implementation enables users to create multiple diagnostic reports from a single Service Request, one per diagnostic report code defined on the Activity Definition.

---

## Task 1: Filter available diagnostic report codes and reset state after creation

**Repository:** yash-learner/care_fe_agent_hq

**Scope:** Modify `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx` to:
1. Calculate which diagnostic report codes are still available (not used by existing reports)
2. Update the codes dropdown to show only available codes
3. Reset the selected code state after successful report creation

**Changes:**

1. **Calculate available codes** (add before line 1242):
   ```typescript
   const usedCodes = new Set(
     diagnosticReports
       .map(report => report.code?.code)
       .filter(Boolean)
   );
   
   const availableCodes = activityDefinition?.diagnostic_report_codes?.filter(
     code => !usedCodes.has(code.code)
   ) || [];
   ```

2. **Update dropdown to use availableCodes** (lines 1242-1276):
   - Change condition from `activityDefinition?.diagnostic_report_codes && activityDefinition.diagnostic_report_codes.length > 0` to `availableCodes.length > 0`
   - Update line 1249's find to search in `availableCodes` instead of `activityDefinition.diagnostic_report_codes`
   - Update line 1262's map to iterate over `availableCodes` instead of `activityDefinition.diagnostic_report_codes`

3. **Reset state after creation** (lines 183-192):
   - Add `setSelectedReportCode(null);` after the success toast and before query invalidation

**Dependencies:** None (first task)

**Acceptance Criteria Coverage:**
- **AC1:** All codes available initially — satisfied by returning all codes when `diagnosticReports` is empty
- **AC2:** Code removed after creation — satisfied by filtering used codes
- **AC3:** No reload required — satisfied by resetting `selectedReportCode` and invalidating cache
- **AC6:** N reports for N codes — satisfied by allowing creation for each available code
- **AC7:** Only unused codes after reload — satisfied by filtering logic on every render

**Size estimate:** ~30 lines changed

---

## Task 2: Show form only when unused diagnostic report codes remain

**Repository:** yash-learner/care_fe_agent_hq

**Scope:** Modify `src/pages/Facility/services/serviceRequests/ServiceRequestShow.tsx` to conditionally display the diagnostic report creation form based on whether unused codes remain.

**Changes:**

1. **Add unused codes check** (before line 599):
   ```typescript
   const hasUnusedCodes = (() => {
     if (!activityDefinition?.diagnostic_report_codes?.length) {
       return true; // No codes defined, allow report creation
     }
     const usedCodes = new Set(
       diagnosticReports.map(r => r.code?.code).filter(Boolean)
     );
     return activityDefinition.diagnostic_report_codes.some(
       c => !usedCodes.has(c.code)
     );
   })();
   ```

2. **Update form visibility condition** (lines 599-601):
   Replace the existing condition with:
   ```typescript
   {(hasUnusedCodes &&
     (!diagnosticReports.length ||
       diagnosticReports[0]?.status !==
         DiagnosticReportStatus.final)) && (
   ```

**Dependencies:** None (independent of Task 1, but should be implemented after for logical flow)

**Acceptance Criteria Coverage:**
- **AC4:** Form hidden when all codes used — satisfied by `hasUnusedCodes` check
- **AC5:** Persistence across reload — satisfied by backend-driven `diagnosticReports` array being rechecked on render

**Size estimate:** ~15 lines changed

---

## Task 3: Create Playwright QA setup for multiple diagnostic reports

**Repository:** yash-learner/care_fe_agent_hq

**Scope:** Create a Playwright setup script to seed test data with an Activity Definition containing multiple diagnostic report codes and a Service Request using that AD.

**Changes:**

1. Create `tests/setup/multipleDiagnosticReports.setup.ts` following the pattern in the ticket's QA data setup section:
   - Use valueset expansion API to obtain valid codes (not hardcoded LOINC)
   - Create Activity Definition with 3+ diagnostic report codes
   - Use `apply_activity_definition/` to create Service Request
   - Save seed data to `.agent-hq/multiple-diagnostic-seed.json`

2. Add test configuration if needed in `playwright.config.ts` (optional, may not be required)

**Dependencies:** Tasks 1 and 2 must be complete for the QA script to verify correct behavior

**Acceptance Criteria Coverage:**
- Enables verification of all acceptance criteria (AC1-AC7) through E2E testing
- Provides reproducible test data setup

**Size estimate:** ~100 lines (new file)

---

## Task 4: Create Playwright E2E tests for multiple diagnostic reports

**Repository:** yash-learner/care_fe_agent_hq

**Scope:** Create comprehensive E2E tests that verify the multiple diagnostic reports functionality end-to-end.

**Changes:**

1. Create test file (e.g., `tests/facility/multipleDiagnosticReports.spec.ts`) that:
   - Runs the setup from Task 3 to seed data
   - Opens the Service Request detail page
   - Verifies all codes appear in dropdown initially (AC1)
   - Creates first diagnostic report (AC2)
   - Verifies dropdown updates without reload (AC3)
   - Creates additional reports one by one (AC6)
   - Verifies form hides after all codes used (AC4)
   - Reloads page and verifies state persists (AC5, AC7)

2. Use faker for unique identifiers to avoid test collisions
3. Follow `tests/PLAYWRIGHT_GUIDE.md` patterns for selectors and assertions

**Dependencies:** Requires Task 3 (setup script) to run first

**Acceptance Criteria Coverage:**
- **All ACs (1-7):** Comprehensive E2E verification of the entire feature

**Size estimate:** ~150-200 lines (new file)

---

## Summary

**Total tasks:** 4 (all in care_fe repository)

**Coverage verification:**
- AC1 ✓ Task 1
- AC2 ✓ Task 1
- AC3 ✓ Task 1
- AC4 ✓ Task 2
- AC5 ✓ Task 2
- AC6 ✓ Task 1
- AC7 ✓ Task 1
- E2E testing ✓ Tasks 3 & 4

**Estimated total changes:** ~300-350 lines (well under 400-line limit per task)

**Repository breakdown:**
- `yash-learner/care_fe_agent_hq`: All 4 tasks

All acceptance criteria are covered. Tasks 1 and 2 implement the core functionality, while Tasks 3 and 4 provide automated QA verification.
