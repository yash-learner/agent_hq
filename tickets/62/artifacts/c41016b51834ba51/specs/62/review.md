# Review: Custom Sidebar Links Implementation

## Round 1

- **blocker** `src/components/ui/sidebar/custom-links.tsx:20` — `useTranslation()` hook imported but `t` variable never used; remove unused import to pass linting.
- **blocker** `care.config.ts:27` — Formatting inconsistency introduced (line 91-92 changed from single-line to multi-line unnecessarily); revert unrelated formatting change to `defaultDischargeDisposition` declaration.
- **should-fix** `specs/62/qa-plan.md:300-307` — AC5 section states plugin support "cannot be tested in this QA environment" but provides no blocker reasoning for missing data setup; this is a valid limitation since plugins aren't available in test environment, but should include a note that structural verification (type definitions, merging logic) is complete and functional testing deferred to production.
- **nit** `src/components/ui/sidebar/custom-links.tsx:62` — Key generation `${link.url}-${index}` could collide if same URL configured twice; consider `${link.url}-${link.label}-${index}` for uniqueness.
