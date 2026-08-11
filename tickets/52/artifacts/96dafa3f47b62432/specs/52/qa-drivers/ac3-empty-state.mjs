import { chromium } from "@playwright/test";
import fs from "fs";

const storageState = "tests/.auth/user.json";
const size = { width: 1440, height: 900 };

(async () => {
  console.log("Starting AC3 test...");
  const logPath = "specs/52/qa-logs/ac3-empty-state.log";
  
  function log(msg) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${msg}\n`;
    fs.appendFileSync(logPath, line);
    console.log(msg);
  }

  log("=== AC3: Empty state when no facilities match ===");
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
    
    // Type a non-existent facility name
    log("Typing 'XYZ123NonExistentFacility' in search...");
    const searchInput = page.getByPlaceholder(/search facilities/i);
    await searchInput.fill("XYZ123NonExistentFacility");
    await page.waitForTimeout(600); // Wait for debounce + filter
    
    // Check if facility cards are gone
    const facilityCards = page.locator('a[href*="/facility/"]');
    const count = await facilityCards.count();
    log(`Facility cards count after non-existent search: ${count}`);
    
    if (count === 0) {
      log("✓ Facility grid is empty");
    }
    
    // Look for empty state message
    log("Looking for empty state message...");
    
    // Try various selectors for the empty state
    const emptyStateSelectors = [
      page.getByText(/no facilities found/i),
      page.getByText(/XYZ123NonExistentFacility/),
      page.locator('[class*="empty"]').filter({ hasText: /no facilities/i }),
      page.locator('p, div').filter({ hasText: /no facilities found/i })
    ];
    
    let foundEmptyState = false;
    for (const selector of emptyStateSelectors) {
      if (await selector.isVisible({ timeout: 2000 }).catch(() => false)) {
        const text = await selector.textContent();
        log(`✓ Found empty state: "${text?.trim()}"`);
        foundEmptyState = true;
        break;
      }
    }
    
    if (!foundEmptyState) {
      log("⚠ Empty state message not found - checking page content");
      const bodyText = await page.locator('body').textContent();
      log(`Page contains: ${bodyText?.substring(0, 200)}`);
    }
    
    // Screenshot
    await page.screenshot({ path: "specs/52/screenshots/ac3-empty-state.png" });
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
