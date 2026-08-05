# Review: MultiFilter Mobile Responsiveness

## Round 1

- **blocker** `tests/PLAYWRIGHT_GUIDE.md:850-860` — Accidental formatting damage removed newlines between URL examples; restore line breaks between each template literal.
- **should-fix** `package-lock.json:1-504` — `libc` constraint removals are unrelated to the MultiFilter ticket; consider reverting or explaining in commit message why lockfile changed.

## Round 2

- **nit** `src/components/ui/multi-filter/MultiFilter.tsx:169` — Explicitly setting `aria-describedby={undefined}` is unnecessary; omit the prop entirely.
- **nit** `src/components/ui/multi-filter/selectedFilterBar.tsx:155` — Explicitly setting `aria-describedby={undefined}` is unnecessary; omit the prop entirely.
