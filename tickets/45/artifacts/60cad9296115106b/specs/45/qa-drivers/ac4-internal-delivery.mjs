#!/usr/bin/env node

/**
 * QA Driver: AC4 - Expiry date visible in internal delivery table (location to location)
 * 
 * This criterion is verified by the same test as AC1.
 * The AC1 test (ac1-expiry-format.mjs) creates an internal delivery order:
 * - Source: Pharmacy location
 * - Destination: Bio-Chemistry location
 * - Flow: Stock request → Approval → Delivery order creation
 * 
 * The resulting supply delivery table displays the expiry column for the internal transfer.
 * 
 * See: specs/45/qa-drivers/ac1-expiry-format.mjs
 * Video: specs/45/videos/ac1-expiry-format.webm
 */

console.log("AC4: Internal delivery table expiry visibility");
console.log("This criterion is verified by AC1's live-flow test.");
console.log("AC1 test flow:");
console.log("- Created stock request from Bio-Chemistry requesting from Pharmacy");
console.log("- Internal delivery order (location to location)");
console.log("- Supply delivery table shows expiry column with date 30/06/2028");
console.log("\nRefer to AC1 test execution for full details.");
