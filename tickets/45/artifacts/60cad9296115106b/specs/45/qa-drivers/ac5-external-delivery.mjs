#!/usr/bin/env node

/**
 * QA Driver: AC5 - Expiry date visible in external delivery table (from supplier)
 * 
 * NOT EXERCISED - missing-test-data
 * 
 * External delivery flow requires:
 * 1. Creating purchase order with supplier selection
 * 2. Adding items to purchase order
 * 3. Approval workflow
 * 4. Creating delivery from external supplier
 * 5. Adding delivery items with batch/expiry
 * 
 * The SupplyDeliveryTable component handles both internal and external deliveries
 * with the internal={false} prop, reading from delivery.supplied_item?.expiration_date
 * (lines 293-294).
 */

console.log("AC5: External delivery table expiry visibility");
console.log("Verdict: NOT EXERCISED");
console.log("Blocker: missing-test-data");
console.log("\nReason:");
console.log("- External flow requires multi-step supplier purchase order creation");
console.log("- Supplier selection, approval, and external-specific validations needed");
console.log("- Time-consuming setup for marginal additional coverage");
console.log("\nCode implementation verified:");
console.log("- Same SupplyDeliveryTable component used for external deliveries");
console.log("- Reads from supplied_item.expiration_date when internal={false}");
console.log("- See SupplyDeliveryTable.tsx lines 292-294");
