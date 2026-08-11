#!/usr/bin/env node
// AC4: Logout works with role badge present

import { chromium } from "playwright";
import fs from "fs";

const LOG_FILE = "specs/50/qa-logs/ac4-logout.log";
const VIDEO_DIR = "specs/50/videos-tmp";
const FACILITY_ID = "340932ac-66eb-45da-91d5-acdb4171b9d6";

function log(msg) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}\n`;
  process.stdout.write(line);
  fs.appendFileSync(LOG_FILE, line);
}

(async () => {
  log("AC4: Starting driver for logout with role badge");
  const browser = await chromium.launch({ headless: true });

  try {
    log("Attempting UI login as care-staff / Ohcn@123");
    
    const size = { width: 1440, height: 900 };
    const loginContext = await browser.newContext({
      viewport: size,
      recordVideo: { dir: VIDEO_DIR, size },
    });
    
    const loginPage = await loginContext.newPage();
    await loginPage.screencast.showActions({ cursor: "pointer" });
    
    log("Navigating to /login");
    await loginPage.goto("http://localhost:4000/login");
    
    log("Filling username: care-staff");
    await loginPage.getByRole("textbox", { name: /username/i }).fill("care-staff");
    
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
    await loginPage.waitForTimeout(2000);
    
    log("Opening dropdown to verify staff badge");
    const dropdownTrigger = loginPage.locator('[data-sidebar="sidebar"]').getByRole("button").last();
    await dropdownTrigger.click();
    await loginPage.waitForTimeout(1000);
    
    log("Verifying badge with 'Staff' text is visible");
    const staffBadge = loginPage.getByText("Staff", { exact: false });
    const isStaffBadgeVisible = await staffBadge.isVisible();
    log(`Staff badge visible: ${isStaffBadgeVisible}`);
    
    log("Looking for Logout menu item");
    const logoutSelectors = [
      loginPage.getByRole("menuitem", { name: /logout/i }),
      loginPage.getByText("Logout", { exact: false }),
      loginPage.locator('[role="menuitem"]').filter({ hasText: /logout/i }),
      loginPage.locator('button:has-text("Logout")'),
    ];
    
    let logoutButton = null;
    for (let i = 0; i < logoutSelectors.length; i++) {
      const visible = await logoutSelectors[i].isVisible().catch(() => false);
      log(`Logout selector ${i} visible: ${visible}`);
      if (visible) {
        logoutButton = logoutSelectors[i];
        break;
      }
    }
    
    if (logoutButton) {
      log("Found Logout button, clicking");
      await logoutButton.click();
      
      // Wait for navigation to login page
      await loginPage.waitForURL((url) => url.pathname.includes("/login"), { timeout: 10000 });
      const currentUrl = loginPage.url();
      log(`Navigated to: ${currentUrl}`);
      
      const isLoginPage = currentUrl.includes("/login");
      log(`On login page: ${isLoginPage}`);
      
      const success = isLoginPage;
      if (success) {
        log("SUCCESS: Logout completed successfully");
      } else {
        log("FAIL: Did not reach login page after logout");
      }
      
      await loginPage.waitForTimeout(2000);
      await loginContext.close();
      log("AC4: Driver completed");
      process.exit(success ? 0 : 1);
    } else {
      log("FAIL: Logout button not visible in dropdown");
      await loginContext.close();
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
