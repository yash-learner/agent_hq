#!/usr/bin/env node
import { chromium } from "playwright";
import { getFacilityId } from "../../../tests/support/facilityId.ts";

async function main() {
  console.log("=== AC1 ===");
  const browser = await chromium.launch();
  try {
    const facilityId = getFacilityId();
    const size = { width: 1440, height: 900 };
    const context = await browser.newContext({
      storageState: "tests/.auth/user.json",
      viewport: size,
      recordVideo: { dir: ".agent-hq/pw-videos", size },
    });
    const page = await context.newPage();
    await page.screencast.showActions({ cursor: "pointer" });
    await page.goto(`http://localhost:4000/facility/${facilityId}/patients`);
    await page.waitForTimeout(2000);
    const searchInput = page.locator('input').first();
    await searchInput.fill("ma");
    await page.waitForTimeout(2500);
    await page.locator('table tbody tr').first().waitFor({ timeout: 15000 });
    const countLine = page.locator('div.mb-3').filter({ hasText: /\d+ result/i });
    const countText = await countLine.textContent();
    const rowCount = await page.locator('table tbody tr').count();
    console.log(`Count: "${countText}", Rows: ${rowCount}`);
    await page.waitForTimeout(1000);
    await context.close();
  } catch (err) {
    console.error("FAIL:", err.message);
    throw err;
  } finally {
    await browser.close();
  }
}
main().catch(() => process.exit(1));
