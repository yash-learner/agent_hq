# Ticket 9: Show the user's role on the user list cards

## Problem statement

The user list cards previously displayed each user's role alongside their name, but this information is no longer visible in card view. Operators must now open each user individually to determine if someone is an Administrator, Nurse, or Receptionist, making onboarding and access reviews slow at large facilities.

## Acceptance criteria

1. Given a user list is displayed in card view, when viewing a user card, then the user's role is visible alongside their name and username.
2. Given a user has role "doctor", when viewing the user card, then "doctor" is displayed in the role field.
3. Given a user has role "nurse", when viewing the user card, then "nurse" is displayed in the role field.
4. Given a user has role "administrator", when viewing the user card, then "administrator" is displayed in the role field.
5. Given a facility user list displays multiple users, when viewing in card view, then each card shows the user's role without opening the user details.
6. Given the user list is in list view, when viewing users, then the role column continues to display correctly as it currently does.

## Capability notes

- `src/components/Users/UserListAndCard.tsx:UserCard` -- exists, accepts `roleName` prop but displays it conditionally (lines 111-121) where it's rendered below the username; card view needs role to be always visible
- `src/components/Users/UserListAndCard.tsx:UserGrid` -- exists, passes `user.user_type` as `roleName` to UserCard (line 162)
- `src/types/user/user.ts:UserReadMinimal` -- exists, includes `user_type` field of type `UserType` (line 18)
- `src/types/user/user.ts:UserType` -- exists, defines allowed role values: "doctor" | "nurse" | "staff" | "volunteer" | "administrator" (lines 7-8)
- `src/pages/Facility/components/UserCard.tsx:FacilityUserCard` -- exists, already displays `user.user_type` correctly in card view (line 55), can be used as reference pattern

## Open questions

None.
