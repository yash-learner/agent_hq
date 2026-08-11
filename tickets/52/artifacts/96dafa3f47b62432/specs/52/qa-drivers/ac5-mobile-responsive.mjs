import { chromium } from "@playwright/test";
import fs from "fs";

const storageState = "tests/.auth/user.json";
// Mobile viewport: iPhone SE
const mobileSize = { width: 375, height: 667 };

(async () => {
  console.log("Starting AC5 test...");
  const logPath = "specs/52/qa-logs/ac5-mobile-responsive.log";
  
  function log(msg) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${msg}\n`;
    fs.appendFileSync(logPath, line);
    console.log(msg);
  }

  log("=== AC5: Mobile responsiveness ===");
  log("Launching browser with mobile viewport (375x667)...");

  const browser = await chromium.launch({ headless: true });
  
  try {
    const context = await browser.newContext({
      storageState,
      viewport: mobileSize,
      recordVideo: { 
        dir: ".agent-hq/mcp-output",
        size: mobileSize
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
    await page.waitForTimeout(1500);
    
    // Check if search input is visible and fits viewport
    log("Checking search input visibility and size...");
    const searchInput = page.getByPlaceholder(/search facilities/i);
    
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      log("✓ Search input is visible on mobile");
      
      const boundingBox = await searchInput.boundingBox();
      if (boundingBox) {
        log(`Search input dimensions: ${boundingBox.width}x${boundingBox.height} at (${boundingBox.x}, ${boundingBox.y})`);
        
        if (boundingBox.x + boundingBox.width <= 375) {
          log("✓ Search input fits within mobile viewport width");
        } else {
          log("⚠ Search input may overflow viewport");
        }
      }
    } else {
      log("✗ Search input not visible on mobile");
    }
    
    // Check facility cards layout (should be single column)
    log("Checking facility cards layout...");
    const facilityCards = page.locator('a[href*="/facility/"]');
    const count = await facilityCards.count();
    log(`Facility cards count: ${count}`);
    
    if (count > 1) {
      const box1 = await facilityCards.nth(0).boundingBox();
      const box2 = await facilityCards.nth(1).boundingBox();
      
      if (box1 && box2) {
        log(`Card 1 position: (${box1.x}, ${box1.y}), width: ${box1.width}`);
        log(`Card 2 position: (${box2.x}, ${box2.y}), width: ${box2.width}`);
        
        // Check if cards are stacked vertically (Y positions differ significantly)
        if (Math.abs(box2.y - box1.y) > 50) {
          log("✓ Facility cards are stacked in a single column");
        } else {
          log("⚠ Facility cards may be side-by-side");
        }
      }
    }
    
    // Test search functionality on mobile
    log("Testing search on mobile...");
    await searchInput.fill("PATIENTS");
    await page.waitForTimeout(600);
    
    const filteredCount = await facilityCards.count();
    log(`Filtered facilities: ${filteredCount}`);
    
    if (filteredCount === 1) {
      log("✓ Search filtering works on mobile");
    }
    
    // Screenshot
    await page.screenshot({ path: "specs/52/screenshots/ac5-mobile.png" });
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
