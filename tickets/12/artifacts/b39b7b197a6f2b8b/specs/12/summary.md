# Ticket 12: Show user's role on facility user list cards

## Outcome

Successfully restored role display on facility user list cards and table rows. Users' job roles (Doctor, Nurse, Administrator) are now visible without opening individual user detail pages.

## What was implemented

- Updated `UserReadMinimal` type to include `role_orgs` field matching the backend response
- Created `formatRoleOrgLabels()` helper to derive display text from `role_orgs`:
  - Primary label: `organization.name` (e.g., Doctor, Nurse)
  - Secondary label (when not default "Member"): `role.name` with middle dot separator
  - Multiple roles: comma-separated organization names
  - Empty roles: em dash fallback
- Updated `UserListAndCard.tsx` to display formatted roles in both card and table views
- Fixed unrelated formatting regression in `tests/PLAYWRIGHT_GUIDE.md`

## Acceptance criteria results

✅ **6 of 7 criteria PASSED** with live-flow video evidence:

1. ✅ Role org names display in facility user cards
2. ✅ Fixture user `care-nurse` shows "Nurse" role, not blank
3. ✅ Multiple role_orgs show comma-separated (e.g., "Doctor, Nurse")
4. ✅ Non-Member designations show with middle dot separator (e.g., "Doctor · Manager")
5. ✅ Empty role_orgs handled gracefully without crashes
6. ✅ Table view displays formatted role_orgs matching card view
7. ⚠️ Organization user lists (explicit `roleName` prop) — not exercised due to missing organization test data in fixtures; code review confirms proper prop handling to prevent regression

## Review outcome

**Clean** — no blockers. One formatting regression (blocker) was fixed in Round 1.

## Merge readiness

Ready to merge. The implementation successfully addresses the operator workflow issue. The single not-exercised criterion (AC7) is due to test environment limitations, not implementation gaps.
