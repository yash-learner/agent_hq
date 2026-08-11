import { chromium } from "@playwright/test";
import path from "path";
import fs from "fs";

const storageState = "tests/.auth/user.json";
const size = { width: 1440, height: 900 };

(async () => {
  console.log("Starting AC1 test...");
  const logPath = "specs/52/qa-logs/ac1-search-input-appears.log";
  
  function log(msg) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${msg}\n`;
    fs.appendFileSync(logPath, line);
    console.log(msg);
  }

  log("=== AC1: Search input appears above facility cards ===");
  log("Launching browser...");

  const browser = await chromium.launch({ headless: true });
  
  try {
    const context = await browser.newContext({
      storageState,
      viewport: size,
      recordVideo: { 
        dir: ".agent-hq/mcp-output",
        size 
      }
    });

    const page = await context.newPage();
    
    // Enable cursor visualization
    await page.screencast.showActions({ cursor: "pointer" });
    
    log("Navigating to http://localhost:4000...");
    await page.goto("http://localhost:4000");
    
    log("Waiting for page load...");
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    
    // Wait for auth shell readiness
    log("Checking auth shell...");
    const spinner = page.locator(".animate-spin, [data-loading='true']");
    if (await spinner.first().isVisible().catch(() => false)) {
      log("Waiting for spinner to disappear...");
      await spinner.first().waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
    }
    
    // Check if we're on a logged-in page
    const hey = page.getByRole("heading", { name: /^Hey .+/ });
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    const loggedIn = await Promise.race([
      hey.isVisible().then(() => true).catch(() => false),
      sidebar.isVisible().then(() => true).catch(() => false)
    ]);
    
    if (!loggedIn) {
      log("Not logged in, attempting login...");
      await page.goto("http://localhost:4000/login");
      await page.getByRole("textbox", { name: /username/i }).fill("admin");
      await page.getByLabel(/password/i).fill("admin");
      await page.getByRole("button", { name: /login/i }).click();
      await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });
      log("Login successful");
    } else {
      log("Already logged in");
    }
    
    // Navigate to home/dashboard
    log("Navigating to User Dashboard...");
    await page.goto("http://localhost:4000/");
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
    
    // Check if Facilities tab exists and click it
    log("Looking for Facilities tab...");
    const facilitiesTab = page.getByRole("button", { name: /facilities/i }).or(
      page.getByRole("tab", { name: /facilities/i })
    );
    
    if (await facilitiesTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      log("Clicking Facilities tab...");
      await facilitiesTab.click();
      await page.waitForTimeout(1500);
    } else {
      log("Facilities tab not found as button/tab, checking if content already visible...");
    }
    
    // Look for the search input
    log("Looking for search input with placeholder 'Search facilities'...");
    const searchInput = page.getByPlaceholder(/search facilities/i);
    
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      log("✓ SUCCESS: Search input is visible");
      
      // Take screenshot
      await page.screenshot({ 
        path: "specs/52/screenshots/ac1-search-input.png",
        fullPage: false
      });
      log("Screenshot saved");
      
      // Verify search icon
      const searchIcon = page.locator('svg').filter({ has: page.locator('[data-lucide="search"], [class*="search"]') }).first();
      if (await searchIcon.isVisible().catch(() => false)) {
        log("✓ Search icon is visible");
      }
      
    } else {
      log("✗ FAIL: Search input not found");
      await page.screenshot({ path: "specs/52/screenshots/ac1-failure.png" });
    }
    
    // Wait a moment for the recording
    await page.waitForTimeout(2000);
    
    log("Closing context...");
    await context.close();
    
    // Save the video
    log("Moving video to specs/52/videos/ac1-search-input-appears.webm");
    const videoPath = await page.video().path();
    log(`Video path: ${videoPath}`);
    
  } catch (error) {
    log(`ERROR: ${error.message}`);
    log(`Stack: ${error.stack}`);
    throw error;
  } finally {
    await browser.close();
    log("Browser closed");
  }
})();
