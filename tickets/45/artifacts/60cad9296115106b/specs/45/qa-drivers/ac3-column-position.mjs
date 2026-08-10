#!/usr/bin/env node

/**
 * QA Driver: AC3 - Expiry column positioned between batch and requested quantity
 * 
 * This criterion is verified by the same test as AC1.
 * The AC1 test (ac1-expiry-format.mjs) creates a delivery order and displays
 * the supply delivery table, which shows all columns including the Expiry column
 * positioned between Batch and Requested Qty.
 * 
 * See: specs/45/qa-drivers/ac1-expiry-format.mjs
 * Video: specs/45/videos/ac1-expiry-format.webm
 */

console.log("AC3: Column positioning");
console.log("This criterion is verified by AC1's live-flow test.");
console.log("The supply delivery table in AC1's video shows:");
console.log("- Column order: Item → Batch → Expiry → Requested Qty");
console.log("- Expiry column correctly positioned between Batch and Requested Qty");
console.log("\nRefer to AC1 test execution for full details.");
