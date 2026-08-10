/**
 * QA Driver: AC3 - End of list stops fetching
 * Tests that when all dispense orders are loaded, no additional fetch requests are made
 */

import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

const logPath = "specs/42/qa-logs/ac3-end-of-list.log";
const videoPath = "specs/42/videos/ac3-end-of-list.webm";

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logPath, logMessage);
  console.log(message);
}

async function main() {
  fs.writeFileSync(logPath, "=== AC3: End of list stops fetching ===\n");
  log("Starting AC3 test");

  const facilityId = "8983bf36-86b2-4b25-80df-5c06907a6692";
  const patientId = "d98ce1c9-fb29-4e20-9ac3-740efe4a4767";
  const encounterId = "473b2068-091e-488f-89f0-5f0b868d6890";

  const size = { width: 1440, height: 900 };
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: "tests/.auth/user.json",
    viewport: size,
    recordVideo: { dir: ".agent-hq/pw-videos", size },
  });
  const page = await context.newPage();
  await page.screencast.showActions({ cursor: "pointer" });
  log("Browser launched and configured");

  try {
    const url = `http://localhost:4000/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/medicines`;
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForSelector('[data-sidebar="sidebar"]', { timeout: 10000 });
    log("Navigation complete");

    await page.waitForTimeout(2000);

    const dispenseTab = page.getByRole("tab", { name: /dispense.?history/i });
    await dispenseTab.click();
    log("✓ Clicked Dispense History tab");
    await page.waitForTimeout(3000);

    const selector = '[data-slot="dispense-order-card"]';
    await page.waitForSelector(selector, { timeout: 10000 });

    // Scroll to load all pages
    log("Loading all pages...");
    const sidebar = page.locator('.hidden.lg\\:block.h-full.overflow-y-auto').first();
    await sidebar.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await page.waitForTimeout(3000);

    const totalCount = await page.locator(selector).count();
    log(`Total entries loaded: ${totalCount}`);

    if (totalCount === 20) {
      log("✓ All 20 entries loaded (2 pages)");
    } else {
      log(`⚠️  Expected 20, found ${totalCount}`);
    }

    // Set up network monitoring
    let requestCount = 0;
    page.on('request', (request) => {
      if (request.url().includes('/order/dispense/')) {
        requestCount++;
        log(`API request detected: ${request.url()}`);
      }
    });

    // Scroll to bottom again and wait
    log("Scrolling to bottom again and waiting 5 seconds...");
    await sidebar.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await page.waitForTimeout(5000);

    // Check for loading skeleton
    const skeletonCount = await page.locator('[data-testid="card-list-skeleton"]').count();
    if (skeletonCount === 0) {
      log("✅ SUCCESS: No loading skeleton appears at end of list");
    } else {
      log(`❌ FAIL: Loading skeleton appeared (count: ${skeletonCount})`);
    }

    // Verify no additional entries loaded
    const finalCount = await page.locator(selector).count();
    if (finalCount === totalCount) {
      log(`✅ SUCCESS: Entry count unchanged (${finalCount})`);
    } else {
      log(`❌ FAIL: Entry count changed from ${totalCount} to ${finalCount}`);
    }

    if (requestCount === 0) {
      log("✅ SUCCESS: No additional API requests made");
    } else {
      log(`⚠️  ${requestCount} API requests detected after reaching end`);
    }

    log("AC3 test completed");

  } catch (error) {
    log(`❌ ERROR: ${error.message}`);
    throw error;
  } finally {
    await page.close();
    await context.close();
    await browser.close();

    await new Promise((resolve) => setTimeout(resolve, 1000));
    const videoDir = path.join(".agent-hq", "pw-videos");
    const videos = fs.readdirSync(videoDir);
    if (videos.length > 0) {
      fs.copyFileSync(path.join(videoDir, videos[videos.length - 1]), videoPath);
      log(`✓ Video saved to ${videoPath}`);
    }
  }
}

main().catch((error) => {
  console.error("AC3 test failed:", error);
  process.exit(1);
});
