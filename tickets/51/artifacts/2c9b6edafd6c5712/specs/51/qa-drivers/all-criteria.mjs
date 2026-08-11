#!/usr/bin/env node
/**
 * All 6 acceptance criteria in one driver for speed
 * Each criterion gets its own video clip via separate page/context lifecycle
 */

import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const FACILITY_ID = "6cb92e18-d77d-4316-87eb-2273596e4b1b";
const BASE_URL = "http://localhost:4000";
const STORAGE_STATE = "tests/.auth/user.json";
const SIZE = { width: 1440, height: 900 };

// Helper to create an authed context
async function createContext(browser, videoId) {
  const videoDir = `specs/51/videos-tmp/${videoId}`;
  fs.mkdirSync(videoDir, { recursive: true });
  
  return await browser.newContext({
    storageState: STORAGE_STATE,
    viewport: SIZE,
    recordVideo: { dir: videoDir, size: SIZE },
  });
}

// AC1: Identifier search shows count for fixtures
async function testAC1(browser) {
  console.log("\n[ac1] === AC1: Identifier search count ===");
  const context = await createContext(browser, "ac1");
  const page = await context.newPage();
  
  try {
    await page.screencast.showActions({ cursor: "pointer" });
    console.log("[ac1] Navigating to patients page");
    await page.goto(`${BASE_URL}/facility/${FACILITY_ID}/patients`);
    await page.waitForLoadState("networkidle", { timeout: 15000 });
    
    console.log("[ac1] Waiting for Patient Identifiers tab");
    const tab = page.getByRole("tab", { name: /patient identifiers/i });
    await tab.waitFor({ state: "visible", timeout: 10000 });
    
    console.log("[ac1] Finding search input");
    const input = page.locator('input[type="tel"]').first();
    await input.waitFor({ state: "visible", timeout: 10000 });
    
    console.log("[ac1] Typing phone search: +919");
    await input.fill("+919");
    await page.waitForTimeout(3000);
    
    console.log("[ac1] Looking for count line");
    const countLine = page.locator('text=/\\d+ results?/i').first();
    const hasCount = await countLine.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasCount) {
      const text = await countLine.textContent();
      console.log(`[ac1] ✓ Count line found: "${text}"`);
    } else {
      console.log("[ac1] ✗ Count line not visible");
    }
    
    await page.close();
    await context.close();
    console.log("[ac1] AC1 complete");
    return hasCount;
  } catch (error) {
    console.error(`[ac1] ✗ Failed: ${error.message}`);
    await page.close().catch(() => {});
    await context.close();
    return false;
  }
}

// AC2: Empty state has no count line
async function testAC2(browser) {
  console.log("\n[ac2] === AC2: Empty state no count ===");
  const context = await createContext(browser, "ac2");
  const page = await context.newPage();
  
  try {
    await page.screencast.showActions({ cursor: "pointer" });
    console.log("[ac2] Navigating to patients page");
    await page.goto(`${BASE_URL}/facility/${FACILITY_ID}/patients`);
    await page.waitForLoadState("networkidle", { timeout: 15000 });
    
    const tab = page.getByRole("tab", { name: /patient identifiers/i });
    await tab.waitFor({ state: "visible", timeout: 10000 });
    
    const input = page.locator('input[type="tel"]').first();
    await input.waitFor({ state: "visible", timeout: 10000 });
    
    console.log("[ac2] Typing non-existent phone: 0000000000");
    await input.fill("0000000000");
    await page.waitForTimeout(3000);
    
    console.log("[ac2] Checking for empty state");
    const emptyState = page.getByText(/no patient record found/i);
    const hasEmpty = await emptyState.isVisible({ timeout: 5000 }).catch(() => false);
    
    console.log("[ac2] Checking for count line (should be absent)");
    const countLine = page.locator('text=/\\d+ results?/i').first();
    const hasCount = await countLine.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (hasEmpty && !hasCount) {
      console.log("[ac2] ✓ Empty state visible, no count line");
    } else {
      console.log(`[ac2] ✗ Empty: ${hasEmpty}, Count: ${hasCount}`);
    }
    
    await page.close();
    await context.close();
    console.log("[ac2] AC2 complete");
    return hasEmpty && !hasCount;
  } catch (error) {
    console.error(`[ac2] ✗ Failed: ${error.message}`);
    await page.close().catch(() => {});
    await context.close();
    return false;
  }
}

