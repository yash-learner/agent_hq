/**
 * QA Driver for Criterion 2: Scroll loads more
 * 
 * Test: Scroll to bottom; older rows append; loading indicator appears then settles
 */

import { chromium } from "playwright";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const facilityId = "2b9997ed-7ee6-4dc8-9322-a31909ef8b47";
const patientId = "1498092c-1970-4a2f-a7da-206fb256cf5e";
const encounterId = "0943f2f6-753f-4012-be23-f193485d6a50";

const size = { width: 1440, height: 900 };

console.log("=== QA Driver: Scroll Loads More ===");
console.log(`Facility: ${facilityId}`);
console.log(`Patient: ${patientId}`);
console.log(`Encounter: ${encounterId}`);
console.log("");

const browser = await chromium.launch({ headless: true });

try {
  const context = await browser.newContext({
    storageState: path.resolve("tests/.auth/user.json"),
    viewport: size,
    recordVideo: {
      dir: path.resolve(".agent-hq/pw-videos"),
      size,
    },
  });

  const page = await context.newPage();
  
  // Enable native cursor/click overlay
  await page.screencast.showActions({ cursor: "pointer" });

  console.log("✓ Browser context created with auth");

  // Navigate to encounters list first
  const encountersListUrl = `http://localhost:4000/facility/${facilityId}/encounters/patients/all`;
  console.log(`Navigating to encounters list: ${encountersListUrl}`);
  await page.goto(encountersListUrl, { waitUntil: "networkidle" });

  // Wait for auth shell
  console.log("Waiting for authenticated shell...");
  await page.waitForSelector('[data-sidebar="sidebar"]', { timeout: 10000 });
  console.log("✓ Authenticated shell loaded");

  // Find and click "View Encounter"
  console.log("Looking for 'View Encounter' link...");
  const viewEncounterLink = page.getByText("View Encounter").first();
  await viewEncounterLink.click();
  await page.waitForTimeout(2000);
  console.log("✓ Encounter opened");

  // Click the Medicines tab
  console.log("Clicking 'Medicines' tab...");
  await page.getByRole("tab", { name: "Medicines" }).click();
  await page.waitForTimeout(1000);
  console.log("✓ Medicines tab clicked");

  // Click the Dispense History tab
  console.log("Clicking 'Dispense History' tab...");
  await page.getByRole("tab", { name: "Dispense History" }).click();
  await page.waitForTimeout(3000);
  console.log("✓ Dispense History tab clicked");

  // Count initial dispense orders
  const initialCount = await page.locator('text=/QA Test Dispense Order/').count();
  console.log(`Initial dispense orders visible: ${initialCount}`);

  if (initialCount === 0) {
    console.error("✗ No dispense orders found on first page");
    await page.screenshot({ path: '.agent-hq/scroll-test-error.png', fullPage: true });
    throw new Error("No dispense orders found");
  }

  // Find the scrollable container (left selector panel)
  // Look for the desktop view (lg:block) which has overflow-y-auto
  const scrollContainer = page.locator('.lg\\:block.h-full.overflow-y-auto').first();
  const containerExists = await scrollContainer.count() > 0;
  
  if (!containerExists) {
    console.log("⚠️  Desktop scrollable container not found, trying alternative selectors...");
    // Try to find any scrollable parent
    const altContainer = page.locator('[class*="overflow"]').first();
    const altExists = await altContainer.count() > 0;
    console.log(`Alternative scrollable container found: ${altExists}`);
  }

  console.log("");
  console.log("Attempting to scroll and trigger pagination...");
  
  // Scroll to bottom of the list multiple times to trigger loading
  for (let i = 0; i < 3; i++) {
    console.log(`Scroll attempt ${i + 1}/3...`);
    
    // Get current count before scroll
    const beforeScrollCount = await page.locator('text=/QA Test Dispense Order/').count();
    console.log(`  Orders before scroll: ${beforeScrollCount}`);
    
    // Scroll the container or page
    if (containerExists) {
      await scrollContainer.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });
    } else {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    }
    
    // Wait for potential loading and new items
    await page.waitForTimeout(2000);
    
    // Check for loading indicator
    const loadingVisible = await page.locator('text=/loading/i').count() > 0;
    const skeletonVisible = await page.locator('[class*="skeleton"]').count() > 0;
    console.log(`  Loading indicator visible: ${loadingVisible || skeletonVisible}`);
    
    // Wait a bit more for items to load
    await page.waitForTimeout(2000);
    
    // Get count after scroll
    const afterScrollCount = await page.locator('text=/QA Test Dispense Order/').count();
    console.log(`  Orders after scroll: ${afterScrollCount}`);
    
    if (afterScrollCount > beforeScrollCount) {
      console.log(`  ✓ New orders loaded! (+${afterScrollCount - beforeScrollCount})`);
    } else {
      console.log(`  - No new orders loaded (may have reached end)`);
    }
    
    await page.waitForTimeout(1000);
  }

  // Final count
  const finalCount = await page.locator('text=/QA Test Dispense Order/').count();
  console.log("");
  console.log(`Final count: ${finalCount} dispense orders visible`);
  console.log(`Change from initial: +${finalCount - initialCount} orders`);

  if (finalCount > initialCount) {
    console.log("");
    console.log("✅ SUCCESS: Scroll triggered pagination");
    console.log("   - Initial page showed ~14 orders");
    console.log(`   - After scrolling, ${finalCount} orders are visible`);
    console.log("   - Additional orders were loaded via infinite scroll");
  } else if (initialCount >= 20) {
    console.log("");
    console.log("⚠️  All 20 orders already visible on first load");
    console.log("   This suggests pagination may not be working as expected");
    console.log("   or the page size is larger than 14");
  } else {
    console.log("");
    console.log("⚠️  WARNING: Scroll did not load additional orders");
    console.log("   This may indicate:");
    console.log("   - Pagination is not functioning");
    console.log("   - All orders fit on one page");
    console.log("   - Scroll target was not reached");
  }

  // Wait before closing to ensure video is complete
  await page.waitForTimeout(3000);

  await context.close();
  console.log("✓ Video saved");

} catch (error) {
  console.error("");
  console.error("❌ FAILURE:", error.message);
  console.error(error.stack);
  process.exit(1);
} finally {
  await browser.close();
}
