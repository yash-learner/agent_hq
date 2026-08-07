# Implementation Tasks: Support for creating multiple diagnostic reports for SR

## Task 1: Refactor DiagnosticReportForm for multi-report support

**Repository:** yash-learner/care_fe_agent_hq

**Scope:**
- Refactor state management in `DiagnosticReportForm.tsx` to support multiple reports
- Add `activeReportId` state to track which report is currently being viewed/edited
- Replace all `latestReport` (diagnosticReports[0]) references with `activeReport` derived from activeReportId
- Add logic to filter available codes, excluding those already used by existing reports
- Add report selector UI (tabs/buttons) when multiple reports exist
- Update "Create Report" button logic to show "Create Another Report" when reports exist but codes remain
- Remove the `if (!hasReport)` guard from `handleCreateReport()` to allow creating additional reports
- Update all query keys, mutations, and UI components to use `activeReport` instead of `latestReport`
- Add i18n keys to `public/locale/en.json`: `create_another_report`, `please_select_report_type`

**Files Modified:**
- `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx` (~150 lines changed)
- `public/locale/en.json` (~4 lines added)

**Estimated Size:** ~150-200 lines changed

**Dependencies:** None (standalone implementation)

**Acceptance Criteria Covered:**

1. **AC1:** Given an SR whose AD has 2+ diagnostic report codes and no existing reports, when viewing the SR, then the codes dropdown shows all available codes.
   - ✅ Covered by filtering logic: `availableCodes` shows all codes when `diagnosticReports.length === 0`

2. **AC2:** Given an SR whose AD has 2+ diagnostic report codes, when creating the first diagnostic report, then the selected code is saved and that report is displayed.
   - ✅ Covered by `handleCreateReport()` calling API with selected code

3. **AC3:** Given an SR that has 1 diagnostic report and the AD defines 2+ codes, when viewing the SR again, then a UI affordance (e.g., "Create another report" button) appears to create a second report.
   - ✅ Covered by conditional rendering: `{hasReport && canCreateMoreReports && <Button>Create Another Report</Button>}`

4. **AC4:** Given an SR with 1 existing diagnostic report, when creating a new report, then the codes dropdown shows only codes not yet used by existing reports.
   - ✅ Covered by filtering logic: `availableCodes` filters out codes from existing reports

5. **AC5:** Given an SR with N diagnostic reports matching N codes from the AD, when viewing the SR, then the "create report" affordance is hidden or disabled.
   - ✅ Covered by conditional rendering: button only shows when `canCreateMoreReports === true`

6. **AC6:** Given multiple diagnostic reports exist for an SR, when switching between reports, then each report displays its own observations, conclusion, and attachments independently.
   - ✅ Covered by `activeReportId` state and report selector UI that switches active report

7. **AC7:** Given multiple diagnostic reports exist for an SR, when adding/editing observations for one report, then changes are saved to that specific report without affecting others.
   - ✅ Covered by all mutations using `activeReport?.id` ensuring changes target the correct report

**Implementation Details:**

This task encompasses the complete implementation in a single pass:

1. **State Management:**
   - Add `const [activeReportId, setActiveReportId] = useState<string | null>(null)`
   - Derive `activeReport` from `diagnosticReports.find(r => r.id === activeReportId) || diagnosticReports[0] || null`
   - Replace all ~15 occurrences of `latestReport` with `activeReport`

2. **Available Codes Filtering:**
   ```typescript
   const usedCodes = new Set(diagnosticReports.map(r => r.code?.code).filter(Boolean));
   const availableCodes = activityDefinition?.diagnostic_report_codes?.filter(
     code => !usedCodes.has(code.code)
   ) || [];
   const canCreateMoreReports = availableCodes.length > 0;
   ```

3. **Report Selector UI:**
   - Add tabs/buttons above the form when `diagnosticReports.length > 1`
   - Each button shows report code display name and highlights active report
   - onClick handlers update `activeReportId`

4. **Create Report Button:**
   - Change condition from `!hasReport` to `!hasReport || (hasReport && canCreateMoreReports)`
   - Update button text: `hasReport ? "Create Another Report" : "Create Report"`
   - Remove the early return guard in `handleCreateReport()`

5. **Query/Mutation Updates:**
   - Update all query keys using `latestReport?.id` to use `activeReport?.id`
   - Update all pathParams using `latestReport?.id` to use `activeReport?.id`
   - Examples: observations query, conclusion query, update mutations, file uploads

6. **useEffect Updates:**
   - Add effect to set `activeReportId` when reports first load
   - Update effect that syncs `selectedReportCode` with active report

7. **Code Dropdown:**
   - Change data source from `activityDefinition?.diagnostic_report_codes` to `availableCodes`

**Testing Checklist:**
- [ ] Single-code AD: behavior unchanged (create one report only)
- [ ] Multi-code AD: all codes shown initially
- [ ] Multi-code AD: first report created successfully
- [ ] Multi-code AD: "Create Another Report" button appears
- [ ] Multi-code AD: code dropdown excludes used codes
- [ ] Multi-code AD: second report created with different code
- [ ] Report selector appears and switches between reports
- [ ] Each report's observations, conclusion, attachments load independently
- [ ] Editing one report doesn't affect others
- [ ] All codes used: create button disappears
- [ ] No duplicate codes can be selected

---

## Summary

This ticket requires a single implementation task in the frontend repository. The change is localized to one component (`DiagnosticReportForm.tsx`) with minimal i18n additions. All 7 acceptance criteria are fully covered by this single task.

**Total Tasks:** 1  
**Total Estimated Changes:** ~150-200 lines  
**Repositories Touched:** 1 (care_fe_agent_hq)
