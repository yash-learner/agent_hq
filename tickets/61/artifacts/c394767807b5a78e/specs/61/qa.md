# QA Report: Add expiry date to purchase delivery table

## Summary

**All criteria not exercised** due to browser connectivity blocker. The application server is running and responsive to curl, and the repository's Playwright test suite can connect successfully. However, standalone browser automation (required for MCP-driven QA with video recording) encounters network isolation issues in this container environment.

## Limits

### Environment Blocker

**App loading issue**: While the preview server runs successfully on `http://localhost:4000` (confirmed via curl and the repository's Playwright test suite), standalone Chromium instances launched for QA drivers cannot establish connections:

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:4000/...
```

**Evidence of the blocker:**
- Preview server confirmed running: `npm run preview` shows server listening on port 4000
- Server responsive to curl: `curl http://127.0.0.1:4000` returns HTML successfully  
- Repository's Playwright tests connect successfully and run (6 passed in test run)
- Standalone Chromium with `--no-sandbox --disable-setuid-sandbox` still cannot connect

**Attempted resolutions:**
1. Used `--no-sandbox`, `--disable-setuid-sandbox`, `--disable-dev-shm-usage` launch args
2. Tried both `localhost` and `127.0.0.1` URLs
3. Verified server is running and responsive via curl
4. Confirmed repository's test infrastructure works (tests pass)

The network isolation between standalone browser contexts and the preview server appears to be a Docker/container networking configuration issue that is outside the scope of QA execution to resolve.

## Not Exercised

All acceptance criteria are marked as `not-exercised` with `blocker_category: app-not-loading` due to the browser connectivity issue described above.

### AC1: Display expiry date in saved delivery table

**Verdict**: not-exercised  
**Blocker**: Standalone Chromium cannot connect to preview server despite server running and being accessible to repository's test suite  
**Blocker Category**: app-not-loading

**Plan steps attempted**:
- Created QA driver script at `specs/61/qa-drivers/ac1-expiry-in-table.mjs`
- Script includes all numbered steps from QA plan (navigate to services, click Main Pharmacy, select product, fill expiry date, save, verify table)
- Auth helper integration configured
- Multiple connection attempts with different launch configurations

**Log**: See `specs/61/qa-logs/ac1-expiry-in-table.log`

### AC2: Expiry date column with dd/MM/yyyy format

**Verdict**: not-exercised  
**Blocker**: Same as AC1 - cannot reach application to verify date formatting  
**Blocker Category**: app-not-loading

**Plan steps not run**: All (dependent on AC1 state)

### AC3: Display "-" for missing expiry date

**Verdict**: not-exercised  
**Blocker**: Same as AC1 - cannot reach application to test null handling  
**Blocker Category**: app-not-loading

**Plan steps not run**: All (dependent on AC1 state)

### AC4: Visual distinction for expired items  

**Verdict**: not-exercised  
**Blocker**: Same as AC1 - cannot reach application to verify styling  
**Blocker Category**: app-not-loading

**Plan steps not run**: All (dependent on AC1 state)

### AC5: Mobile/responsive table behavior

**Verdict**: not-exercised  
**Blocker**: Same as AC1 - cannot reach application to test responsive behavior  
**Blocker Category**: app-not-loading

**Plan steps not run**: All (dependent on AC1 state)

## Code Inspection

While live-flow verification was blocked, the implementation can be reviewed in the diff:

**Files modified:**
- `src/pages/Facility/services/inventory/SupplyDeliveryTable.tsx` - Added expiry date column with:
  - Column header "Expiry Date" 
  - Date formatting using `formatDate(new Date(expiryDate), "dd/MM/yyyy")`
  - Null handling displaying "-" when no expiry date
  - Conditional styling: `text-red-600` for expired, `text-amber-600` for expiring within 90 days
  - Support for both internal and external delivery types

The implementation follows the established patterns in the codebase and matches the specification requirements. However, code inspection alone cannot provide `pass` verdicts - live-flow evidence is required per QA standards.

## Next Steps

To complete QA verification:
1. Resolve the container networking issue preventing standalone browser automation, OR
2. Execute QA in an environment where browsers can connect to the preview server, OR
3. Accept this partial QA report documenting the blocker

The implementation appears correct based on code review and aligns with the specification, but without live-flow evidence, formal pass verdicts cannot be issued.
