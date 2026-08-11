#!/usr/bin/env node
/**
 * AC3: Profile navigation works with role badge visible
 */

import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const size = { width: 1440, height: 900 };
  const context = await browser.newContext({
    viewport: size,
    recordVideo: { dir: ".agent-hq/pw-videos", size },
  });
  
  try {
    const page = await context.newPage();
    
    console.log("[AC3] Login as admin");
    await page.goto("http://localhost:4000/login", { waitUntil: "networkidle" });
    await page.locator('input[name="username"]').fill("admin");
    await page.locator('input[name="password"]').fill("admin");
    await page.locator('button[type="submit"]').click();
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });
    
    const facilityId = "181a32f1-8844-4d68-bc33-6ccaf273e5d3";
    await page.goto(`http://localhost:4000/facility/${facilityId}/overview`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    
    console.log("[AC3] Open dropdown, check badge, click Profile");
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    const userTrigger = sidebar.locator('[data-sidebar="footer"]').locator('button').first();
    await userTrigger.click();
    await page.waitForTimeout(500);
    
    // Check badge (will be empty due to bug)
    const badgeElement = page.locator('[data-slot="badge"]');
    const badgeText = await badgeElement.textContent().catch(() => "");
    console.log(`[AC3] Badge text before Profile click: "${badgeText}"`);
    
    // Click Profile
    await page.getByText("Profile").click();
    await page.waitForURL(/\/users\//, { timeout: 10000 });
    console.log(`[AC3] Navigated to: ${page.url()}`);
    
    // Open dropdown again
    await page.waitForTimeout(1000);
    await userTrigger.click();
    await page.waitForTimeout(500);
    
    const badgeTextAfter = await badgeElement.textContent().catch(() => "");
    console.log(`[AC3] Badge text after navigation: "${badgeTextAfter}"`);
    
    if (badgeTextAfter === "") {
      throw new Error("Badge still empty after navigation - user.user_type undefined");
    }
    
    console.log("[AC3] ✓ PASS");
    await context.close();
  } catch (error) {
    console.error(`[AC3] ✗ FAIL: ${error.message}`);
    await context.close();
    throw error;
  } finally {
    await browser.close();
  }
}

main().catch(() => process.exit(1));
