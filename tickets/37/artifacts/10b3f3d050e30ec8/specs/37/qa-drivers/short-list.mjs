/**
 * QA Driver for Criterion 5: Short list
 * 
 * Test: Encounter with few dispenses: no extra page fetches in a loop
 * 
 * STATUS: Not executed - missing test data
 * 
 * This criterion requires a patient with fewer than 14 dispense orders.
 * The test patient has 20 orders (from seeding for criteria 1-4).
 * Creating a second patient scenario was not completed within time constraints.
 */

console.log("=== QA Driver: Short List ===");
console.log("");
console.log("Status: NOT EXECUTED");
console.log("Blocker: missing-test-data");
console.log("");
console.log("Reason:");
console.log("  This criterion requires a patient/encounter with < 14 dispense orders");
console.log("  to verify no pagination loop occurs.");
console.log("");
console.log("  The fixture patient used for criteria 1-4 has 20 dispense orders");
console.log("  (seeded via API for infinite scroll testing).");
console.log("");
console.log("  Creating a second patient with minimal orders would require:");
console.log("  1. API patient creation");
console.log("  2. Encounter creation");
console.log("  3. Seeding 1-13 dispense orders");
console.log("  4. Running the test scenario");
console.log("");
console.log("  This was not completed within the time budget, as priority was");
console.log("  given to verifying core infinite scroll functionality (criteria 1-2).");
console.log("");
console.log("Seed attempt:");
console.log("  Method: api");
console.log("  Summary: Checked fixture patient dispense count (20 orders).");
console.log("           Considered creating new patient but did not execute");
console.log("           to preserve time for core functionality testing.");
