# Implementation Plan: Support for creating multiple diagnostic reports for SR

## Overview

This is a frontend-only change to allow users to create multiple diagnostic reports for a Service Request (SR) when the Activity Definition (AD) defines multiple diagnostic report codes. The backend already supports this functionality; the limitation is purely in the frontend UI.

## Current State

The `DiagnosticReportForm.tsx` component:
- Always works with `diagnosticReports[0]` (line 139: `const latestReport = diagnosticReports.length > 0 ? diagnosticReports[0] : null`)
- Uses a single `selectedReportCode` state
- Only allows creating one diagnostic report via `handleCreateReport()` which checks `if (!hasReport)` (line 470)
- Shows all AD codes in the dropdown without filtering out already-used codes

## Desired State

The component should:
1. Support viewing and editing multiple diagnostic reports (one per code)
2. Show a report selector when multiple reports exist
3. Filter the code dropdown to show only codes not yet used by existing reports
4. Allow creating additional reports until all AD codes are used
5. Maintain independent state for each report (observations, conclusion, attachments)

## Implementation Approach

### 1. State Management Refactor

**Current state:**
```typescript
const latestReport = diagnosticReports.length > 0 ? diagnosticReports[0] : null;
const [selectedReportCode, setSelectedReportCode] = useState<Code | null>(null);
```

**New state:**
```typescript
const [activeReportId, setActiveReportId] = useState<string | null>(null);
const [selectedReportCode, setSelectedReportCode] = useState<Code | null>(null);

// Derive active report from activeReportId
const activeReport = diagnosticReports.find(r => r.id === activeReportId) || diagnosticReports[0] || null;
const hasReport = diagnosticReports.length > 0;
```

### 2. Available Codes Filtering

Add logic to filter out codes already used by existing reports:

```typescript
const usedCodes = new Set(diagnosticReports.map(r => r.code?.code).filter(Boolean));
const availableCodes = activityDefinition?.diagnostic_report_codes?.filter(
  code => !usedCodes.has(code.code)
) || [];
const canCreateMoreReports = availableCodes.length > 0;
```

### 3. Report Selector UI

When multiple reports exist, add a report selector/tabs before the form:

```typescript
{diagnosticReports.length > 1 && (
  <div className="flex gap-2 mb-4">
    {diagnosticReports.map(report => (
      <Button
        key={report.id}
        variant={activeReportId === report.id ? "default" : "outline"}
        onClick={() => setActiveReportId(report.id)}
      >
        {report.code?.display || "Report"}
      </Button>
    ))}
  </div>
)}
```

### 4. Create Report Button Logic

**Current:** Only shown when `!hasReport`

**New:** Show "Create Report" or "Create Another Report" button when available codes exist:

```typescript
{hasReport && canCreateMoreReports && (
  <Button onClick={handleCreateReport}>
    <PlusCircle /> {t("create_another_report")}
  </Button>
)}
```

### 5. handleCreateReport() Updates

Remove the `if (!hasReport)` guard and support creating multiple reports:

```typescript
function handleCreateReport() {
  if (!hasCollectedSpecimens) {
    toast.error(t("specimen_collection_required"));
    return;
  }

  if (!selectedReportCode) {
    toast.error(t("please_select_report_type"));
    return;
  }

  const category: Code = {
    code: "LAB",
    display: "Laboratory",
    system: "http://terminology.hl7.org/CodeSystem/v2-0074",
  };

  createDiagnosticReport({
    status: DiagnosticReportStatus.preliminary,
    category,
    service_request: serviceRequestId,
    code: selectedReportCode,
  });
}
```

### 6. useEffect Updates

Update effects to work with `activeReport` instead of `latestReport`:

```typescript
// Set active report when reports change
useEffect(() => {
  if (diagnosticReports.length > 0 && !activeReportId) {
    setActiveReportId(diagnosticReports[0].id);
  }
}, [diagnosticReports, activeReportId]);

// Update selectedReportCode based on active report
useEffect(() => {
  if (activeReport) {
    setSelectedReportCode(activeReport.code || null);
  }
}, [activeReport]);
```

### 7. Query Updates

