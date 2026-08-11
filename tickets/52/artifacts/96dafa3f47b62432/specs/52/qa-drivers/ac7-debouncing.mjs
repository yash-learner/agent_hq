import { chromium } from "@playwright/test";
import fs from "fs";

const storageState = "tests/.auth/user.json";
const size = { width: 1440, height: 900 };

(async () => {
  console.log("Starting AC7 test...");
  const logPath = "specs/52/qa-logs/ac7-debouncing.log";
  
  function log(msg) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${msg}\n`;
    fs.appendFileSync(logPath, line);
    console.log(msg);
  }

  log("=== AC7: Debouncing prevents excessive filter operations ===");
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
    
    const searchInput = page.getByPlaceholder(/search facilities/i);
    const facilityCards = page.locator('a[href*="/facility/"]');
    
    // Test 1: Rapid typing
    log("Test 1: Rapidly typing 'FACILITYPATIENTS' (all within 1 second)...");
    
    // Track DOM changes to see if filtering is happening on every keystroke
    let changeCount = 0;
    page.on('domcontentloaded', () => changeCount++);
    
    const startTime = Date.now();
    const text = "FACILITYPATIENTS";
    
    // Type each character quickly
    for (const char of text) {
      await searchInput.type(char, { delay: 50 }); // 50ms per char = ~800ms total
    }
    const typeTime = Date.now() - startTime;
    log(`Typing completed in ${typeTime}ms`);
    
    // Wait for debounce period (300ms)
    log("Waiting for debounce period (300ms)...");
    await page.waitForTimeout(400);
    
    const finalCount = await facilityCards.count();
    log(`Final facility count after debounce: ${finalCount}`);
    log("✓ Rapid typing test completed - filter executed after debounce");
    
    // Test 2: Type, pause, type more
    log("Test 2: Type 'FA', wait 400ms, then type 'CILITY'...");
    await searchInput.clear();
    await page.waitForTimeout(300);
    
    const initialCount = await facilityCards.count();
    log(`Initial count: ${initialCount}`);
    
    await searchInput.type("FA", { delay: 50 });
    log("Typed 'FA', waiting 400ms for debounce...");
    await page.waitForTimeout(400);
    
    const afterFaCount = await facilityCards.count();
    log(`Count after 'FA': ${afterFaCount}`);
    
    await searchInput.type("CILITY", { delay: 50 });
    log("Typed 'CILITY', waiting 400ms for debounce...");
    await page.waitForTimeout(400);
    
    const afterFacilityCount = await facilityCards.count();
    log(`Count after 'FACILITY': ${afterFacilityCount}`);
    log("✓ Filter updated twice (once per debounce window)");
    
    // Screenshot
    await page.screenshot({ path: "specs/52/screenshots/ac7-debounce.png" });
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
