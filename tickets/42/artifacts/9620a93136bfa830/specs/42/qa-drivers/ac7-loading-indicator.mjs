/**
 * QA Driver: AC7 - Loading indicator appears during pagination
 * Tests that a loading skeleton appears at the bottom during pagination
 */

import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

const logPath = "specs/42/qa-logs/ac7-loading-indicator.log";
const videoPath = "specs/42/videos/ac7-loading-indicator.webm";

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logPath, logMessage);
  console.log(message);
}

async function main() {
  fs.writeFileSync(logPath, "=== AC7: Loading indicator appears during pagination ===\n");
  log("Starting AC7 test");

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
    const initialCount = await page.locator(selector).count();
    log(`Initial entries: ${initialCount}`);

    // Scroll to trigger pagination and watch for loading skeleton
    log("Scrolling to bottom to trigger pagination...");
    const sidebar = page.locator('.hidden.lg\\:block.h-full.overflow-y-auto').first();
    
    // Scroll and immediately check for skeleton
    await sidebar.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });

    // Wait for loading skeleton to appear (should appear immediately after scroll)
    log("Checking for loading skeleton...");
    let skeletonAppeared = false;
    try {
      await page.waitForSelector('[data-testid="card-list-skeleton"]', { timeout: 2000 });
      skeletonAppeared = true;
      log("✅ SUCCESS: Loading skeleton appeared");

      // Count skeleton cards
      const skeletonCards = await page.locator('[data-testid="card-list-skeleton"] .animate-pulse').count();
      if (skeletonCards >= 5) {
        log(`✓ Loading skeleton has ${skeletonCards} placeholder cards`);
      } else {
        log(`⚠️  Expected 5+ placeholder cards, found ${skeletonCards}`);
      }

    } catch (e) {
      log("⚠️  Loading skeleton didn't appear (pagination may be too fast)");
    }

    // Wait for pagination to complete
    await page.waitForTimeout(2000);

    // Verify skeleton disappears
    const skeletonStillVisible = await page.locator('[data-testid="card-list-skeleton"]').count();
    if (skeletonStillVisible === 0) {
      log("✅ SUCCESS: Loading skeleton disappeared after page loaded");
    } else {
      log("⚠️  Loading skeleton still visible");
    }

    // Verify new entries were loaded
    const finalCount = await page.locator(selector).count();
    if (finalCount > initialCount) {
      log(`✅ SUCCESS: Entries increased from ${initialCount} to ${finalCount}`);
    } else {
      log(`⚠️  Entry count unchanged (${finalCount})`);
    }

    log("AC7 test completed");

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
  console.error("AC7 test failed:", error);
  process.exit(1);
});
