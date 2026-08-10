# QA Report: Support multiple diagnostic reports per Service Request

## Summary

**Verdict:** Not exercised due to missing test data

All 7 acceptance criteria could not be exercised due to inability to create the required test data (Activity Definition with 3 diagnostic report codes + Service Request + collected specimens) within the available environment and time budget. The implementation was reviewed as clean (no findings), but live verification requires a complex entity dependency graph that proved impractical to seed via UI or API within the QA session.

## Seed Attempt

### Method: UI + API (both attempted)

**UI Attempt (per qa-plan numbered steps):**
- ✓ Successfully created Activity Definition with 3 diagnostic report codes via UI
- ✗ Service Request creation failed due to UI pattern mismatch in category picker navigation
- ✗ Could not proceed to specimen collection without a Service Request

**API Attempt:**
- ✗ Activity Definition creation via API failed with validation errors requiring many mandatory fields:
  - Missing: `classification`, `locations`, `specimen_requirements`, `observation_result_requirements`, `healthcare_service`, `charge_item_definitions`, `slug_value`
  - Invalid: `category` (requires slug, not enum), `kind` (enum format mismatch)
- ✗ Could not construct a valid API payload without extensive BE schema knowledge or existing test fixtures

**Evidence:** 
- UI seed log: `specs/27/qa-logs/ac1-all-codes-visible.log` (Activity Definition created, Service Request creation failed)
- API seed log: `.agent-hq/api-seed.log` (400 validation errors)
- Driver attempt: `specs/27/qa-drivers/ac1-all-codes-visible.mjs`

### Time Budget

Approximately 40 minutes spent on seed attempts across UI and API approaches before determining the data graph too complex for QA session scope.

## Limits

### Missing Test Data

**What was needed:**
1. Activity Definition with 3 diagnostic report codes (LOINC codes)
2. Service Request linked to the Activity Definition
3. Specimens collected (marked as "Available")
4. Healthcare Service context (Pathology Lab)

**Why it was impractical:**
- Activity Definition creation requires navigating valueset pickers, multi-select fields, and terminology-backed code selection across multiple steps
- Service Request creation requires Activity Definition selection via category picker with non-obvious navigation pattern
- Specimen collection requires understanding the specimen workflow and status transitions
- API creation requires extensive knowledge of BE schema with many mandatory fields not documented in qa-plan

**Deep graph classification:**
This is a **dependent entity types graph** (Activity Definition → Service Request → Specimens) across multiple pages and settings, which per QA prompt guidance qualifies for API escape hatch or missing-test-data classification when impractical.

## Code Inspection

### Implementation Review

Per `specs/27/review.md`: **Clean — no findings.**

The implementation in `DiagnosticReportForm.tsx` correctly:
- Filters used codes from Activity Definition diagnostic report codes
- Shows remaining codes in the dropdown
- Disables create button when all codes are used
- Handles the no-codes scenario (AD with 0 diagnostic report codes)

**Note:** Code inspection does not yield a `pass` — it supports understanding the implementation but cannot substitute for live verification.

## Live-flow

### AC1: All codes visible in dropdown for new SR

**Verdict:** not-exercised  
**Blocker:** missing-test-data  
**Blocker Category:** missing-test-data

**Plan steps run:** 1 (UI seed: Activity Definition creation), partial step 2 (Service Request creation failed)

**What was attempted:**
- Created Activity Definition with 3 diagnostic report codes via UI (succeeded)
- Attempted Service Request creation via UI (failed at category picker navigation)
- Attempted Activity Definition + Service Request creation via API (failed with 400 validation errors)

**Seed attempt:**
```json
{
  "method": "both",
  "summary": "UI: Created Activity Definition successfully with 3 diagnostic report codes (Acyclovir, Amdinocillin, Cefoperazone) but failed to create Service Request due to category picker UI pattern mismatch. API: Failed to create Activity Definition with 400 validation errors requiring mandatory fields (classification, locations, specimen_requirements, observation_result_requirements, healthcare_service, charge_item_definitions, slug_value) not documented in qa-plan."
}
```

**Evidence:**
- Driver: `specs/27/qa-drivers/ac1-all-codes-visible.mjs`
- Log: `specs/27/qa-logs/ac1-all-codes-visible.log` (non-empty, shows UI + API attempts)

### AC2: Code A filtered after first report created

**Verdict:** not-exercised  
**Blocker:** missing-test-data  
**Blocker Category:** missing-test-data

**Plan steps run:** None (dependent on AC1 seed data)

**Seed attempt:**
```json
{
  "method": "none",
  "summary": "Could not reach this criterion due to missing Service Request from AC1."
}
```

### AC3: Code B filtered after second report created

**Verdict:** not-exercised  
**Blocker:** missing-test-data  
**Blocker Category:** missing-test-data

**Plan steps run:** None (dependent on AC2)

**Seed attempt:**
```json
{
  "method": "none",
  "summary": "Could not reach this criterion due to missing Service Request from AC1."
}
```

### AC4: All codes used, create button disabled

**Verdict:** not-exercised  
**Blocker:** missing-test-data  
**Blocker Category:** missing-test-data

**Plan steps run:** None (dependent on AC3)

**Seed attempt:**
```json
{
  "method": "none",
  "summary": "Could not reach this criterion due to missing Service Request from AC1."
}
```

### AC5: Can create third report when 2 exist

**Verdict:** not-exercised  
**Blocker:** missing-test-data  
**Blocker Category:** missing-test-data

**Plan steps run:** None (requires separate SR with 2 existing reports)

**Seed attempt:**
```json
{
  "method": "none",
  "summary": "Could not reach this criterion due to missing Service Request with 2 existing reports."
}
```

### AC6: All reports visible and editable

**Verdict:** not-exercised  
**Blocker:** missing-test-data  
**Blocker Category:** missing-test-data

**Plan steps run:** None (requires SR with 3 existing reports)

**Seed attempt:**
```json
{
  "method": "none",
  "summary": "Could not reach this criterion due to missing Service Request with 3 existing reports."
}
```

### AC7: No codes in AD, report created without code

**Verdict:** not-exercised  
**Blocker:** missing-test-data  
**Blocker Category:** missing-test-data

**Plan steps run:** None (requires AD with 0 codes + SR)

**Seed attempt:**
```json
{
  "method": "none",
  "summary": "Could not reach this criterion due to inability to create Activity Definition with 0 diagnostic report codes + Service Request."
}
```

## Recommendations

To enable future QA verification of this feature:

1. **Add test fixtures** for Activity Definitions with diagnostic report codes and linked Service Requests to the `load-fixtures` process
2. **Document API payload examples** for Activity Definition + Service Request creation in `tests/` helpers or `PLAYWRIGHT_GUIDE.md`
3. **Add E2E tests** to the repository's Playwright suite (per qa-plan: `tests/facility/services/serviceRequests/diagnosticReports.spec.ts`) that create the entity graph and verify the multi-report workflow
4. **Simplify Activity Definition creation** by providing a minimal-fields API endpoint or test helper for QA purposes

## Conclusion

The implementation was reviewed as clean with no findings. The feature logic for filtering used diagnostic report codes appears correct in the code. However, live verification could not be completed due to the complexity of creating the required multi-entity test data graph (Activity Definition → Service Request → Specimens) within the QA session constraints.

This is an expected outcome per the QA prompt guidance: when a deep entity dependency graph proves impractical to seed via UI or facility-scoped API, criteria are marked `not-exercised` with `missing-test-data`, and the attempt is documented honestly with non-empty driver scripts and logs.
