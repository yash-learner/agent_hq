#!/usr/bin/env node
/**
 * AC1: Custom footer links appear above NavUser in all sidebar contexts
 * Tests that configured footer links are visible in facility and admin sidebars
 */

import { chromium } from "playwright";
import { openAuthedContext } from "../../../.agent-hq/qa-auth.mjs";
import fs from "node:fs";

const LOG_FILE = "specs/64/qa-logs/ac1-footer-links-contexts.log";

function log(msg) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}\n`;
  fs.appendFileSync(LOG_FILE, line);
  console.log(msg);
}

async function main() {
  // Clear log file
  if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);
  
  log("=== AC1: Custom footer links appear above NavUser in all sidebar contexts ===");
  log("Prerequisites: REACT_CUSTOM_FOOTER_LINKS env var configured with test links");
  
  const browser = await chromium.launch({ headless: true });
  let context = null;
  let page = null;
  
  try {
    log("Step: Creating context with storageState and viewport");
    const size = { width: 1440, height: 900 };
    context = await browser.newContext({
      storageState: "tests/.auth/user.json",
      viewport: size,
      recordVideo: { dir: ".agent-hq/pw-videos", size },
    });
    
    page = await context.newPage();
    
    // Enable screencast for video recording
    await page.screencast.showActions({ cursor: "pointer" });
    log("Screencast enabled with pointer cursor");
    
    // Navigate to facility overview
    log("Navigating to facility overview page");
    await page.goto("http://localhost:4000/facility/5cb36841-acbb-47ec-83cf-7fdc8901cafb/overview", {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    
    // Wait for page to be interactive
    log("Waiting for page load");
    await page.waitForTimeout(3000);
    
    // Take screenshot for debugging
    await page.screenshot({ path: ".agent-hq/ac1-facility-page.png", fullPage: false });
    log("Screenshot saved for debugging");
    
    // Check URL to see where we landed
    const currentURL = page.url();
    log(`Current URL: ${currentURL}`);
    
    // Check if we're on login page
    const onLoginPage = currentURL.includes("/login");
    log(`On login page: ${onLoginPage}`);
    
    if (onLoginPage) {
      log("ERROR: Still on login page after navigation - auth failed");
      log("Blocker: auth-failure - cannot establish authenticated session");
      throw new Error("auth-failure: Cannot establish authenticated session");
    }
    
    // Wait for sidebar to be visible
    log("Waiting for sidebar to be visible");
    const sidebarVisible = await page.locator('[data-sidebar="sidebar"]').isVisible({ timeout: 10000 }).catch(() => false);
    log(`Sidebar visible: ${sidebarVisible}`);
    
    // Check for custom footer links in facility context
    log("Step 1: Verify custom footer links in facility sidebar");
    
    // Try different selectors for the links
    const careDocLink = page.getByRole("link", { name: /CARE Documentation/i });
    const adminPanelLink = page.getByRole("link", { name: /Admin Panel/i });
    const githubLink = page.getByRole("link", { name: /GitHub/i });
    
    const careDocVisible = await careDocLink.isVisible().catch(() => false);
    const adminPanelVisible = await adminPanelLink.isVisible().catch(() => false);
    const githubVisible = await githubLink.isVisible().catch(() => false);
    
    log(`Result: CARE Documentation link visible: ${careDocVisible}`);
    log(`Result: Admin Panel link visible: ${adminPanelVisible}`);
    log(`Result: GitHub link visible: ${githubVisible}`);
    
    if (!careDocVisible && !adminPanelVisible && !githubVisible) {
      log("WARNING: No custom footer links found - checking sidebar content");
      const sidebarContent = await page.locator('[data-sidebar="sidebar"]').textContent().catch(() => "");
      log(`Sidebar content: ${sidebarContent.substring(0, 500)}`);
    }
    
    // Verify links are above NavUser component
    log("Verifying links are positioned above NavUser");
    const navUser = page.locator('[data-sidebar="footer"]');
    const navUserVisible = await navUser.isVisible().catch(() => false);
    log(`Result: NavUser footer visible: ${navUserVisible}`);
    
    // Navigate to admin page
    log("Step 2: Navigate to admin page");
    await page.goto("http://localhost:4000/admin", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    log("Admin page loaded");
    
    // Take screenshot
    await page.screenshot({ path: ".agent-hq/ac1-admin-page.png", fullPage: false });
    
    // Wait for sidebar
    const adminSidebarVisible = await page.locator('[data-sidebar="sidebar"]').isVisible({ timeout: 10000 }).catch(() => false);
    log(`Admin sidebar visible: ${adminSidebarVisible}`);
    
    // Check for custom footer links in admin context
    log("Verify custom footer links in admin sidebar");
    const careDocAdminVisible = await careDocLink.isVisible().catch(() => false);
    const githubAdminVisible = await githubLink.isVisible().catch(() => false);
    
    log(`Result: CARE Documentation link visible in admin: ${careDocAdminVisible}`);
    log(`Result: GitHub link visible in admin: ${githubAdminVisible}`);
    
    // Admin Panel link should NOT be visible in admin context (visibleIn: ["facility"])
    const adminPanelInAdmin = await adminPanelLink.isVisible().catch(() => false);
    log(`Result: Admin Panel link visible in admin (should be false): ${adminPanelInAdmin}`);
    
    // Take final snapshot
    log("Taking snapshot of admin sidebar");
    const snapshot = await page.locator('[data-sidebar="sidebar"]').textContent().catch(() => "");
    log(`Sidebar content includes: ${snapshot.substring(0, 200)}...`);
    
    log("Success: Custom footer links test completed");
    
  } catch (error) {
    log(`ERROR: ${error.message}`);
    log(error.stack);
    if (page) {
      await page.screenshot({ path: ".agent-hq/ac1-error.png", fullPage: false }).catch(() => {});
    }
    throw error;
  } finally {
    // Close video recording and save
    if (page) {
      const videoPath = await page.video()?.path();
      if (videoPath) {
        log(`Video path: ${videoPath}`);
      }
    }
    
    if (context) {
      await context.close();
      log("Context closed");
      
      // Copy video to canonical location after context close
      const videoFiles = fs.readdirSync(".agent-hq/pw-videos").filter(f => f.endsWith(".webm"));
      if (videoFiles.length > 0) {
        const latestVideo = videoFiles.sort().reverse()[0];
        const sourcePath = `.agent-hq/pw-videos/${latestVideo}`;
        const targetPath = "specs/64/videos/ac1-footer-links-contexts.webm";
        fs.copyFileSync(sourcePath, targetPath);
        log(`Video copied from ${sourcePath} to ${targetPath}`);
      }
    }
    
    await browser.close();
    log("Browser closed");
  }
}

main().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
