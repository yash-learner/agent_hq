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
  console.log("🎬 Starting QA Driver: Short list does not trigger fetch loop — Desktop");
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

  // Track API requests to dispense order endpoint
  const apiRequests = [];
  page.on('request', request => {
    if (request.url().includes('/order/dispense/') && request.method() === 'GET') {
      const url = new URL(request.url());
      const offset = url.searchParams.get('offset');
      apiRequests.push({ timestamp: Date.now(), offset, url: request.url() });
      console.log(`📡 API Request: offset=${offset}`);
    }
  });

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
    await page.waitForTimeout(3000);
    const sidebarVisible = await page.locator('[data-sidebar="sidebar"]').isVisible({ timeout: 5000 }).catch(() => false);
    if (sidebarVisible) {
      console.log("✅ Auth shell loaded (sidebar visible)");
    } else {
      console.log("⚠️ Sidebar not detected, checking page loaded...");
      // Check if we're on the medicines page by looking for tabs
      await page.waitForSelector('[role="tablist"]', { timeout: 10000 });
      console.log("✅ Page loaded (tabs visible)");
    }

    // Click Dispense History tab
    console.log("🔍 Looking for Dispense History tab...");
    await page.getByRole("tab", { name: /dispense.*history/i }).click();
    await page.waitForTimeout(2000);
    console.log("✅ Dispense History tab clicked");

    // Wait for initial load
    console.log("⏳ Waiting for initial load...");
    await page.waitForSelector('.space-y-2 > .rounded-md', { timeout: 10000 });
    await page.waitForTimeout(2000);

    const requestCountBefore = apiRequests.length;
    console.log(`📊 API requests so far: ${requestCountBefore}`);

    // Find the scrollable container
    const scrollableContainer = page.locator('.h-full.overflow-y-auto').first();
    
    // Scroll to the bottom multiple times to load all data
    console.log("📜 Scrolling to load all data...");
    for (let i = 0; i < 3; i++) {
      await scrollableContainer.evaluate((el) => {
        el.scrollTo(0, el.scrollHeight);
      });
      await page.waitForTimeout(2000);
    }

    const requestCountAfter = apiRequests.length;
    console.log(`📊 API requests after scrolling: ${requestCountAfter}`);

    // Now wait and monitor for any additional requests (should be none)
    console.log("⏳ Monitoring for 5 seconds to detect infinite loops...");
    const monitorStart = Date.now();
    const requestCountStart = apiRequests.length;
    
    await page.waitForTimeout(5000);

    const requestCountEnd = apiRequests.length;
    const additionalRequests = requestCountEnd - requestCountStart;

    console.log(`📊 Additional requests during monitoring: ${additionalRequests}`);

    if (additionalRequests === 0) {
      console.log("✅ No infinite loop detected - no additional requests after all data loaded");
      console.log("✅ Criterion 4 passed: Short list does not trigger fetch loop");
    } else {
      console.log(`⚠️ ${additionalRequests} additional requests detected during monitoring`);
      console.log("⚠️ Possible infinite loop or repeated fetching");
      
      // Show the requests
      const recentRequests = apiRequests.slice(requestCountStart);
      console.log("Recent requests:", recentRequests);
    }

    // Summary of all requests
    console.log("\n📋 Request summary:");
    console.log(`Total API requests: ${apiRequests.length}`);
    console.log(`Unique offsets requested:`, [...new Set(apiRequests.map(r => r.offset))]);

    // Wait for final recording
    await page.waitForTimeout(2000);
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
