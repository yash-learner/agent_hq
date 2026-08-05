# Implementation Tasks: Show User Role on User List Cards

## Overview

This ticket requires a single frontend change to restore role visibility on user list cards. The `UserCard` component currently hides the role when there's no edit action, but should always display it when present.

## Tasks

### Task 1: Fix UserCard role display conditional logic (care_fe)

**Repository:** yash-learner/care_fe_agent_hq

**What it touches:**
- `src/components/Users/UserListAndCard.tsx` - Modify the `UserCard` component's conditional rendering logic (lines 111-121)

**Implementation:**
1. Locate the conditional rendering block at lines 111-121 in `UserCard` component
2. Change the outer conditional from `{(roleName || editRoleAction) && (...)}` to `{roleName && (...)}`
3. Keep the `editRoleAction` conditionally rendered inside the div only when provided
4. Ensure the existing styling and layout are maintained

**Before:**
```tsx
{(roleName || editRoleAction) && (
  <div className={cn("mt-2 -ml-12 sm:ml-0 flex items-center gap-1.5 text-sm", isServiceAccount && "ml-0")}>
    {roleName && <span className="text-gray-500">{roleName}</span>}
    {editRoleAction}
  </div>
)}
```

**After:**
```tsx
{roleName && (
  <div className={cn("mt-2 -ml-12 sm:ml-0 flex items-center gap-1.5 text-sm", isServiceAccount && "ml-0")}>
    <span className="text-gray-500">{roleName}</span>
    {editRoleAction}
  </div>
)}
```

**Dependencies:**
- None (standalone change)

**Acceptance criteria coverage:**
- ✓ AC1: Role is visible alongside name and username in card view
- ✓ AC2: "doctor" role displays correctly
- ✓ AC3: "nurse" role displays correctly
- ✓ AC4: "administrator" role displays correctly
- ✓ AC5: All cards show role without opening user details
- ✓ AC6: List view continues to work (no changes to list view code)

**Estimated size:** <10 lines changed

**Verification:**
1. Navigate to user list in card view
2. Verify role displays for users with roles: doctor, nurse, staff, volunteer, administrator
3. Verify role displays for users without edit role action
4. Verify list view continues to work correctly
5. Test with service accounts and archived users

## Coverage Summary

All 6 acceptance criteria are covered by Task 1:

| Criterion | Task(s) |
|-----------|---------|
| AC1: Role visible in card view | Task 1 |
| AC2: "doctor" displays | Task 1 |
| AC3: "nurse" displays | Task 1 |
| AC4: "administrator" displays | Task 1 |
| AC5: Role visible without opening details | Task 1 |
| AC6: List view continues to work | Task 1 |

## Testing Notes

Manual testing should cover:
- All user types (doctor, nurse, staff, volunteer, administrator)
- Cards with and without edit role action
- Service accounts
- Archived/deleted users
- Both card view and list view

No automated tests need to be added as this is a simple display logic fix.
