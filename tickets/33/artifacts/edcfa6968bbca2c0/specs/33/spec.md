# Specification: Show user role on user list cards

## Problem Statement

User list cards do not consistently display user roles alongside names. The role div is only rendered when either `roleName` OR `editRoleAction` is present, causing roles to be hidden on cards without edit actions. Operators at large facilities cannot identify user roles (Administrator, Nurse, Receptionist, etc.) during onboarding and access reviews without opening each user individually, significantly slowing these critical workflows.

## Acceptance Criteria

1. Given a user list card with a role, when the card is rendered, then the role must be visible next to the user identity details regardless of whether an edit action button is present.
2. Given a user list card without a role value, when the card is rendered, then the role section must not be rendered but the edit action button (if present) must still appear.
3. Given a facility user list in card view, when viewing users with the `doctor` role, then "doctor" must be displayed on each card.
4. Given an organization user list in card view, when viewing users with organization-specific roles, then the role name must be displayed on each card.
5. Given a facility organization user list, when viewing users, then each card must display the user's facility organization role name.

## Capability Notes

- `src/components/Users/UserListAndCard.tsx:UserCard` -- exists; conditional at lines 111-121 gates role div rendering on `(roleName || editRoleAction)`, must change to render when `roleName` exists
- `src/components/Users/UserListAndCard.tsx:UserGrid` -- exists; passes `roleName={user.user_type}` at line 162
- `src/components/Users/UserListAndCard.tsx:UserList` -- exists; list view already displays roles correctly in table at line 219-221
- `src/types/user/user.ts:UserReadMinimal` -- exists; includes `user_type` field used as role in facility user lists
- `src/pages/Organization/OrganizationUsers.tsx` -- exists; passes `roleName={userRole.role.name}` at line 216, will benefit from consistent rendering

## Open Questions

None.
