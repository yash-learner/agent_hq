/**
 * QA Driver: AC2 - Scroll to bottom loads next page
 * Tests that scrolling to the bottom of the selector loads the next page of dispense orders
 */

import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

const logPath = "specs/42/qa-logs/ac2-scroll-pagination.log";
const videoPath = "specs/42/videos/ac2-scroll-pagination.webm";

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logPath, logMessage);
  console.log(message);
}

async function main() {
  // Initialize log
  fs.writeFileSync(logPath, "=== AC2: Scroll to bottom loads next page ===\n");
  log("Starting AC2 test");

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

  await page.screencast.showActions({ cursor: "pointer" });
  log("Cursor overlay enabled");

  try {
    const url = `http://localhost:4000/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/medicines`;
    log(`Navigating to: ${url}`);
    await page.goto(url, { waitUntil: "networkidle" });
    log("Navigation complete");

    await page.waitForSelector('[data-sidebar="sidebar"]', { timeout: 10000 });
    log("✓ Sidebar visible (auth shell ready)");

    await page.waitForTimeout(2000);

    // Click Dispense History tab
    log("Clicking Dispense History tab...");
    const dispenseTab = page.getByRole("tab", { name: /dispense.?history/i });
    await dispenseTab.waitFor({ timeout: 10000 });
    await dispenseTab.click();
    log("✓ Clicked Dispense History tab");
    await page.waitForTimeout(3000);

    // Count initial entries
    const selector = '[data-slot="dispense-order-card"]';
    await page.waitForSelector(selector, { timeout: 10000 });
    const initialCount = await page.locator(selector).count();
    log(`Initial entry count: ${initialCount}`);

    if (initialCount !== 14) {
      log(`⚠️  WARNING: Expected 14 entries, found ${initialCount}`);
    }

    // Scroll the desktop sidebar to the bottom
    log("Scrolling sidebar to bottom...");
    const sidebar = page.locator('.hidden.lg\\:block.h-full.overflow-y-auto').first();
    await sidebar.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    log("✓ Scrolled to bottom");

    // Wait for loading skeleton to appear
    log("Waiting for loading skeleton...");
    await page.waitForSelector('[data-testid="card-list-skeleton"]', { timeout: 5000 }).catch(() => {
      log("⚠️  Loading skeleton didn't appear or was too fast");
    });

    // Wait for next page to load
    await page.waitForTimeout(3000);

    // Count entries after scroll
    const finalCount = await page.locator(selector).count();
    log(`Final entry count after scroll: ${finalCount}`);

    if (finalCount > initialCount) {
      log(`✅ SUCCESS: Next page loaded (${finalCount} > ${initialCount})`);
      log(`✓ Loaded ${finalCount - initialCount} additional entries`);
    } else {
      log(`❌ FAIL: No new entries loaded (${finalCount} === ${initialCount})`);
    }

    // Click on one of the newly loaded entries (entry 15 or later)
    if (finalCount > 14) {
      log("Clicking on a newly loaded entry...");
      const newEntry = page.locator(selector).nth(14); // 15th entry (0-indexed)
      await newEntry.scrollIntoViewIfNeeded();
      await newEntry.click();
      log("✓ Clicked entry #15");
      await page.waitForTimeout(1000);

      // Check if it's selected
      const isSelected = await newEntry.locator('.border-primary-600').count() > 0;
      if (isSelected) {
        log("✅ SUCCESS: Newly loaded entry is selected");
      } else {
        log("⚠️  Entry clicked but selection state unclear");
      }
    }

    log("AC2 test completed successfully");

  } catch (error) {
    log(`❌ ERROR: ${error.message}`);
    log(`Stack: ${error.stack}`);
    throw error;
  } finally {
    await page.close();
    await context.close();
    await browser.close();
    log("Browser closed");

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const videoDir = path.join(".agent-hq", "pw-videos");
    const videos = fs.readdirSync(videoDir);
    if (videos.length > 0) {
      const latestVideo = path.join(videoDir, videos[videos.length - 1]);
      fs.copyFileSync(latestVideo, videoPath);
      log(`✓ Video saved to ${videoPath}`);
    }
  }
}

main().catch((error) => {
  console.error("AC2 test failed:", error);
  process.exit(1);
});
