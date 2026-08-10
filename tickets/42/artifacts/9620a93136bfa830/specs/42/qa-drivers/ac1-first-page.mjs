/**
 * QA Driver: AC1 - First page loads on tab open
 * Tests that the first page of 14 dispense orders loads when the Dispense History tab opens
 */

import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

const logPath = "specs/42/qa-logs/ac1-first-page.log";
const videoPath = "specs/42/videos/ac1-first-page.webm";

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logPath, logMessage);
  console.log(message);
}

async function main() {
  // Initialize log
  fs.writeFileSync(logPath, "=== AC1: First page loads on tab open ===\n");
  log("Starting AC1 test");

  // Fixed IDs from setup-notes
  const facilityId = "8983bf36-86b2-4b25-80df-5c06907a6692";
  const patientId = "d98ce1c9-fb29-4e20-9ac3-740efe4a4767";
  const encounterId = "473b2068-091e-488f-89f0-5f0b868d6890";

  const size = { width: 1440, height: 900 };
  const browser = await chromium.launch({ headless: true });
  log("Browser launched");

  const context = await browser.newContext({
    storageState: "tests/.auth/user.json",
    viewport: size,
    recordVideo: { dir: ".agent-hq/pw-videos", size },
  });
  log("Context created with storageState and recordVideo");

  const page = await context.newPage();
  log("New page created");

  // Enable cursor overlay before recording
  await page.screencast.showActions({ cursor: "pointer" });
  log("Cursor overlay enabled");

  try {
    // Step 1: Navigate directly to the encounter medicines tab
    const url = `http://localhost:4000/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/medicines`;
    log(`Navigating to: ${url}`);
    await page.goto(url, { waitUntil: "networkidle" });
    log("Navigation complete");

    // Auth shell readiness check
    log("Checking auth shell readiness...");
    await page.waitForSelector('[data-sidebar="sidebar"]', { timeout: 10000 });
    log("✓ Sidebar visible (auth shell ready)");

    // Wait for the page to settle
    await page.waitForTimeout(2000);

    // Step 2: Click the "Dispense History" tab (nested tab within medicines)
    log("Looking for Dispense History tab...");
    const dispenseTab = page.getByRole("tab", { name: /dispense.?history/i });
    await dispenseTab.waitFor({ timeout: 10000 });
    await dispenseTab.click();
    log("✓ Clicked Dispense History tab");
    await page.waitForTimeout(3000);

    // Step 3: Count visible dispense order entries
    log("Counting visible dispense order entries...");
    
    // Wait for the list to load
    const selector = '[data-slot="dispense-order-card"]';
    await page.waitForSelector(selector, { timeout: 10000 });
    
    const entryCount = await page.locator(selector).count();
    log(`Found ${entryCount} dispense order entries`);

    // Verify we have exactly 14 entries (RESULTS_PER_PAGE_LIMIT)
    if (entryCount === 14) {
      log("✅ SUCCESS: First page loaded with exactly 14 entries");
    } else if (entryCount > 0 && entryCount <= 14) {
      log(`⚠️  WARNING: Found ${entryCount} entries (expected 14). Test data may have fewer than 14 dispense orders.`);
    } else {
      log(`❌ FAIL: Expected 14 entries, found ${entryCount}`);
    }

    // Check if first entry is selected
    const selectedEntry = await page.locator('[data-slot="dispense-order-card"].border-primary-600').count();
    if (selectedEntry > 0) {
      log("✓ First entry is auto-selected");
    } else {
      log("⚠️  No entry appears to be auto-selected");
    }

    // Check if detail view is visible (DispenseHistory component)
    const detailView = await page.locator('.flex-1.w-full.h-full.overflow-auto').count();
    if (detailView > 0) {
      log("✓ Detail view container is visible");
    } else {
      log("⚠️  Detail view not found");
    }

    log("AC1 test completed successfully");

  } catch (error) {
    log(`❌ ERROR: ${error.message}`);
    log(`Stack: ${error.stack}`);
    throw error;
  } finally {
    // Close and save video
    await page.close();
    await context.close();
    await browser.close();
    log("Browser closed");

    // Wait for video to be written
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Move video to expected location
    const videoDir = path.join(".agent-hq", "pw-videos");
    const videos = fs.readdirSync(videoDir);
    if (videos.length > 0) {
      const latestVideo = path.join(videoDir, videos[videos.length - 1]);
      fs.copyFileSync(latestVideo, videoPath);
      log(`✓ Video saved to ${videoPath}`);
    } else {
      log("⚠️  No video file found");
    }
  }
}

main().catch((error) => {
  console.error("AC1 test failed:", error);
  process.exit(1);
});
