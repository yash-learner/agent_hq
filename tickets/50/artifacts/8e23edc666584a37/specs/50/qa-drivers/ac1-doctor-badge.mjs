#!/usr/bin/env node
// AC1: Role badge displays for facility user with doctor role

import { chromium } from "playwright";
import { openAuthedContext, uiLogin } from "../../../.agent-hq/qa-auth.mjs";
import fs from "fs";

const LOG_FILE = "specs/50/qa-logs/ac1-doctor-badge.log";
const VIDEO_DIR = "specs/50/videos-tmp";
const FACILITY_ID = "340932ac-66eb-45da-91d5-acdb4171b9d6";

function log(msg) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}\n`;
  process.stdout.write(line);
  fs.appendFileSync(LOG_FILE, line);
}

(async () => {
  log("AC1: Starting driver for doctor role badge");
  const browser = await chromium.launch({ headless: true });

  try {
    log("Attempting UI login as care-doctor / Ohcn@123");
    
    // First, we need to create a context to login with care-doctor
    const size = { width: 1440, height: 900 };
    const loginContext = await browser.newContext({
      viewport: size,
      recordVideo: { dir: VIDEO_DIR, size },
    });
    
    const loginPage = await loginContext.newPage();
    await loginPage.screencast.showActions({ cursor: "pointer" });
    
    log("Navigating to /login");
    await loginPage.goto("http://localhost:4000/login");
    
    log("Filling username: care-doctor");
    await loginPage.getByRole("textbox", { name: /username/i }).fill("care-doctor");
    
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
    
    // Debug: take a screenshot to see what's on the page
    await loginPage.screenshot({ path: "specs/50/screenshots/ac1-debug-after-login.png", fullPage: true });
    log("Screenshot saved to specs/50/screenshots/ac1-debug-after-login.png");
    
    // Debug: log page title and URL
    const title = await loginPage.title();
    const url = loginPage.url();
    log(`Page title: ${title}`);
    log(`Page URL: ${url}`);
    
    // Debug: check if sidebar is visible
    const sidebarElem = loginPage.locator('[data-sidebar="sidebar"]');
    const isSidebarVisible = await sidebarElem.isVisible().catch(() => false);
    log(`Sidebar visible: ${isSidebarVisible}`);
    
    log("Looking for sidebar user dropdown trigger");
    // Try multiple selectors to find the dropdown trigger
    const triggers = [
      loginPage.getByRole("button", { name: /care-doctor/i }),
      loginPage.locator('[data-sidebar="sidebar"]').getByRole("button").last(),
      loginPage.locator("button").filter({ hasText: /care-doctor/i }),
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
      // Take another screenshot
      await loginPage.screenshot({ path: "specs/50/screenshots/ac1-debug-no-trigger.png", fullPage: true });
      throw new Error("Could not find dropdown trigger");
    }
    
    log("Found dropdown trigger, clicking to open menu");
    await dropdownTrigger.click();
    
    // Wait for dropdown to open
    await loginPage.waitForTimeout(1000);
    
    log("Verifying badge with 'Doctor' text is visible");
    const badge = loginPage.getByText("Doctor", { exact: false });
    const isBadgeVisible = await badge.isVisible();
    
    if (isBadgeVisible) {
      log("SUCCESS: Badge with 'Doctor' text is visible in dropdown");
    } else {
      log("FAIL: Badge with 'Doctor' text is NOT visible in dropdown");
    }
    
    // Keep dropdown open for a moment for video
    await loginPage.waitForTimeout(2000);
    
    log("Closing context to finalize video");
    await loginContext.close();
    
    log("AC1: Driver completed");
    process.exit(isBadgeVisible ? 0 : 1);
  } catch (error) {
    log(`ERROR: ${error.message}`);
    log(`Stack: ${error.stack}`);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