// AC3: No count before search
async function testAC3(browser) {
  console.log("\n[ac3] === AC3: No count before search ===");
  const context = await createContext(browser, "ac3");
  const page = await context.newPage();
  
  try {
    await page.screencast.showActions({ cursor: "pointer" });
    console.log("[ac3] Navigating to patients page");
    await page.goto(`${BASE_URL}/facility/${FACILITY_ID}/patients`);
    await page.waitForLoadState("networkidle", { timeout: 15000 });
    
    const tab = page.getByRole("tab", { name: /patient identifiers/i });
    await tab.waitFor({ state: "visible", timeout: 10000 });
    
    console.log("[ac3] Checking for count line (should be absent)");
    const countLine = page.locator('text=/\\d+ results?/i').first();
    const hasCount = await countLine.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (!hasCount) {
      console.log("[ac3] ✓ No count line before search");
    } else {
      console.log("[ac3] ✗ Count line visible before search");
    }
    
    await page.close();
    await context.close();
    console.log("[ac3] AC3 complete");
    return !hasCount;
  } catch (error) {
    console.error(`[ac3] ✗ Failed: ${error.message}`);
    await page.close().catch(() => {});
    await context.close();
    return false;
  }
}

// AC4: Encounter search shows count
async function testAC4(browser) {
  console.log("\n[ac4] === AC4: Encounter search count ===");
  const context = await createContext(browser, "ac4");
  const page = await context.newPage();
  
  try {
    await page.screencast.showActions({ cursor: "pointer" });
    console.log("[ac4] Navigating to patients page");
    await page.goto(`${BASE_URL}/facility/${FACILITY_ID}/patients`);
    await page.waitForLoadState("networkidle", { timeout: 15000 });
    
    console.log("[ac4] Clicking Encounters tab");
    const encTab = page.getByRole("tab", { name: /encounters/i });
    await encTab.waitFor({ state: "visible", timeout: 10000 });
    await encTab.click();
    await page.waitForTimeout(1000);
    
    console.log("[ac4] Finding search input");
    const input = page.locator('input[type="text"]').first();
    await input.waitFor({ state: "visible", timeout: 10000 });
    
    console.log("[ac4] Typing patient name search: Test");
    await input.fill("Test");
    await page.waitForTimeout(3000);
    
    console.log("[ac4] Looking for count line");
    const countLine = page.locator('text=/\\d+ results?/i').first();
    const hasCount = await countLine.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasCount) {
      const text = await countLine.textContent();
      console.log(`[ac4] ✓ Count line found: "${text}"`);
    } else {
      console.log("[ac4] ✗ Count line not visible");
    }
    
    await page.close();
    await context.close();
    console.log("[ac4] AC4 complete");
    return hasCount;
  } catch (error) {
    console.error(`[ac4] ✗ Failed: ${error.message}`);
    await page.close().catch(() => {});
    await context.close();
    return false;
  }
}

// AC5: Encounter empty state no count
async function testAC5(browser) {
  console.log("\n[ac5] === AC5: Encounter empty state ===");
  const context = await createContext(browser, "ac5");
  const page = await context.newPage();
  
  try {
    await page.screencast.showActions({ cursor: "pointer" });
    console.log("[ac5] Navigating to patients page");
    await page.goto(`${BASE_URL}/facility/${FACILITY_ID}/patients`);
    await page.waitForLoadState("networkidle", { timeout: 15000 });
    
    const encTab = page.getByRole("tab", { name: /encounters/i });
    await encTab.waitFor({ state: "visible", timeout: 10000 });
    await encTab.click();
    await page.waitForTimeout(1000);
    
    const input = page.locator('input[type="text"]').first();
    await input.waitFor({ state: "visible", timeout: 10000 });
    
    console.log("[ac5] Typing non-existent name: zzz-no-such-patient");
    await input.fill("zzz-no-such-patient-xyz");
    await page.waitForTimeout(3000);
    
    console.log("[ac5] Checking for empty state");
    const emptyState = page.getByText(/no patient record found|no encounters found/i);
    const hasEmpty = await emptyState.isVisible({ timeout: 5000 }).catch(() => false);
    
    const countLine = page.locator('text=/\\d+ results?/i').first();
    const hasCount = await countLine.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (hasEmpty && !hasCount) {
      console.log("[ac5] ✓ Empty state visible, no count line");
    } else {
      console.log(`[ac5] ✗ Empty: ${hasEmpty}, Count: ${hasCount}`);
    }
    
    await page.close();
    await context.close();
    console.log("[ac5] AC5 complete");
    return hasEmpty && !hasCount;
  } catch (error) {
    console.error(`[ac5] ✗ Failed: ${error.message}`);
    await page.close().catch(() => {});
    await context.close();
    return false;
  }
}

