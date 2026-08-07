# Review: Support for creating multiple diagnostic reports for SR

## Round 1

- **blocker** `specs/22/qa-plan.md` — Data setup for AC1-AC7 lacks concrete LOINC codes and provenance. Replace vague placeholders ("e.g., 'Complete Blood Count' - LOINC code from system", "e.g., 'Basic Metabolic Panel'") with specific codes from `tests/admin/valueset/valuesetConstants.ts` (e.g., "2339-0" for Glucose, "718-7" for Hemoglobin, "789-8" for Erythrocytes). The UI recipe must specify the exact steps for adding multiple diagnostic report codes (click "Add another code" button, use second code picker, select second code), which the existing test helper `tests/facility/settings/activityDefinition/activityDefinition.ts:createActivityDefinition` does not support (it only adds one diagnostic report code at lines 238-243).

- **blocker** `src/pages/Facility/services/serviceRequests/components/DiagnosticReportForm.tsx:222` — The "Create Another Report" section is only shown when `fullReport.status === DiagnosticReportStatus.preliminary`. This violates AC3: if the first report is marked as final, users cannot create additional reports even when unused codes remain. Remove the `&& fullReport.status === DiagnosticReportStatus.preliminary` condition from line 222 to allow creating new reports regardless of existing reports' statuses.

## Round 2

- **blocker** `tests/PLAYWRIGHT_GUIDE.md:90-94` — URL templates concatenated without newlines. Lines 90, 92, and 94 have multiple URL templates joined without line breaks (e.g., `\`/facility/${facilityId}/overview\`\`/facility/${facilityId}/settings/locations\`...`). Restore newlines between each URL template so the code examples are readable and parseable.
