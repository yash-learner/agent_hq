# QA Report: Support for creating multiple diagnostic reports for SR

## Summary

This QA session attempted to verify the implementation of ticket 59, which adds support for creating multiple diagnostic reports from a Service Request (SR) whose Activity Definition (AD) defines multiple diagnostic report codes.

**Status**: Not exercised - blocked by missing test data

## Live-flow

### AC1 — Filter codes dropdown to show only remaining codes

**Verdict**: `not-exercised`

**Reason**: Unable to complete data setup through UI. The Activity Definition was created successfully with 3 diagnostic report codes via the UI, and the Service Request creation form was filled and submitted. However, after submission, the application redirected to the encounter updates page (`/encounter/{id}/updates`), and navigating back to the service requests list did not show the newly created service request in a way that allowed navigation to its detail page. The service request links were not found on the page where expected.

**Blocker category**: `missing-test-data`

**Plan steps attempted**: 
- Steps 1-5 of Data setup UI recipe (create AD with 3 codes)
- Steps 6-12 of Data setup UI recipe (create SR from AD)
- Unable to complete steps 1-5 of AC1 (navigate to SR page and test dropdown filtering)

**Seed attempt**:
- Method: `ui`
- Summary: Created Activity Definition via UI at `/facility/{facilityId}/settings/activity_definitions/categories/f-{facilityId}-lab-tests-activity-definition/new` with title "Multi-Code AD {timestamp}", added 3 diagnostic report codes (Acyclovir, Amdinocillin, Cefoperazone) using ValueSetSelect. AD creation succeeded and redirected to settings page. Then navigated to service requests page, clicked "Create Service Request", selected the newly created AD from Lab Tests category, set priority to Routine, and submitted. Submission redirected to `/encounter/{id}/updates`. When navigating back to service requests list page, could not locate link to the newly created SR detail page. Page showed 0 SR links in the expected format.

[dropdown-filter](specs/59/videos/dropdown-filter.webm)

---

### AC2 — Show all codes when no reports exist yet

**Verdict**: `not-exercised`

**Reason**: Dependent on completing AC1 data setup. Could not reach the service request detail page to verify the dropdown behavior.

**Blocker category**: `missing-test-data`

**Plan steps attempted**: None (blocked by AC1 data setup failure)

---

### AC3 — Create second report without reload

**Verdict**: `not-exercised`

**Reason**: Dependent on completing AC1 and AC2. Could not reach the service request detail page or create the first report.

**Blocker category**: `missing-test-data`

**Plan steps attempted**: None (blocked by AC1 data setup failure)

---

### AC4 — Hide "Create Report" button when all codes used

**Verdict**: `not-exercised`

**Reason**: Dependent on completing AC1, AC2, and AC3. Could not reach the service request detail page or create any reports.

**Blocker category**: `missing-test-data`

**Plan steps attempted**: None (blocked by AC1 data setup failure)

---

### AC5 — Persist available codes after page reload

**Verdict**: `not-exercised`

**Reason**: Dependent on completing AC1, AC2, and AC3. Could not reach the service request detail page or create any reports to test reload behavior.

**Blocker category**: `missing-test-data`

**Plan steps attempted**: None (blocked by AC1 data setup failure)

---

### AC6 — Allow report creation when AD has no codes

**Verdict**: `not-exercised`

**Reason**: Requires separate data setup to create an AD with no diagnostic report codes and a corresponding SR. Given the difficulty in completing the data setup for AC1, this criterion was not attempted.

**Blocker category**: `missing-test-data`

**Plan steps attempted**: None (not attempted due to AC1 data setup issues)

---

### AC7 — Allow creating additional reports if final report does not exist

**Verdict**: `not-exercised`

**Reason**: Dependent on completing AC1. This criterion tests the same flow as AC1-AC3 but verifies that preliminary/registered status reports don't block additional report creation.

**Blocker category**: `missing-test-data`

**Plan steps attempted**: None (blocked by AC1 data setup failure)

---

## Limits

### Data Setup Challenges

The primary blocker for this QA session was the inability to complete the full data setup flow through the UI. Specifically:

