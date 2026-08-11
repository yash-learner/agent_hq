# Ticket 50: Show user role in sidebar nav menu

## Problem statement

The `FacilityNavUser` sidebar footer displays avatar, name, and username but omits the user's role, creating session-confusion risk in shared-workstation environments. When doctors, nurses, staff, volunteers, and facility admins rotate through the same terminals, acting under the wrong session becomes a clinical-safety and audit problem. Adding a visible role badge in the dropdown provides the cheapest guard against wrong-role actions.

## Acceptance criteria

1. Given a signed-in facility user with role "doctor", when they open the sidebar user dropdown, then a badge displays "doctor" next to the username.
2. Given the fixture user `care-fac-admin` signed in, when they open the dropdown, then the badge shows "administrator".
3. Given a facility user with role "nurse", when they open the dropdown and click Profile, then the profile page opens and the badge remains visible in the sidebar.
4. Given a facility user with any role, when they open the dropdown and click Logout, then logout completes successfully.
5. Given a patient signed in via OTP, when they open the patient nav menu, then no role badge appears.

## Capability notes

- `src/components/ui/sidebar/nav-user.tsx:33-141` — `FacilityNavUser` component exists, displays avatar, name, username in dropdown (lines 82-93).
- `src/components/ui/sidebar/nav-user.tsx:144-221` — `PatientNavUser` component exists, OTP-based login with no role field.
- `src/components/ui/badge.tsx` — Badge component exists with variants (secondary, primary, blue, etc.).
- `src/types/user/user.ts:7-8` — `UserType` type exists: `"doctor" | "nurse" | "staff" | "volunteer" | "administrator"`.
- `src/types/user/user.ts:18` — `UserBase.user_type: UserType` field exists and is available on the auth user object.

## Open questions

None.
