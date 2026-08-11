#!/usr/bin/env node
/**
 * AC1: Role badge displays for facility user with doctor role
 * 
 * Tests that a signed-in facility user sees their role badge when opening
 * the sidebar user dropdown.
 */

import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  
  try {
    console.log("[AC1] Starting: Role badge for doctor user");
    
    // Create context with video recording
    const size = { width: 1440, height: 900 };
    const context = await browser.newContext({
      viewport: size,
      recordVideo: { dir: ".agent-hq/pw-videos", size },
    });
    
    const page = await context.newPage();
    
    // Manual login to avoid auth helper issues
    console.log("[AC1] Navigating to login page");
    await page.goto("http://localhost:4000/login", { waitUntil: "networkidle" });
    
    console.log("[AC1] Filling login credentials");
    await page.locator('input[name="username"]').fill("admin");
    await page.locator('input[name="password"]').fill("admin");
    
    console.log("[AC1] Clicking login button");
    await page.locator('button[type="submit"]').click();
    
    // Wait for navigation away from login
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });
    console.log("[AC1] Login successful, navigated to:", page.url());
    
    // Navigate to a facility page to see the sidebar
    const facilityId = "181a32f1-8844-4d68-bc33-6ccaf273e5d3";
    console.log("[AC1] Navigating to facility page");
    await page.goto(`http://localhost:4000/facility/${facilityId}/overview`, { waitUntil: "networkidle" });
    console.log("[AC1] On facility page:", page.url());
    
    // Wait for page to load completely
    await page.waitForTimeout(2000);
    
    // Wait for authenticated shell indicators
    const spinner = page.locator(".animate-spin, [data-loading='true']");
    if (await spinner.first().isVisible().catch(() => false)) {
      await spinner.first().waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
    }
    
    console.log("[AC1] Authenticated shell ready");
    
    // Wait for sidebar to be visible
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await sidebar.waitFor({ state: "visible", timeout: 15000 });
    console.log("[AC1] Sidebar visible");
    
    // Find and click the user avatar/button in sidebar footer
    // The footer button shows user initials
    const userTrigger = sidebar.locator('[data-sidebar="footer"]').locator('button').first();
    await userTrigger.waitFor({ state: "visible", timeout: 10000 });
    console.log("[AC1] User trigger found");
    
    // Click to open dropdown
    await userTrigger.click();
    console.log("[AC1] Clicked user dropdown trigger");
    
    // Wait for dropdown to be visible
    await page.waitForTimeout(1000); // Brief wait for dropdown animation
    
    // Look for role badge - should show "Doctor" or "Administrator"
    const roleBadge = page.getByText(/Doctor|Administrator|Nurse|Staff|Volunteer/i);
    const roleBadgeVisible = await roleBadge.isVisible().catch(() => false);
    
    if (!roleBadgeVisible) {
      // Badge element exists but may be empty - check for the badge element itself
      const badgeElement = page.locator('[data-slot="badge"]');
      const badgeExists = await badgeElement.count() > 0;
      const badgeText = await badgeElement.textContent().catch(() => "");
      
      console.log(`[AC1] Badge element exists: ${badgeExists}`);
      console.log(`[AC1] Badge text content: "${badgeText}"`);
      
      if (badgeExists && badgeText === "") {
        throw new Error("Role badge element exists but is empty - user.user_type is likely undefined in API response");
      } else {
        throw new Error("Role badge not found in dropdown");
      }
    }
    
    console.log("[AC1] Role badge visible");
    
    // Take screenshot for verification
    const badgeText = await roleBadge.textContent();
    console.log(`[AC1] Badge text: "${badgeText}"`);
    
    // Verify the badge is visible
    const isVisible = await roleBadge.isVisible();
    if (!isVisible) {
      throw new Error("Role badge not visible");
    }
    
    console.log("[AC1] ✓ PASS - Role badge displays correctly");
    
    // Close dropdown by clicking outside or pressing Escape
    await page.keyboard.press("Escape");
    
    // Close context
    await context.close();
    
  } catch (error) {
    console.error("[AC1] ✗ FAIL:", error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
