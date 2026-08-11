#!/usr/bin/env node
/**
 * AC2: Role badge shows "Administrator" for care-fac-admin
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
    
    console.log("[AC2] Login as care-fac-admin");
    await page.goto("http://localhost:4000/login", { waitUntil: "networkidle" });
    await page.locator('input[name="username"]').fill("care-fac-admin");
    await page.locator('input[name="password"]').fill("Ohcn@123");
    await page.locator('button[type="submit"]').click();
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });
    
    const facilityId = "181a32f1-8844-4d68-bc33-6ccaf273e5d3";
    await page.goto(`http://localhost:4000/facility/${facilityId}/overview`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    
    console.log("[AC2] Open user dropdown");
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await sidebar.waitFor({ state: "visible" });
    const userTrigger = sidebar.locator('[data-sidebar="footer"]').locator('button').first();
    await userTrigger.click();
    await page.waitForTimeout(1000);
    
    console.log("[AC2] Check for Administrator badge");
    const adminBadge = page.getByText("Administrator", { exact: false });
    const visible = await adminBadge.isVisible().catch(() => false);
    
    const badgeElement = page.locator('[data-slot="badge"]');
    const badgeText = await badgeElement.textContent().catch(() => "");
    
    console.log(`[AC2] Badge visible: ${visible}`);
    console.log(`[AC2] Badge text: "${badgeText}"`);
    
    if (!visible || badgeText === "") {
      throw new Error("Administrator badge not showing - user.user_type undefined");
    }
    
    console.log("[AC2] ✓ PASS");
    await context.close();
  } catch (error) {
    console.error(`[AC2] ✗ FAIL: ${error.message}`);
    await context.close();
    throw error;
  } finally {
    await browser.close();
  }
}

main().catch(() => process.exit(1));