Replace all `latestReport` references with `activeReport` in query keys and mutations:

```typescript
// Example
queryKey: ["diagnosticReport", activeReport?.id]
pathParams: { external_id: activeReport?.id || "" }
```

### 8. UI Flow Updates

**Before first report:**
- Code dropdown (all AD codes available)
- "Create Report" button

**After first report (if more codes available):**
- Report selector/tabs (if multiple reports exist)
- Active report's observations, conclusion, attachments
- Code dropdown (only unused codes)
- "Create Another Report" button

**When all codes used:**
- Report selector/tabs
- Active report's observations, conclusion, attachments
- No create button (all codes exhausted)

## Files to Modify

### `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx`

**Changes:**
1. Add `activeReportId` state and replace `latestReport` with `activeReport` derived from it
2. Add `availableCodes` computation to filter unused codes
3. Add report selector UI when multiple reports exist
4. Update code dropdown to show only `availableCodes`
5. Show "Create Another Report" button when `hasReport && canCreateMoreReports`
6. Remove `if (!hasReport)` guard from `handleCreateReport()`
7. Update all `latestReport` references to `activeReport` in queries, mutations, and UI
8. Update useEffect hooks to work with `activeReport`

### `public/locale/en.json`

**Additions:**
```json
{
  "create_another_report": "Create Another Report",
  "please_select_report_type": "Please select a report type",
  "report_n": "Report {{n}}",
  "all_report_codes_used": "All available report types have been created"
}
```

## Repositories Touched

- **yash-learner/care_fe_agent_hq** - Frontend implementation

## Dependencies

No new dependencies required. The implementation uses existing:
- React hooks (useState, useEffect)
- TanStack Query for data fetching
- Existing UI components (Button, Select)
- Existing API endpoints (already support multiple reports)

## Testing Approach

### Unit Testing
- Test `availableCodes` filtering logic
- Test report selector state management
- Test handleCreateReport for both first and subsequent reports

### Manual Testing Scenarios

1. **Single code AD:** Verify behavior unchanged (create one report, no "create another" button)

2. **Multi-code AD - Create first report:**
   - Verify all AD codes shown in dropdown
   - Create report with code A
   - Verify report is created and displayed

3. **Multi-code AD - Create second report:**
   - Verify "Create Another Report" button appears
   - Verify code dropdown shows only unused codes (excludes code A)
   - Create report with code B
   - Verify second report is created

4. **Multi-code AD - Switch between reports:**
   - Verify report selector shows both reports
   - Click report A, verify its observations/conclusion/attachments load
   - Click report B, verify its observations/conclusion/attachments load
   - Verify changes to one report don't affect the other

5. **Multi-code AD - All codes exhausted:**
   - Create reports for all AD codes
   - Verify "Create Another Report" button disappears or is disabled
   - Verify appropriate message shown

6. **Multi-code AD - Edit different reports:**
   - Add observations to report A, save
   - Switch to report B, add different observations, save
   - Switch back to report A, verify observations unchanged
   - Verify each report has its own attachments

## Risks & Mitigations

### Risk: State confusion when switching reports
**Mitigation:** Clear separation of concerns - `activeReportId` drives which report is active, all queries/mutations use `activeReport`

### Risk: User loses unsaved changes when switching reports
**Mitigation:** Save observations and conclusion when switching reports (auto-save behavior) or show confirmation dialog

### Risk: Backend returns reports in unpredictable order
**Mitigation:** Don't rely on order - use explicit `activeReportId` selection and report selector UI

## Clinical Safety Considerations

This change enables existing backend functionality and does not alter clinical data handling. However:
- Each report must maintain data isolation (observations, conclusions, attachments)
- Code selection must be validated (no duplicate codes per SR)
- Report status transitions remain unchanged
- Existing permissions and access controls apply to all reports

## Success Criteria

1. Users can create N diagnostic reports for an SR with N AD codes
2. Code dropdown shows only unused codes after first report
3. Report selector allows switching between reports without data loss
4. Each report maintains independent observations, conclusion, and attachments
5. "Create Another Report" button disappears when all codes used
6. No regression in single-code AD behavior
