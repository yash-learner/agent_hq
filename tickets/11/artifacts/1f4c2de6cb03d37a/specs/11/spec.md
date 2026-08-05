# Specification: Show user roles on facility user list cards

## Problem

Facility user list cards and table rows display `user.user_type` (removed from backend), showing blank role fields instead of the current `role_orgs[]` structure. Operators must open every user profile to view role assignments, slowing onboarding and access reviews at large facilities.

## Acceptance Criteria

1. Given a facility user list in card view, when the list renders, then each card shows the user's job role(s) from `role_orgs[].organization.name`.
2. Given a facility user list in table view, when the list renders, then the "Role" column shows job role(s) from `role_orgs[].organization.name`.
3. Given a user with `role_orgs: [{organization: {name: "Nurse"}, role: {name: "Member"}}]`, when viewing their card, then it displays "Nurse".
4. Given a user with multiple role_orgs (e.g., Doctor and Nurse), when viewing their card, then it displays comma-joined roles like "Doctor, Nurse".
5. Given a user with `role_orgs: [{organization: {name: "Doctor"}, role: {name: "Manager"}}]`, when viewing their card, then it displays "Doctor · Manager" (appending non-default designation).
6. Given a user with no role_orgs (`role_orgs: []` or null), when viewing their card, then it displays "—" or empty text without crashing.
7. Given the Playwright test `tests/facility/users.spec.ts` exists or is created, when tests run, then they verify role display in both card and list views with fixture users like `care-nurse`.

## Capability Notes

- `src/types/user/user.ts` — `UserReadMinimal` interface exists but lacks `role_orgs` field; `UserRead` has the field at lines 35-44
- `src/types/facility/facilityApi.ts:70-74` — `getUsers` endpoint already returns `PaginatedResponse<UserReadMinimal>`, needs updated typing
- `src/components/Users/UserListAndCard.tsx:162,220` — Card and table read `user.user_type` (removed field); need replacement with `role_orgs` logic
- `src/components/Users/UserRoleOrganizationAccess.tsx:324-340` — `RoleOrgAccessSummary` component displays `organization.name` (primary) and `role.name` (badge) as reference pattern
- `tests/facility/` — Directory exists for Playwright tests; may need new or updated test file for user list role verification

## Open Questions

None.
