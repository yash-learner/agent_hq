import { chromium } from "@playwright/test";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FACILITY_ID = "f3e73e98-23fc-4d1f-8666-d687ab18132a";
const BASE_URL = "http://localhost:4000";

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    storageState: "tests/.auth/user.json",
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: ".agent-hq/pw-videos",
      size: { width: 1440, height: 900 },
    },
  });

  const page = await context.newPage();
  
  // Enable cursor/click overlay
  await page.screencast.showActions({ cursor: "pointer" });

  console.log("Navigating to homepage first to establish session...");
  await page.goto(`${BASE_URL}/`, { 
    waitUntil: "networkidle",
    timeout: 30000
  });
  
  await page.waitForTimeout(2000);
  
  // Check if we're logged in
  const isOnLogin = page.url().includes('/login');
  console.log("On login page?", isOnLogin);
  
  if (isOnLogin) {
    console.log("ERROR: Auth session not established - user.json may be expired");
    await page.screenshot({ path: "specs/13/screenshots/ac1-auth-error.png" });
    throw new Error("Authentication failed - tokens may be expired");
  }

  console.log("Navigating to services page...");
  await page.goto(`${BASE_URL}/facility/${FACILITY_ID}/services`, { 
    waitUntil: "networkidle",
    timeout: 30000
  });

  console.log("Page loaded, waiting for React to hydrate...");
  await page.waitForTimeout(3000);
  
  // Debug: take screenshot
  await page.screenshot({ path: "specs/13/screenshots/ac1-loaded.png", fullPage: true });
  console.log("Screenshot saved");
  
  // Debug: check what's on the page
  const pageText = await page.evaluate(() => document.body.innerText);
  console.log("Page text (first 800 chars):", pageText.substring(0, 800));
  
  // Check if we're on the right page
  const url = page.url();
  console.log("Current URL:", url);

  console.log("Checking search input visibility...");
  // Verify search input is visible
  const searchInput = page.getByPlaceholder("Search healthcare services...");
  await searchInput.waitFor({ state: "visible", timeout: 15000 });
  
  // Highlight the search input by clicking on it
  await searchInput.click();
  await page.waitForTimeout(2000);

  // Verify search icon
  const searchIcon = page.locator('[class*="l-search"]').first();
  await searchIcon.waitFor({ state: "visible" });

  console.log("✅ AC1: Search input field appears on page load - PASS");

  // Keep visible for recording
  await page.waitForTimeout(2000);

  await page.close();
  await context.close();
  await browser.close();

  console.log("Recording complete");
})();
