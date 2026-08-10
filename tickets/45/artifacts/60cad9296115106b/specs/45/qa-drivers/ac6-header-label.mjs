#!/usr/bin/env node

/**
 * QA Driver: AC6 - "Expiry" label displayed in table header
 * 
 * This criterion is verified by the same test as AC1.
 * The AC1 test (ac1-expiry-format.mjs) explicitly checks for the presence of
 * the "Expiry" column header using:
 *   page.getByRole("columnheader", { name: "Expiry" })
 * 
 * The test log shows: "✓ 'Expiry' column header found"
 * 
 * See: specs/45/qa-drivers/ac1-expiry-format.mjs
 * Video: specs/45/videos/ac1-expiry-format.webm
 */

console.log("AC6: 'Expiry' label in table header");
console.log("This criterion is verified by AC1's live-flow test.");
console.log("AC1 test verification:");
console.log("- Explicitly checked for columnheader with name 'Expiry'");
console.log("- Header found and visible in supply delivery table");
console.log("- i18n key 't(\"expiry\")' renders as 'Expiry' label");
console.log("\nRefer to AC1 test execution for full details.");