1. **Activity Definition Creation**: Successfully created an AD with 3 diagnostic report codes via UI. The form accepted multiple codes as expected, using the ValueSetSelect component with diagnostic codes "Acyclovir [Susceptibility]", "Amdinocillin [Susceptibility] by Serum bactericidal titer", and "Cefoperazone [Susceptibility] by Minimum inhibitory concentration (MIC)".

2. **Service Request Creation**: Successfully filled and submitted the SR creation form, selecting the newly created AD, setting priority to Routine, and submitting. However, the post-submission flow did not lead to a navigable SR detail page.

3. **Service Request Navigation**: After submission, the application redirected to `/encounter/{id}/updates`. When navigating back to the service requests list page (`/facility/{facilityId}/patient/{patientId}/encounter/{encounterId}/service_requests`), no service request links were found in the expected format (`a[href*="/service_requests/"]`). This prevented navigation to the SR detail page where the diagnostic report creation UI would be located.

### API Seed Escape Hatch Not Used

The QA plan provides an API seed escape hatch for cases where UI creation is blocked or impractical. However, due to time constraints (45-minute cap for the full QA pass), and the need to first understand the correct API payload structure for Activity Definitions with multiple diagnostic report codes, the API seed approach was not fully implemented in this session.

The API paths would be:
- `POST /api/v1/facility/{facilityId}/activity_definition/` for creating the AD
- `POST /api/v1/patient/{patientExternalId}/questionnaire_response/` for creating the SR (questionnaire response)

However, without a working example of the correct request body format (particularly for the diagnostic report codes array in the AD), attempting API seed risked introducing validation errors that would require additional debugging time.

### Missing Facility-Scoped API Examples

The review noted that the QA plan's API seed body provides LOINC codes without provenance. To use API seed confidently, I would need either:
1. Known-working test payloads from `tests/**` helpers or `beforeAll` hooks
2. Valueset expansion API responses showing the correct code-to-display mappings
3. Working examples from existing E2E tests that create ADs with multiple diagnostic codes

These were not located within the time budget of this session.

### Time Budget

The 45-minute cap for the full QA pass was reached during the data setup phase. A partial honest QA with `not-exercised` verdicts and documented blocker categories is the appropriate outcome when data setup proves more complex than anticipated.

---

## Code Inspection

*Note: Code inspection does not constitute a pass; it is provided here for context only.*

### Implementation Review

Examining the implementation files:

1. **DiagnosticReportForm.tsx** (lines 88-104): Added logic to compute `usedReportCodes`, `availableReportCodes`, and `canCreateMoreReports` from the SR's existing diagnostic reports and the AD's report codes. This filtering logic appears correct.

2. **ServiceRequestShow.tsx** (lines 36-47): Duplicated the same computation for the parent component to determine whether to show the diagnostic report form. The review notes this as code duplication that should be extracted to a shared helper.

3. **Conditional Rendering** (lines 572-609 in ServiceRequestShow.tsx): The form is now conditionally rendered based on `canCreateMoreReports`, which correctly implements the requirement to hide the form when all codes are used.

4. **Dropdown Filtering** (DiagnosticReportForm.tsx lines 1242-1275): The codes dropdown now uses `availableReportCodes` instead of `activityDefinition.diagnostic_report_codes`, correctly filtering out already-used codes.

These changes appear to implement the specification correctly. However, without live-flow evidence showing the actual behavior in a running application with real data, these observations remain code inspection only and do not constitute a pass.

---

## Conclusion

All 7 acceptance criteria remain `not-exercised` due to the data setup blocker. The implementation's code structure appears correct, but live verification in a running application with properly seeded test data is required to confirm the feature works as specified.

The primary challenge was navigating to the service request detail page after creation through the UI. Future QA sessions for this ticket should either:
1. Use the API seed escape hatch with validated request payloads
2. Investigate the correct UI navigation flow to reach the SR detail page after submission
3. Use existing fixture SRs if the fixtures provide SRs with multi-code ADs

No criteria are reported as `pass`, consistent with the requirement that only live-flow evidence with video recordings can back a passing verdict.
