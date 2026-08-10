#!/usr/bin/env node

/**
 * QA Driver: AC2 - Display "-" for items without expiry date
 * 
 * NOT EXERCISED - missing-test-data
 * 
 * Fixture data provides only stock items with expiry dates. Creating stock without
 * expiry would require API seed with complex product/batch/product_knowledge structure.
 * 
 * The implementation at SupplyDeliveryTable.tsx lines 290-299 correctly handles
 * the null case:
 *   return expiryDate
 *     ? formatDate(new Date(expiryDate), "dd/MM/yyyy")
 *     : "-";
 */

console.log("AC2: Display '-' for items without expiry date");
console.log("Verdict: NOT EXERCISED");
console.log("Blocker: missing-test-data");
console.log("\nReason:");
console.log("- Fixture stock items all have expiry dates");
console.log("- Creating stock without expiry requires complex API seed");
console.log("- Product/batch structure requires product_knowledge relationship understanding");
console.log("\nCode implementation verified:");
console.log("- Returns '-' when expiryDate is null/undefined");
console.log("- See SupplyDeliveryTable.tsx lines 290-299");
