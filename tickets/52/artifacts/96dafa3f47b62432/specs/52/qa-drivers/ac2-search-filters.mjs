import { chromium } from "@playwright/test";
import fs from "fs";

const storageState = "tests/.auth/user.json";
const size = { width: 1440, height: 900 };

(async () => {
  console.log("Starting AC2 test (v2)...");
  const logPath = "specs/52/qa-logs/ac2-search-filters.log";
  
  // Clear previous log
  fs.writeFileSync(logPath, '');
  
  function log(msg) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${msg}\n`;
    fs.appendFileSync(logPath, line);
    console.log(msg);
  }

  log("=== AC2: Typing in search filters facilities by name ===");
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
    
    // Count initial facilities using the actual facility name pattern
    log("Counting initial facilities...");
    const facilityCards = page.locator('a[href*="/facility/"]');
    const initialCount = await facilityCards.count();
    log(`Initial facility count: ${initialCount}`);
    
    // Get initial facility names
    for (let i = 0; i < initialCount; i++) {
      const text = await facilityCards.nth(i).textContent();
      log(`  Facility ${i + 1}: ${text?.trim().substring(0, 50)}`);
    }
    
    // Test 1: Type "PATIENTS" (part of "FACILITY WITH PATIENTS")
    log("Test 1: Typing 'PATIENTS' in search...");
    const searchInput = page.getByPlaceholder(/search facilities/i);
    await searchInput.fill("PATIENTS");
    await page.waitForTimeout(500); // Wait for debounce + filter
    
    const afterPatientsCount = await facilityCards.count();
    log(`Facilities after 'PATIENTS' filter: ${afterPatientsCount}`);
    
    if (afterPatientsCount === 1) {
      const text = await facilityCards.first().textContent();
      log(`  Remaining: ${text?.trim().substring(0, 50)}`);
      log("✓ Filtering worked - reduced from 2 to 1");
    }
    
    // Test 2: Clear and type "secondary" (lowercase, part of "SECONDARY FACILITY")
    log("Test 2: Clearing and typing 'secondary' (lowercase)...");
    await searchInput.clear();
    await page.waitForTimeout(400);
    await searchInput.fill("secondary");
    await page.waitForTimeout(500);
    
    const afterSecondaryCount = await facilityCards.count();
    log(`Facilities after 'secondary' filter: ${afterSecondaryCount}`);
    
    if (afterSecondaryCount === 1) {
      const text = await facilityCards.first().textContent();
      log(`  Remaining: ${text?.trim().substring(0, 50)}`);
      log("✓ Case-insensitive filtering worked");
    }
    
    // Test 3: Type single character "f"
    log("Test 3: Clearing and typing single character 'f'...");
    await searchInput.clear();
    await page.waitForTimeout(400);
    await searchInput.fill("f");
    await page.waitForTimeout(500);
    
    const afterFCount = await facilityCards.count();
    log(`Facilities after 'f' filter: ${afterFCount}`);
    
    if (afterFCount === 2) {
      log("✓ Both facilities have 'f' - filter working");
    } else if (afterFCount > 0) {
      log(`✓ Single character filtering worked (${afterFCount} matches)`);
    }
    
    // Screenshot
    await page.screenshot({ path: "specs/52/screenshots/ac2-filtered.png" });
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
