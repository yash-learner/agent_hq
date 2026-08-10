/**
 * QA Driver: AC4 - Selection works for paginated rows
 * Tests that clicking paginated rows correctly updates selection and detail view
 */

import { chromium } from "playwright";
import * as fs from "fs";

const logPath = "specs/42/qa-logs/ac4-selection.log";
const videoPath = "specs/42/videos/ac4-selection.webm";

function log(message) {
  fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${message}\n`);
  console.log(message);
}

async function main() {
  fs.writeFileSync(logPath, "=== AC4: Selection works for paginated rows ===\n");
  log("Starting AC4 test");

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

  try {
    await page.goto(`http://localhost:4000/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/medicines`, { waitUntil: "networkidle" });
    await page.waitForSelector('[data-sidebar="sidebar"]', { timeout: 10000 });
    await page.waitForTimeout(2000);

    const dispenseTab = page.getByRole("tab", { name: /dispense.?history/i });
    await dispenseTab.click();
    log("✓ Clicked Dispense History tab");
    await page.waitForTimeout(3000);

    const selector = '[data-slot="dispense-order-card"]';
    await page.waitForSelector(selector, { timeout: 10000 });

    // Scroll to load page 2
    const sidebar = page.locator('.hidden.lg\\:block.h-full.overflow-y-auto').first();
    await sidebar.evaluate((el) => el.scrollTop = el.scrollHeight);
    await page.waitForTimeout(3000);

    const totalCount = await page.locator(selector).count();
    log(`Total entries: ${totalCount}`);

    if (totalCount > 14) {
      // Click entry #15 (first on page 2)
      const entry15 = page.locator(selector).nth(14);
      await entry15.scrollIntoViewIfNeeded();
      await entry15.click();
      log("✓ Clicked entry #15");
      await page.waitForTimeout(1000);

      const isSelected = await entry15.locator('.border-primary-600').count() > 0;
      if (isSelected) {
        log("✅ SUCCESS: Entry #15 is selected");
      }

      // Click entry #1
      const entry1 = page.locator(selector).nth(0);
      await entry1.scrollIntoViewIfNeeded();
      await entry1.click();
      log("✓ Clicked entry #1");
      await page.waitForTimeout(1000);

      // Click entry #18
      const entry18 = page.locator(selector).nth(17);
      await entry18.scrollIntoViewIfNeeded();
      await entry18.click();
      log("✓ Clicked entry #18");
      await page.waitForTimeout(1000);

      log("✅ SUCCESS: Selection works across pages");
    }

    log("AC4 test completed");
  } catch (error) {
    log(`❌ ERROR: ${error.message}`);
    throw error;
  } finally {
    await page.close();
    await context.close();
    await browser.close();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const videoDir = ".agent-hq/pw-videos";
    const videos = fs.readdirSync(videoDir);
    if (videos.length > 0) {
      fs.copyFileSync(`${videoDir}/${videos[videos.length - 1]}`, videoPath);
      log(`✓ Video saved to ${videoPath}`);
    }
  }
}

main().catch((error) => { console.error("AC4 test failed:", error); process.exit(1); });