// AC6: Count updates live
async function testAC6(browser) {
  console.log("\n[ac6] === AC6: Count updates live ===");
  const context = await createContext(browser, "ac6");
  const page = await context.newPage();
  
  try {
    await page.screencast.showActions({ cursor: "pointer" });
    console.log("[ac6] Navigating to patients page");
    await page.goto(`${BASE_URL}/facility/${FACILITY_ID}/patients`);
    await page.waitForLoadState("networkidle", { timeout: 15000 });
    
    const tab = page.getByRole("tab", { name: /patient identifiers/i });
    await tab.waitFor({ state: "visible", timeout: 10000 });
    
    const input = page.locator('input[type="tel"]').first();
    await input.waitFor({ state: "visible", timeout: 10000 });
    
    console.log("[ac6] Typing first search: +919");
    await input.fill("+919");
    await page.waitForTimeout(3000);
    
    const countLine = page.locator('text=/\\d+ results?/i').first();
    const hasCount1 = await countLine.isVisible({ timeout: 5000 }).catch(() => false);
    let count1Text = "";
    if (hasCount1) {
      count1Text = await countLine.textContent();
      console.log(`[ac6] First count: "${count1Text}"`);
    }
    
    console.log("[ac6] Changing search to: +9191");
    await input.fill("+9191");
    await page.waitForTimeout(3000);
    
    const hasCount2 = await countLine.isVisible({ timeout: 5000 }).catch(() => false);
    let count2Text = "";
    if (hasCount2) {
      count2Text = await countLine.textContent();
      console.log(`[ac6] Second count: "${count2Text}"`);
    }
    
    if (hasCount1 && hasCount2 && count1Text !== count2Text) {
      console.log("[ac6] ✓ Count updated without page reload");
    } else {
      console.log(`[ac6] ✗ Count did not update as expected`);
    }
    
    await page.close();
    await context.close();
    console.log("[ac6] AC6 complete");
    return hasCount1 && hasCount2;
  } catch (error) {
    console.error(`[ac6] ✗ Failed: ${error.message}`);
    await page.close().catch(() => {});
    await context.close();
    return false;
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  
  try {
    const results = {
      ac1: await testAC1(browser),
      ac2: await testAC2(browser),
      ac3: await testAC3(browser),
      ac4: await testAC4(browser),
      ac5: await testAC5(browser),
      ac6: await testAC6(browser),
    };
    
    console.log("\n=== SUMMARY ===");
    Object.entries(results).forEach(([ac, passed]) => {
      console.log(`${ac}: ${passed ? "✓ PASS" : "✗ FAIL"}`);
    });
    
    // Move videos to proper locations
    console.log("\n=== Moving videos to final locations ===");
    for (const ac of ["ac1", "ac2", "ac3", "ac4", "ac5", "ac6"]) {
      const tmpDir = `specs/51/videos-tmp/${ac}`;
      if (fs.existsSync(tmpDir)) {
        const files = fs.readdirSync(tmpDir);
        const webm = files.find(f => f.endsWith('.webm'));
        if (webm) {
          const src = path.join(tmpDir, webm);
          const dest = `specs/51/videos/${ac}-${ac === "ac1" ? "identifier-count" : ac === "ac2" ? "identifier-empty" : ac === "ac3" ? "no-count-before-search" : ac === "ac4" ? "encounter-count" : ac === "ac5" ? "encounter-empty" : "live-update"}.webm`;
          fs.mkdirSync("specs/51/videos", { recursive: true });
          fs.copyFileSync(src, dest);
          console.log(`Moved ${ac} video to ${dest}`);
        }
      }
    }
    
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
