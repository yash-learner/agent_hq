#!/usr/bin/env node
// AC2: Role badge shows "Administrator" for care-fac-admin (retry with AC1 pattern)

import { chromium } from "playwright";
import fs from "fs";

const LOG_FILE = "specs/50/qa-logs/ac2-admin-badge-v2.log";
const VIDEO_DIR = "specs/50/videos-tmp";
const FACILITY_ID = "340932ac-66eb-45da-91d5-acdb4171b9d6";

function log(msg) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}\n`;
  process.stdout.write(line);
  fs.appendFileSync(LOG_FILE, line);
}

(async () => {
  log("AC2: Starting driver for administrator role badge (v2)");
  const browser = await chromium.launch({ headless: true });

  try {
    log("Attempting UI login as care-fac-admin / Ohcn@123");
    
    const size = { width: 1440, height: 900 };
    const loginContext = await browser.newContext({
      viewport: size,
      recordVideo: { dir: VIDEO_DIR, size },
    });
    
    const loginPage = await loginContext.newPage();
    await loginPage.screencast.showActions({ cursor: "pointer" });
    
    log("Navigating to /login");
    await loginPage.goto("http://localhost:4000/login");
    
    log("Filling username: care-fac-admin");
    await loginPage.getByRole("textbox", { name: /username/i }).fill("care-fac-admin");
    
    log("Filling password");
    await loginPage.getByLabel(/password/i).fill("Ohcn@123");
    
    log("Clicking login button");
    await loginPage.getByRole("button", { name: /login/i }).click();
    
    log("Waiting for navigation away from login");
    await loginPage.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 15000,
    });
    
    log("Waiting for authenticated shell");
    const hey = loginPage.getByRole("heading", { name: /^Hey .+/ });
    const sidebar = loginPage.locator('[data-sidebar="sidebar"]');
    await Promise.race([
      hey.waitFor({ state: "visible", timeout: 15000 }),
      sidebar.waitFor({ state: "visible", timeout: 15000 }),
    ]).catch(() => log("Warning: Neither Hey heading nor sidebar visible"));
    
    log("Login successful - navigating to facility overview");
    await loginPage.goto(`http://localhost:4000/facility/${FACILITY_ID}/overview`);
    
    // Wait for page to stabilize
    await loginPage.waitForTimeout(3000);
    
    log("Looking for sidebar user dropdown trigger");
    // Use same pattern as AC1 - try multiple selectors
    const triggers = [
      loginPage.getByRole("button", { name: /care-fac-admin/i }),
      loginPage.locator('[data-sidebar="sidebar"]').getByRole("button").last(),
      loginPage.locator("button").filter({ hasText: /care-fac-admin/i }),
      loginPage.locator('[class*="SidebarMenuButton"]').last(),
    ];
    
    let dropdownTrigger = null;
    for (let i = 0; i < triggers.length; i++) {
      const isVisible = await triggers[i].isVisible().catch(() => false);
      log(`Selector ${i} visible: ${isVisible}`);
      if (isVisible) {
        dropdownTrigger = triggers[i];
        break;
      }
    }
    
    if (!dropdownTrigger) {
      log("ERROR: Could not find dropdown trigger with any selector");
      throw new Error("Could not find dropdown trigger");
    }
    
    log("Found dropdown trigger, clicking to open menu");
    await dropdownTrigger.click();
    
    // Wait for dropdown menu to appear
    await loginPage.waitForTimeout(1500);
    
    // Take screenshot right after clicking
    await loginPage.screenshot({ path: "specs/50/screenshots/ac2-dropdown-open.png", fullPage: true });
    log("Screenshot saved");
    
    log("Verifying badge with 'Administrator' text is visible");
    const badge = loginPage.getByText("Administrator", { exact: false });
    const isBadgeVisible = await badge.isVisible();
    
    if (isBadgeVisible) {
      log("SUCCESS: Badge with 'Administrator' text is visible in dropdown");
    } else {
      log("FAIL: Badge with 'Administrator' text is NOT visible in dropdown");
      // Try to find any text that might be the badge
      const allText = await loginPage.locator("body").textContent();
      log(`Page contains 'administrator': ${allText?.toLowerCase().includes('administrator')}`);
    }
    
    // Keep dropdown open for video
    await loginPage.waitForTimeout(2000);
    
    log("Closing context to finalize video");
    await loginContext.close();
    
    log("AC2: Driver completed");
    process.exit(isBadgeVisible ? 0 : 1);
  } catch (error) {
    log(`ERROR: ${error.message}`);
    log(`Stack: ${error.stack}`);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
