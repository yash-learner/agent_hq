#!/usr/bin/env node
// AC2: Role badge shows "Administrator" for care-fac-admin

import { chromium } from "playwright";
import fs from "fs";

const LOG_FILE = "specs/50/qa-logs/ac2-admin-badge.log";
const VIDEO_DIR = "specs/50/videos-tmp";
const FACILITY_ID = "340932ac-66eb-45da-91d5-acdb4171b9d6";

function log(msg) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}\n`;
  process.stdout.write(line);
  fs.appendFileSync(LOG_FILE, line);
}

(async () => {
  log("AC2: Starting driver for administrator role badge");
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
    
    // Wait for page to be ready
    await loginPage.waitForTimeout(2000);
    
    log("Looking for sidebar user dropdown trigger");
    // Try to find the dropdown trigger button with user info
    const username = "care-fac-admin";
    const dropdownTriggers = [
      loginPage.getByRole("button", { name: new RegExp(username, "i") }),
      loginPage.locator(`button:has-text("${username}")`),
      loginPage.locator('[data-sidebar="sidebar"] button').last(),
      loginPage.locator('button:has(span:text-is("Yashodhara Biswas"))'),
    ];
    
    let dropdownTrigger = null;
    for (let i = 0; i < dropdownTriggers.length; i++) {
      const visible = await dropdownTriggers[i].isVisible().catch(() => false);
      log(`Trigger selector ${i} visible: ${visible}`);
      if (visible) {
        dropdownTrigger = dropdownTriggers[i];
        log(`Using selector ${i} for dropdown trigger`);
        break;
      }
    }
    
    if (!dropdownTrigger) {
      throw new Error("Dropdown trigger not visible with any selector");
    }
    
    log("Clicking dropdown trigger to open menu");
    await dropdownTrigger.click({ force: true });
    
    // Wait for dropdown content to appear
    log("Waiting for dropdown content to appear");
    const dropdownContent = loginPage.locator('[role="menu"]');
    await dropdownContent.waitFor({ state: "visible", timeout: 5000 }).catch(() => 
      log("Warning: dropdown content did not become visible")
    );
    
    await loginPage.waitForTimeout(500);
    
    log("Verifying badge with 'Administrator' text is visible");
    // Try multiple variations of the text
    const variations = [
      loginPage.getByText("Administrator", { exact: false }),
      loginPage.getByText("administrator", { exact: false }),
      loginPage.getByText("ADMINISTRATOR", { exact: false }),
      loginPage.locator("text=/administrator/i"),
    ];
    
    let isBadgeVisible = false;
    for (let i = 0; i < variations.length; i++) {
      const visible = await variations[i].isVisible().catch(() => false);
      log(`Variation ${i} ('${variations[i]}') visible: ${visible}`);
      if (visible) {
        isBadgeVisible = true;
        break;
      }
    }
    
    // Take a screenshot for debugging
    await loginPage.screenshot({ path: "specs/50/screenshots/ac2-debug-dropdown.png", fullPage: true });
    log("Screenshot saved to specs/50/screenshots/ac2-debug-dropdown.png");
    
    if (isBadgeVisible) {
      log("SUCCESS: Badge with 'Administrator' text is visible in dropdown");
    } else {
      log("FAIL: Badge with 'Administrator' text is NOT visible in dropdown");
    }
    
    // Keep dropdown open for a moment for video
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
