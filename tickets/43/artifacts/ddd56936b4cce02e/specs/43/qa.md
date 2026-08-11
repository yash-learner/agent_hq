# QA Report: Permission-gate EncounterHistory empty-state button

## Summary

Re-verification requested with MCP-driven QA for ticket 43. Testing encountered **environment configuration issues** that prevented completion of live-flow verification within the time budget. The implementation change is minimal and correct (confirmed via code inspection), but live evidence could not be captured due to frontend/backend connectivity issues.

**Status:** Not exercised (environment blocker)

## Code Inspection

The implementation correctly adds the permission check:

```typescript
// Line 82 in EncounterHistory.tsx
action={
  canCreateEncounter && (
    <CreateEncounterForm
      facilityId={facilityId}
      patientId={patientId}
      patientName={patientData.name}
      trigger={<Button>...</Button>}
    />
  )
}
```

The `canCreateEncounter` permission is properly extracted from `getPermissions()` (line 38) and conditionally renders the button only when the permission exists. This matches the pattern used in other encounter creation entry points.

## Limits

### AC1: Nurse without permission sees no button

**Verdict:** `not-exercised`  
**Blocker:** `app-not-loading`  
**Category:** Environment configuration

**Attempted:**
1. Created test patient via API (ID: 4fbc82c6-0094-4194-b0b2-a2d6ab5cfa98)
2. Attempted MCP browser automation with nurse credentials (tests/.auth/nurse.json)
3. Encountered persistent environment issues:
   - Initial `.env` pointed to remote API (https://careapi.ohc.network)
   - Created `.env.local` with `REACT_CARE_API_URL=http://localhost:9000`
   - Preview server required multiple restarts, eventually running on port 4002
   - Auth helper (`openAuthedContext`) failed to complete UI login flow
   - Manual login tests showed login page renders but authentication flow incomplete

**Evidence of attempt:**
- Test patient created: `4fbc82c6-0094-4194-b0b2-a2d6ab5cfa98`
- API seed log: `specs/43/qa-logs/ac1-nurse-no-button.log`
- Driver script: `specs/43/qa-drivers/ac1-nurse-no-button.mjs`

### AC2: Admin with permission sees button

**Verdict:** `not-exercised`  
**Blocker:** `app-not-loading`  
**Category:** Same environment blocker as AC1

Not attempted due to time budget exhausted on AC1 environment setup.

### AC3: No behavioral change for existing encounters view

**Verdict:** `not-exercised`  
**Blocker:** `app-not-loading`  
**Category:** Same environment blocker as AC1

Not attempted due to time budget exhausted on AC1 environment setup.

## Environment Issues Encountered

1. **API Configuration:** Default `.env` pointed to remote production API instead of localhost backend
2. **Port conflicts:** Preview server migrated from 4000 → 4001 → 4002 due to port conflicts
3. **Auth flow:** `openAuthedContext` from `.agent-hq/qa-auth.mjs` failed with timeout waiting for username field, despite login page being accessible
4. **Display:** Headless browser required (no X server), but recordings need visible cursor actions
5. **Time budget:** 45 minutes spent on environment setup without successfully loading authenticated app shell

## Setup Notes

- Backend: http://localhost:9000 (confirmed running)
- Frontend: Started on port 4002 (after ports 4000/4001 taken)
- Auth files: tests/.auth/user.json (admin), tests/.auth/nurse.json (nurse lacking permission)
- Facility ID: afb2f504-7657-4647-b554-2218d119beb1
- Test patient created: 4fbc82c6-0094-4194-b0b2-a2d6ab5cfa98 (zero encounters)

## Recommendation

The code change is correct and minimal. Recommend:
1. Fix `.env` configuration in setup script to create `.env.local` with localhost API
2. Ensure preview server starts on stable port before QA
3. Verify `openAuthedContext` helper works with current app version
4. Re-run QA with stable environment

## Code Inspection Notes

**Not a pass verdict** — code inspection alone cannot yield `pass` per QA protocol. However, for context:

- The permission check is correctly placed at line 82
- Uses the same `canCreateEncounter` variable extracted from `getPermissions()` 
- Matches the pattern used in Patient home, Appointment "Start Consultation", and "Create Planned Encounter" buttons
- No other code paths affected (encounter list rendering unchanged)

