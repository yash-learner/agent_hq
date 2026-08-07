#!/usr/bin/env node
/**
 * QA Driver: AC1 - Environment-configured links appear in sidebar
 * Status: NOT EXERCISED - Requires build-time environment variable configuration
 * 
 * This criterion requires setting REACT_NAV_LINKS before building the app.
 * Cannot be exercised in live QA environment with pre-built application.
 */

console.log("=== AC1: Environment-configured links (NOT EXERCISED) ===");
console.log("");
console.log("Blocker: missing-test-data");
console.log("Category: Build-time configuration");
console.log("");
console.log("Reason:");
console.log("  This AC requires setting REACT_NAV_LINKS environment variable");
console.log("  before building the application. The QA environment has a");
console.log("  pre-built app and cannot inject environment variables at runtime.");
console.log("");
console.log("Manual verification steps documented in qa-plan.md:");
console.log("  1. Set REACT_NAV_LINKS with custom JSON");
console.log("  2. Rebuild application (npm run build)");
console.log("  3. Verify custom links appear in sidebar");
console.log("");
console.log("Code review evidence:");
console.log("  - care.config.ts: Parses REACT_NAV_LINKS with validation");
console.log("  - facility-nav.tsx: Merges envLinks into navigation");
console.log("  - admin-nav.tsx: Merges envLinks into navigation");
console.log("");
console.log("Automated coverage:");
console.log("  - tests/sidebar/navLinks.spec.ts validates baseline structure");
console.log("");
process.exit(0);
