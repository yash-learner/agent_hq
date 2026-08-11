# Summary: Permission-gate EncounterHistory empty-state "Create Encounter" button

## What was done

The empty-state "Create Encounter" button in `EncounterHistory.tsx` was permission-gated to match the behavior of other encounter creation entry points. The implementation extracts `canCreateEncounter` from the existing `getPermissions()` call and conditionally renders the button.

## Changes

- Extracted `canCreateEncounter` from existing `getPermissions()` call in `EncounterHistory.tsx`
- Wrapped the empty-state `<CreateEncounterForm>` with permission check: `{canCreateEncounter && ...}`
- Pattern matches the reference implementation in `PatientHome.tsx` (line 156)

**Commit:** `c28599c90` - 1 file changed, 15 insertions, 13 deletions

## Implementation Status

✅ Code review passed  
⚠️ Live QA blocked by environment configuration issues

## QA Outcome

**Status:** Not exercised (environment blocker)

MCP-driven QA could not complete due to frontend/backend connectivity issues:
- Default `.env` pointed to remote API instead of localhost backend
- Preview server port conflicts required multiple restarts
- Auth flow helper (`openAuthedContext`) failed despite login page rendering
- Time budget exhausted on environment setup without successfully loading authenticated app

**Code inspection confirms:** The permission check is correctly placed and matches patterns used in other encounter creation entry points (Patient home, Appointment buttons). The change is minimal and surgical.

## Recommendation

The implementation is correct per code review. Environment setup should be fixed for future QA runs:
1. Configure `.env.local` with localhost API by default
2. Ensure stable preview server port allocation
3. Verify auth helper compatibility with current app version
