# Implementation Plan: Support Multiple Diagnostic Reports per Service Request

## Overview

This is a frontend-only change to allow users to create multiple diagnostic reports from a single Service Request, one per diagnostic report code defined on the Activity Definition. The backend already supports this capability; the frontend currently limits users to a single report.

## Implementation Approach

### 1. Filter Available Codes Based on Existing Reports

**Location:** `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx`

Calculate which diagnostic report codes from the Activity Definition are still available (not yet used by existing diagnostic reports):

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

**Change:**
- Lines 1262-1272: Update the SelectContent mapping to iterate over `availableCodes` instead of `activityDefinition.diagnostic_report_codes`
- This ensures the dropdown only shows codes that haven't been used in existing reports

### 2. Show Form Only When Unused Codes Remain

**Location:** `src/pages/Facility/services/serviceRequests/ServiceRequestShow.tsx`

Currently (lines 599-601), the form is shown when:
- No diagnostic reports exist, OR
- The first report's status is not "final"

**Change:**
Replace the conditional logic with:

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

const showForm = hasUnusedCodes && 
  (!diagnosticReports.length || 
   diagnosticReports[0]?.status !== DiagnosticReportStatus.final);
```

This ensures:
- The form appears when unused codes remain
- The form hides when all Activity Definition codes have been used
- Existing behavior (hiding for finalized reports) is preserved

### 3. Reset State After Report Creation

**Location:** `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx`

Currently (lines 183-192), after creating a diagnostic report:
- Query cache is invalidated
- Success toast is shown

**Change:**
Add state reset in the `onSuccess` callback:

```typescript
onSuccess: () => {
  toast.success("Diagnostic report created successfully");
  setSelectedReportCode(null); // Clear selection for next report
  queryClient.invalidateQueries({
    queryKey: ["serviceRequest", serviceRequestId],
  });
  queryClient.invalidateQueries({
    queryKey: ["diagnosticReport"],
  });
},
```

This allows the user to immediately select another code and create the next report without reloading the page.

### 4. Handle Edge Cases

**No codes defined on Activity Definition:**
- The form should still allow report creation (current behavior)
- The code dropdown won't appear if `diagnostic_report_codes` is empty or undefined

**All codes used:**
- Form is hidden when all codes are used
- State persists across page reloads (backend-driven via `diagnosticReports` array)

**Partial code usage:**
- Only unused codes appear in the dropdown
- User can create reports for remaining codes one by one

## Repositories Touched

**care_fe** (yash-learner/care_fe_agent_hq)
- `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx` — filter available codes, reset state after creation
- `src/pages/Facility/services/serviceRequests/ServiceRequestShow.tsx` — conditional form display based on unused codes

## Dependencies

No new dependencies required. This implementation uses:
- Existing TypeScript types (`Code`, `DiagnosticReportRead`, `ActivityDefinitionReadSpec`)
- Existing state management (React `useState`, TanStack Query cache invalidation)
- Existing UI components (`Select`, `SelectContent`, `SelectItem`)

## Testing Strategy

### Unit/Integration Testing
- Test that `availableCodes` correctly filters out used codes
- Test that form visibility toggles based on unused codes
- Test that state resets after successful report creation

### End-to-End Testing (Playwright)
Per the ticket's QA data setup section, an E2E test will:
1. Seed an Activity Definition with 3+ diagnostic report codes
2. Create a Service Request from that Activity Definition
3. Verify all codes appear in the dropdown initially
4. Create a report using the first code
5. Verify the first code disappears and remaining codes are available
6. Create subsequent reports and verify dropdown updates
7. Verify form hides after all codes are used
8. Verify state persists across page reload

The test driver will be implemented in `tests/setup/multipleDiagnosticReports.setup.ts` for seeding, and a criterion driver in `specs/20/qa-drivers/` for verification.

## Migration/Rollback

**Forward compatibility:** No backend changes required; this purely enhances existing frontend behavior.

**Rollback:** If issues arise, reverting the changes to `DiagnosticReportForm.tsx` and `ServiceRequestShow.tsx` restores the original single-report behavior.

## Acceptance Criteria Coverage

1. **AC1** (all codes available initially) — Satisfied by filtering logic that returns all codes when no reports exist
2. **AC2** (code removed after creation) — Satisfied by filtering used codes and resetting state
3. **AC3** (no reload required) — Satisfied by clearing `selectedReportCode` and invalidating cache
4. **AC4** (form hidden when all codes used) — Satisfied by `hasUnusedCodes` check in `ServiceRequestShow.tsx`
5. **AC5** (persistence across reload) — Satisfied by backend-driven `diagnosticReports` array
6. **AC6** (N reports for N codes) — Satisfied by allowing report creation for each available code
7. **AC7** (only unused codes after reload) — Satisfied by filtering logic applied on every render
