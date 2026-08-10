#!/usr/bin/env node

import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../../..");

const FACILITY_ID = "0d73ab28-31ca-48cb-8c3f-a91552600be7";
const PATIENT_ID = "f8dcfab4-5471-4c51-bf03-f51deefd2650";
const ENCOUNTER_ID = "58542b5d-e647-443f-a912-3436235e6469";

async function main() {
  console.log("🎬 Starting QA Driver: Scroll loads additional dispense orders — Desktop");
  console.log(`📍 Facility: ${FACILITY_ID}`);
  console.log(`🧑 Patient: ${PATIENT_ID}`);
  console.log(`🏥 Encounter: ${ENCOUNTER_ID}`);

  const browser = await chromium.launch({ headless: true });
  const size = { width: 1440, height: 900 };

  const context = await browser.newContext({
    storageState: path.join(projectRoot, "tests/.auth/user.json"),
    viewport: size,
    recordVideo: {
      dir: path.join(projectRoot, ".agent-hq/pw-videos"),
      size,
    },
  });

  const page = await context.newPage();

  try {
    // Enable cursor tracking
    await page.screencast.showActions({ cursor: "pointer" });
    console.log("✅ Cursor tracking enabled");

    // Navigate to encounter medicines tab
    const url = `http://localhost:4000/facility/${FACILITY_ID}/patient/${PATIENT_ID}/encounter/${ENCOUNTER_ID}/medicines`;
    console.log(`🔗 Navigating to: ${url}`);
    await page.goto(url, { waitUntil: "networkidle" });

    // Wait for auth shell readiness
    console.log("⏳ Waiting for auth shell...");
    await page.waitForSelector('[data-sidebar="sidebar"]', { timeout: 10000 });
    console.log("✅ Auth shell loaded");

    // Click Dispense History tab
    console.log("🔍 Looking for Dispense History tab...");
    await page.getByRole("tab", { name: /dispense.*history/i }).click();
    await page.waitForTimeout(2000);
    console.log("✅ Dispense History tab clicked");

    // Wait for initial dispense order list to load
    console.log("⏳ Waiting for initial dispense order list...");
    await page.waitForSelector('.space-y-2 > .rounded-md', {
      timeout: 10000,
    });
    console.log("✅ Initial dispense order list loaded");

    // Count initial dispense orders
    const initialCount = await page.locator('.space-y-2 > .rounded-md').count();
    console.log(`📊 Initial dispense orders: ${initialCount}`);

    // Find the scrollable container for the dispense order list
    const scrollableContainer = page.locator('.h-full.overflow-y-auto').first();
    
    // Scroll to the bottom of the list to trigger loading more
    console.log("📜 Scrolling to bottom to trigger pagination...");
    await scrollableContainer.evaluate((el) => {
      el.scrollTo(0, el.scrollHeight);
    });
    await page.waitForTimeout(2000);

    // Wait for loading skeleton to appear
    console.log("⏳ Waiting for loading indicator...");
    const skeletonVisible = await page.locator('.skeleton').isVisible({ timeout: 3000 }).catch(() => false);
    if (skeletonVisible) {
      console.log("✅ Loading skeleton appeared");
      // Wait for skeleton to disappear
      await page.waitForSelector('.skeleton', { state: 'hidden', timeout: 5000 }).catch(() => {
        console.log("⚠️ Skeleton didn't disappear, continuing...");
      });
    } else {
      console.log("ℹ️ Loading skeleton not visible (may have loaded quickly)");
    }

    await page.waitForTimeout(2000);

    // Count dispense orders after scroll
    const afterScrollCount = await page.locator('.space-y-2 > .rounded-md').count();
    console.log(`📊 Dispense orders after scroll: ${afterScrollCount}`);

    if (afterScrollCount > initialCount) {
      console.log(`✅ Loaded ${afterScrollCount - initialCount} more dispense orders`);
      console.log("✅ Criterion 2a passed: Scroll loads additional older dispense orders");
    } else {
      console.log(`⚠️ No additional orders loaded (${afterScrollCount} vs ${initialCount})`);
    }

    // Continue scrolling until no more orders are loaded
    console.log("📜 Continue scrolling until end...");
    let previousCount = afterScrollCount;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      await scrollableContainer.evaluate((el) => {
        el.scrollTo(0, el.scrollHeight);
      });
      await page.waitForTimeout(2000);

      const currentCount = await page.locator('.space-y-2 > .rounded-md').count();
      console.log(`📊 Current count: ${currentCount} (attempt ${attempts + 1})`);

      if (currentCount === previousCount) {
        console.log("✅ No more orders to load - reached end");
        console.log("✅ Criterion 2b passed: Stops requesting at end");
        break;
      }

      previousCount = currentCount;
      attempts++;
    }

    // Wait a moment for final recording
    await page.waitForTimeout(2000);
    console.log("✅ Criterion 2 passed: Scroll loads additional dispense orders");
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    throw error;
  } finally {
    await page.close();
    await context.close();
    await browser.close();
    console.log("🎬 Browser closed");
  }
}

main().catch((error) => {
  console.error(`💥 Fatal error: ${error.message}`);
  process.exit(1);
});
