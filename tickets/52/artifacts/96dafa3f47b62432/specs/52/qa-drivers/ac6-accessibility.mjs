import { chromium } from "@playwright/test";
import fs from "fs";

const storageState = "tests/.auth/user.json";
const size = { width: 1440, height: 900 };

(async () => {
  console.log("Starting AC6 test...");
  const logPath = "specs/52/qa-logs/ac6-accessibility.log";
  
  function log(msg) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${msg}\n`;
    fs.appendFileSync(logPath, line);
    console.log(msg);
  }

  log("=== AC6: Accessibility compliance ===");
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
    
    // Test 1: Check aria-label
    log("Test 1: Checking aria-label attribute...");
    const ariaLabel = await searchInput.getAttribute('aria-label');
    log(`aria-label: "${ariaLabel}"`);
    
    if (ariaLabel) {
      log("✓ Search input has aria-label attribute");
    } else {
      log("⚠ No aria-label found - checking placeholder as fallback");
      const placeholder = await searchInput.getAttribute('placeholder');
      log(`placeholder: "${placeholder}"`);
    }
    
    // Test 2: Keyboard navigation to input
    log("Test 2: Testing keyboard navigation with Tab...");
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    
    // Check if search input is focused
    const isFocused = await searchInput.evaluate(el => el === document.activeElement);
    if (isFocused) {
      log("✓ Search input received focus via Tab key");
    } else {
      // Try tabbing a few more times to find it
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(300);
        const nowFocused = await searchInput.evaluate(el => el === document.activeElement);
        if (nowFocused) {
          log(`✓ Search input received focus after ${i + 2} tabs`);
          break;
        }
      }
    }
    
    // Screenshot of focused state
    await page.screenshot({ path: "specs/52/screenshots/ac6-focused.png" });
    
    // Test 3: Type and tab to clear button
    log("Test 3: Typing text and tabbing to clear button...");
    await searchInput.fill("test");
    await page.waitForTimeout(500);
    
    log("Pressing Tab to move to clear button...");
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    
    // Check if clear button exists and is focusable
    const clearButton = page.locator('button').filter({ 
      has: page.locator('[data-lucide="x"], [class*="clear"]') 
    }).or(
      page.locator('button[aria-label*="clear" i]')
    ).first();
    
    if (await clearButton.isVisible().catch(() => false)) {
      const clearFocused = await clearButton.evaluate(el => el === document.activeElement);
      if (clearFocused) {
        log("✓ Clear button received focus via Tab");
      } else {
        log("⚠ Clear button exists but did not receive focus");
      }
      
      // Test 4: Press Enter/Space on clear button
      log("Test 4: Pressing Enter on clear button...");
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      
      const inputValue = await searchInput.inputValue();
      log(`Input value after Enter: "${inputValue}"`);
      
      if (inputValue === "") {
        log("✓ Clear button activated via Enter key");
      } else {
        log("Trying Space key instead...");
        await searchInput.fill("test");
        await page.waitForTimeout(300);
        await page.keyboard.press('Tab');
        await page.waitForTimeout(300);
        await page.keyboard.press('Space');
        await page.waitForTimeout(500);
        
        const afterSpace = await searchInput.inputValue();
        if (afterSpace === "") {
          log("✓ Clear button activated via Space key");
        }
      }
    } else {
      log("⚠ Clear button not found");
    }
    
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
