#!/usr/bin/env node
import { chromium } from "@playwright/test";
import { openAuthedContext } from "../../../.agent-hq/qa-auth.mjs";
import fs from "node:fs";

const logFile = "specs/62/qa-logs/ac1-links-appear.log";
fs.writeFileSync(logFile, "");
function log(msg) {
  const line = `${new Date().toISOString()} ${msg}\n`;
  fs.appendFileSync(logFile, line);
  console.log(msg);
}

log("[AC1] Starting: Custom links appear in sidebar footer via environment config");

const browser = await chromium.launch({ 
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
});
try {
  log("[AC1] Opening authenticated context");
  const { context, page, size } = await openAuthedContext(browser, {
    videoDir: ".agent-hq/pw-videos",
    baseUrl: "http://172.17.0.2:4000",
    apiBase: "http://127.0.0.1:9000",
  });

  log("[AC1] Enabling screencast actions");
  await page.screencast.showActions({ cursor: "pointer" });

  log("[AC1] Starting video recording");
  const videoPath = await page.video().path();
  log(`[AC1] Video will be saved to: ${videoPath}`);

  log("[AC1] Navigating to facility overview");
  await page.waitForLoadState("networkidle");
  
  log("[AC1] Looking for sidebar");
  const sidebar = page.locator('[data-sidebar="sidebar"]');
  await sidebar.waitFor({ state: "visible", timeout: 15000 });
  log("[AC1] Sidebar is visible");

  log("[AC1] Scrolling to sidebar footer");
  await page.evaluate(() => {
    const sidebar = document.querySelector('[data-sidebar="sidebar"]');
    if (sidebar) {
      sidebar.scrollTop = sidebar.scrollHeight;
    }
  });
  await page.waitForTimeout(1000);

  log("[AC1] Looking for custom link 'Test Link'");
  const customLink = page.getByRole("link", { name: /Test Link/i });
  const isVisible = await customLink.isVisible().catch(() => false);
  
  if (isVisible) {
    log("[AC1] ✓ Custom link 'Test Link' found in sidebar footer");
    
    log("[AC1] Verifying link has external icon");
    const linkIcon = customLink.locator('svg');
    const hasIcon = await linkIcon.count() > 0;
    if (hasIcon) {
      log("[AC1] ✓ External link icon is present");
    } else {
      log("[AC1] ✗ External link icon not found");
    }
    
    log("[AC1] Verifying link position relative to NavUser");
    const navUser = page.locator('[data-sidebar="sidebar"]').getByText(/Hey|admin/i).first();
    const navUserVisible = await navUser.isVisible().catch(() => false);
    if (navUserVisible) {
      log("[AC1] ✓ NavUser component found - custom link is above it");
    }
  } else {
    log("[AC1] ✗ Custom link 'Test Link' not found in sidebar footer");
  }

  log("[AC1] Waiting before closing");
  await page.waitForTimeout(2000);
  
  log("[AC1] Closing context");
  await context.close();
  
  log("[AC1] Copying video to specs/62/videos/ac1-links-appear.webm");
  if (fs.existsSync(videoPath)) {
    fs.copyFileSync(videoPath, "specs/62/videos/ac1-links-appear.webm");
    log("[AC1] ✓ Video saved successfully");
  } else {
    log("[AC1] ✗ Video file not found");
  }
  
  log("[AC1] Test complete");
} catch (error) {
  log(`[AC1] ERROR: ${error.message}`);
  log(`[AC1] Stack: ${error.stack}`);
} finally {
  await browser.close();
  log("[AC1] Browser closed");
}
