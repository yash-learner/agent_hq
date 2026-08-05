# Spec: Show user's role on facility user list cards

## Problem

Facility user list cards and table rows display `user.user_type` (removed from backend) instead of role organization memberships. Operators cannot see job roles (Doctor, Nurse, Administrator) without opening each user detail page, slowing onboarding reviews and access audits at large facilities.

## Acceptance criteria

1. Given a facility user with `role_orgs = [{ organization: { name: "Doctor" }, role: { name: "Member" } }]`, when viewing the facility users list (card view), then the card displays **Doctor**.
2. Given fixture user `care-nurse` with role org "Nurse", when viewing facility users list (card view), then the card shows **Nurse**, not blank.
3. Given a facility user with multiple `role_orgs` (e.g., Doctor and Nurse), when viewing the list, then both organization names appear comma-separated: **Doctor, Nurse**.
4. Given a user with `role_orgs[].role.name = "Manager"` (not default "Member"), when viewing the list, then the display includes designation: **Doctor · Manager**.
5. Given a facility user with empty `role_orgs`, when viewing the list, then the role field shows em dash or nothing without crashing.
6. Given a facility users list (table view), when viewing the role column, then each row displays formatted `role_orgs` organization names matching the card view pattern.
7. Given organization user lists that pass explicit `roleName` prop, when viewing those cards, then no regression occurs (displays passed prop value).

## Capability notes

- `src/types/user/user.ts:22` — `UserReadMinimal` interface exists, missing `role_orgs` field (present only on `UserRead`)
- `src/types/facility/facilityApi.ts:70-74` — `getUsers` endpoint typed as returning `PaginatedResponse<UserReadMinimal>`
- `src/components/Users/UserListAndCard.tsx:162,220` — displays `user.user_type` in card and table views
- `src/components/Users/UserRoleOrganizationAccess.tsx:240-336` — `RoleOrgAccessSummary` reference implementation showing `organization.name` (primary), `role.name` (secondary badge)
- Helper function `formatRoleOrgLabels(role_orgs)` — needs building for consistent formatting

## Open questions

None.
