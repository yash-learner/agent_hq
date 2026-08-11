import { chromium } from "@playwright/test";
import fs from "fs";

const storageState = "tests/.auth/user.json";
const size = { width: 1440, height: 900 };

(async () => {
  console.log("Starting AC4 test...");
  const logPath = "specs/52/qa-logs/ac4-clear-search.log";
  
  function log(msg) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${msg}\n`;
    fs.appendFileSync(logPath, line);
    console.log(msg);
  }

  log("=== AC4: Clearing search restores full list ===");
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
    await page.screencast.showActions({ cursor: "pointer" });
    
    log("Navigating to http://localhost:4000...");
    await page.goto("http://localhost:4000");
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    
    log("Clicking Facilities tab...");
    const facilitiesTab = page.getByRole("button", { name: /facilities/i }).or(
      page.getByRole("tab", { name: /facilities/i })
    );
    await facilitiesTab.click();
    await page.waitForTimeout(1000);
    
    const facilityCards = page.locator('a[href*="/facility/"]');
    const searchInput = page.getByPlaceholder(/search facilities/i);
    
    // Count initial facilities
    const initialCount = await facilityCards.count();
    log(`Initial facility count: ${initialCount}`);
    
    // Test 1: Filter and then click clear button
    log("Test 1: Typing 'PATIENTS' to filter...");
    await searchInput.fill("PATIENTS");
    await page.waitForTimeout(500);
    
    const filteredCount = await facilityCards.count();
    log(`Filtered facility count: ${filteredCount}`);
    
    // Look for clear button (X icon)
    log("Looking for clear button...");
    const clearButton = page.locator('button').filter({ has: page.locator('[data-lucide="x"], [class*="clear"]') }).or(
      searchInput.locator('~ button, + button')
    ).or(
      page.locator('button[aria-label*="clear" i], button[title*="clear" i]')
    );
    
    if (await clearButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      log("✓ Clear button is visible");
      await clearButton.click();
      await page.waitForTimeout(500);
      
      const afterClearCount = await facilityCards.count();
      log(`Facilities after clicking clear button: ${afterClearCount}`);
      
      if (afterClearCount === initialCount) {
        log("✓ Clear button restored full list");
      } else {
        log(`⚠ Clear button did not fully restore (expected ${initialCount}, got ${afterClearCount})`);
      }
      
      // Check if input is empty
      const inputValue = await searchInput.inputValue();
      log(`Search input value after clear: "${inputValue}"`);
    } else {
      log("⚠ Clear button not found");
    }
    
    // Test 2: Type again and manually clear with backspace
    log("Test 2: Typing 'secondary' and clearing manually...");
    await searchInput.fill("secondary");
    await page.waitForTimeout(500);
    
    const filteredCount2 = await facilityCards.count();
    log(`Filtered facility count: ${filteredCount2}`);
    
    log("Clearing input manually with backspace...");
    await searchInput.clear();
    await page.waitForTimeout(500);
    
    const afterManualClearCount = await facilityCards.count();
    log(`Facilities after manual clear: ${afterManualClearCount}`);
    
    if (afterManualClearCount === initialCount) {
      log("✓ Manual clear restored full list");
    }
    
    // Screenshot
    await page.screenshot({ path: "specs/52/screenshots/ac4-cleared.png" });
    log("Screenshot saved");
    
    await page.waitForTimeout(2000);
    await context.close();
    
    const videoPath = await page.video().path();
    log(`Video path: ${videoPath}`);
    
  } catch (error) {
    log(`ERROR: ${error.message}`);
    throw error;
  } finally {
    await browser.close();
    log("Browser closed");
  }
})();
