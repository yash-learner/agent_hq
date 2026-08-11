#!/usr/bin/env node
// AC3: Profile navigation works with role badge visible

import { chromium } from "playwright";
import fs from "fs";

const LOG_FILE = "specs/50/qa-logs/ac3-profile-nav.log";
const VIDEO_DIR = "specs/50/videos-tmp";
const FACILITY_ID = "340932ac-66eb-45da-91d5-acdb4171b9d6";

function log(msg) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}\n`;
  process.stdout.write(line);
  fs.appendFileSync(LOG_FILE, line);
}

(async () => {
  log("AC3: Starting driver for profile navigation with role badge");
  const browser = await chromium.launch({ headless: true });

  try {
    log("Attempting UI login as care-nurse / Ohcn@123");
    
    const size = { width: 1440, height: 900 };
    const loginContext = await browser.newContext({
      viewport: size,
      recordVideo: { dir: VIDEO_DIR, size },
    });
    
    const loginPage = await loginContext.newPage();
    await loginPage.screencast.showActions({ cursor: "pointer" });
    
    log("Navigating to /login");
    await loginPage.goto("http://localhost:4000/login");
    
    log("Filling username: care-nurse");
    await loginPage.getByRole("textbox", { name: /username/i }).fill("care-nurse");
    
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
    
    log("Step 1: Opening dropdown to verify nurse badge");
    const dropdownTrigger = loginPage.locator('[data-sidebar="sidebar"]').getByRole("button").last();
    await dropdownTrigger.click();
    await loginPage.waitForTimeout(1000);
    
    // Take screenshot to see what's in the dropdown
    await loginPage.screenshot({ path: "specs/50/screenshots/ac3-dropdown-open.png", fullPage: true });
    log("Screenshot saved");
    
    log("Verifying badge with 'Nurse' text is visible");
    const nurseBadge = loginPage.getByText("Nurse", { exact: false });
    const isNurseBadgeVisible = await nurseBadge.isVisible();
    log(`Nurse badge visible: ${isNurseBadgeVisible}`);
    
    log("Step 2: Looking for Profile menu item");
    // Try multiple selectors for Profile link
    const profileSelectors = [
      loginPage.getByRole("menuitem", { name: /profile/i }),
      loginPage.getByText("Profile", { exact: false }),
      loginPage.locator('[role="menuitem"]').filter({ hasText: /profile/i }),
      loginPage.locator('a:has-text("Profile")'),
    ];
    
    let profileLink = null;
    for (let i = 0; i < profileSelectors.length; i++) {
      const visible = await profileSelectors[i].isVisible().catch(() => false);
      log(`Profile selector ${i} visible: ${visible}`);
      if (visible) {
        profileLink = profileSelectors[i];
        break;
      }
    }
    
    if (profileLink) {
      log("Found Profile link, clicking");
      await profileLink.click();
      log("Clicked Profile link");
      
      // Wait for navigation to profile page
      await loginPage.waitForURL((url) => url.pathname.includes("/users/"), { timeout: 5000 });
      const currentUrl = loginPage.url();
      log(`Navigated to: ${currentUrl}`);
      
      // Verify we're on the profile page
      const isProfilePage = currentUrl.includes("/users/care-nurse");
      log(`On profile page: ${isProfilePage}`);
      
      log("Step 3: Opening dropdown again to verify badge still visible");
      await loginPage.waitForTimeout(1000);
      const dropdownTrigger2 = loginPage.locator('[data-sidebar="sidebar"]').getByRole("button").last();
      await dropdownTrigger2.click();
      await loginPage.waitForTimeout(1000);
      
      const nurseBadge2 = loginPage.getByText("Nurse", { exact: false });
      const isNurseBadgeVisible2 = await nurseBadge2.isVisible();
      log(`Nurse badge still visible after navigation: ${isNurseBadgeVisible2}`);
      
      const success = isNurseBadgeVisible && isProfilePage && isNurseBadgeVisible2;
      if (success) {
        log("SUCCESS: Profile navigation works and badge remains visible");
      } else {
        log("FAIL: One or more checks failed");
      }
      
      await loginPage.waitForTimeout(2000);
      await loginContext.close();
      log("AC3: Driver completed");
      process.exit(success ? 0 : 1);
    } else {
      log("FAIL: Profile link not visible in dropdown");
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
