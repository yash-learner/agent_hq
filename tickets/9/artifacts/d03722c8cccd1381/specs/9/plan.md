# Implementation Plan: Show User Role on User List Cards

## Problem Analysis

The `UserCard` component in `src/components/Users/UserListAndCard.tsx` conditionally displays the role name only when `roleName || editRoleAction` is truthy (line 111). The `UserGrid` component correctly passes `user.user_type` as the `roleName` prop (line 162), but the conditional rendering logic causes the role to be hidden when there's no `editRoleAction` present in certain contexts.

Meanwhile, `FacilityUserCard` (in `src/pages/Facility/components/UserCard.tsx`) unconditionally displays the role at line 55, demonstrating the desired behavior.

## Implementation Approach

### Frontend Changes (care_fe)

**File: `src/components/Users/UserListAndCard.tsx`**

1. **Modify the `UserCard` component** (lines 111-121):
   - Remove the conditional wrapper `{(roleName || editRoleAction) && (...)}` 
   - Restructure to always display the role when present
   - Keep `editRoleAction` conditionally rendered only when provided
   - Maintain existing styling and layout

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

This change ensures the role is displayed whenever `roleName` is provided, regardless of whether `editRoleAction` exists. The `editRoleAction` remains conditionally rendered within the div only when present.

### Alternative Considered

Split into two separate conditionals:
```tsx
{roleName && <div>...</div>}
{editRoleAction && <div>...</div>}
```

**Rejected because:** The current single-div layout keeps role and edit action visually grouped, which is the existing design pattern. Splitting would require additional layout adjustments.

## Repositories Touched

- **yash-learner/care_fe_agent_hq** (frontend) - Single component modification

## Dependencies

None. This is a pure display logic change using existing data and styling.

## Testing Strategy

1. **Manual verification**:
   - View user list in card view with various user types (doctor, nurse, staff, volunteer, administrator)
   - Verify role displays on all cards without opening user details
   - Verify list view continues to work correctly (no changes expected)

2. **Edge cases**:
   - Service accounts (should still display role)
   - Archived/deleted users (should display role)
   - Users with and without edit role action

## Migration Requirements

None. No database schema changes.

## Rollback Plan

Revert the single-line conditional change in `UserListAndCard.tsx`.

## Performance Impact

Negligible. Only affects rendering logic; no additional data fetching or computation.
