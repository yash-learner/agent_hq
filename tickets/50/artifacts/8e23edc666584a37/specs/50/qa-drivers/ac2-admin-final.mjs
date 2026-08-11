#!/usr/bin/env node
// AC2: Role badge shows "Administrator" for care-fac-admin (final attempt with proper helper)

import { chromium } from "playwright";
import { openAuthedContext } from "../../../.agent-hq/qa-auth.mjs";
import fs from "fs";

const LOG_FILE = "specs/50/qa-logs/ac2-admin-final.log";
const FACILITY_ID = "340932ac-66eb-45da-91d5-acdb4171b9d6";

function log(msg) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}\n`;
  process.stdout.write(line);
  fs.appendFileSync(LOG_FILE, line);
}

(async () => {
  log("AC2: Final attempt with openAuthedContext helper");
  const browser = await chromium.launch({ headless: true });

  try {
    log("Using openAuthedContext with care-fac-admin credentials");
    const { context, page, size } = await openAuthedContext(browser, {
      authFile: "tests/.auth/facilityAdmin.json",
      facilityId: FACILITY_ID,
      credentials: { username: "care-fac-admin", password: "Ohcn@123" },
      videoDir: "specs/50/videos-tmp",
    });
    
    await page.screencast.showActions({ cursor: "pointer" });
    log("Authenticated context opened successfully");
    
    // Wait for page to stabilize
    await page.waitForTimeout(2000);
    
    log("Looking for dropdown trigger");
    const dropdownTrigger = page.locator('[data-sidebar="sidebar"]').getByRole("button").last();
    const isTriggerVisible = await dropdownTrigger.isVisible();
    log(`Dropdown trigger visible: ${isTriggerVisible}`);
    
    if (isTriggerVisible) {
      log("Clicking dropdown trigger");
      await dropdownTrigger.click();
      await page.waitForTimeout(1500);
      
      // Take screenshot
      await page.screenshot({ path: "specs/50/screenshots/ac2-final-dropdown.png", fullPage: true });
      log("Screenshot saved");
      
      log("Looking for Administrator badge");
      const badge = page.getByText("Administrator", { exact: false });
      const isBadgeVisible = await badge.isVisible();
      log(`Administrator badge visible: ${isBadgeVisible}`);
      
      if (isBadgeVisible) {
        log("SUCCESS: Administrator badge found");
        await page.waitForTimeout(2000);
        await context.close();
        process.exit(0);
      } else {
        log("Badge not visible - checking page content");
        const bodyText = await page.locator("body").textContent();
        const hasAdmin = bodyText?.toLowerCase().includes("administrator");
        log(`Page contains 'administrator': ${hasAdmin}`);
        
        await page.waitForTimeout(2000);
        await context.close();
        log("FAIL: Administrator badge not visible");
        process.exit(1);
      }
    } else {
      log("FAIL: Dropdown trigger not visible");
      await context.close();
      process.exit(1);
    }
  } catch (error) {
    log(`ERROR: ${error.message}`);
    log(`Stack: ${error.stack}`);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
