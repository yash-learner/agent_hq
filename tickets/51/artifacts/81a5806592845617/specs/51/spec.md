# Spec: Display patient search result count

Front-desk staff searching for returning patients cannot tell whether the displayed results are complete or truncated, leading to duplicate registrations when a real match is buried in a long list. Adding a visible count above the results allows staff to decide in seconds whether to refine, pick, or register as new.

## Acceptance criteria

1. Given fixture patients exist, when a registrar searches a term matching them on the identifier tab, then a summary line (e.g., "3 results") shows above the results table with the correct count.
2. Given a term with no matches on the identifier tab, when the search completes, then the existing empty state shows without a count line or with "0 results" (consistently applied).
3. Given the page before any search is typed, then no count line is shown.
4. Given fixture patients exist, when a registrar searches a term matching them on the encounter tab, then a summary line shows above the results table with the correct count from `encounterList.count`.
5. Given a term with no matches on the encounter tab, when the search completes, then the existing empty state shows without a count line or with "0 results" (consistently applied).
6. Given an active search, when the registrar changes the term, then the count updates without a page reload.

## Capability notes

- `src/components/Patient/PatientIndex.tsx` -- existing component, lines 127-159 use `patientList` (identifier search) and `encounterList` (encounter search)
- `src/types/emr/patient/patient.ts:PatientSearchResponse` -- existing type, has `results` array but no count field (length must be used)
- `src/types/emr/encounter/encounterApi.ts:list` -- existing API, returns `PaginatedResponse<EncounterListRead>` with `count` field
- `src/Utils/request/types.ts:PaginatedResponse` -- existing type with `count: number` and `results: TItem[]`
- `public/locale/en.json` -- needs new i18n key for results summary (e.g., `"search_results_count": "{{count}} result" or "{{count}} results"`)

## Open questions

None.
