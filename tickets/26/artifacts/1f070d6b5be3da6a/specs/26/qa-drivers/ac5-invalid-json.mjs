#!/usr/bin/env node
/**
 * QA Driver: AC5 - Invalid JSON logs console warning
 * Status: NOT EXERCISED - Requires build-time environment variable configuration
 * 
 * This criterion requires setting invalid REACT_NAV_LINKS before building.
 * Cannot be exercised in live QA environment with pre-built application.
 */

console.log("=== AC5: Invalid JSON warning (NOT EXERCISED) ===");
console.log("");
console.log("Blocker: missing-test-data");
console.log("Category: Build-time configuration");
console.log("");
console.log("Reason:");
console.log("  Same as AC1 - requires setting REACT_NAV_LINKS environment");
console.log("  variable with invalid JSON before building the application.");
console.log("");
console.log("Manual verification documented in qa-plan.md:");
console.log("  1. Set REACT_NAV_LINKS with invalid JSON");
console.log("  2. Rebuild application");
console.log("  3. Check browser console for warning");
console.log("  4. Verify sidebar renders without custom links");
console.log("");
console.log("Code review evidence:");
console.log("  - care.config.ts lines 425-458:");
console.log("    * Try-catch wraps JSON.parse()");
console.log("    * Validates Array.isArray(links)");
console.log("    * Filters links with missing name/url");
console.log("    * Logs console.warn() for invalid JSON");
console.log("    * Logs console.warn() for invalid link objects");
console.log("    * Returns [] on error, allowing app to continue");
console.log("");
console.log("Error handling:");
console.log("  - Invalid JSON: 'Invalid JSON format. Navigation links will not be rendered.'");
console.log("  - Not an array: 'must be a JSON array. Navigation links will not be rendered.'");
console.log("  - Missing fields: 'Each link must have name and url properties. Skipping...'");
console.log("");
process.exit(0);
