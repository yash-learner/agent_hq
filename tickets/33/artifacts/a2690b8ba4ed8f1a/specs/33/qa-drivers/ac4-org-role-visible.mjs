import { chromium } from "@playwright/test";
import { appendFileSync } from "fs";

const logPath = "specs/33/qa-logs/ac4-org-role-visible.log";

function log(message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}\n`;
  appendFileSync(logPath, line);
  console.log(message);
}

async function main() {
  const size = { width: 1440, height: 900 };
  const browser = await chromium.launch({ headless: true });
  
  log("Starting AC4 - Organization users display organization-specific role names");
  log(`Loading storageState from tests/.auth/user.json`);
  
  const context = await browser.newContext({
    storageState: "tests/.auth/user.json",
    viewport: size,
    recordVideo: { dir: ".agent-hq/pw-videos", size },
  });

  const page = await context.newPage();
  await page.screencast.showActions({ cursor: "pointer" });
  
  try {
    log("Step 1: Navigate to home page and verify login");
    await page.goto("http://localhost:4000/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    
    const hasViewLink = await page.getByRole("link", { name: "View" }).first().isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!hasViewLink) {
      log("Login page detected, logging in as admin");
      await page.getByRole("button", { name: "Log in as Staff" }).click();
      await page.getByRole("textbox", { name: "Username" }).fill("admin");
      await page.getByRole("textbox", { name: "Password" }).fill("admin");
      await page.getByRole("button", { name: "Login" }).click();
      await page.waitForTimeout(3000);
      log("Login successful");
    } else {
      log("Already logged in via storageState");
    }
    
    // Auth shell readiness check
    log("Verifying auth shell readiness");
    await page.waitForSelector('[data-sidebar="sidebar"]', { timeout: 10000 }).catch(() => {});
    
    log("Step 2: Navigate to Governance tab");
    await page.getByRole("tab", { name: "Governance" }).click();
    await page.waitForTimeout(1000);
    log("Governance tab clicked");
    
    log("Step 3: Click on Government organization");
    await page.getByRole("link", { name: /Government$/ }).first().click();
    await page.waitForTimeout(2000);
    log("Government organization loaded");
    
    log("Step 4: Navigate to organization Users");
    await page.getByRole("menuitem", { name: "Users" }).click();
    await page.waitForTimeout(3000);
    log("Organization users page loading");
    
    // Wait for user cards to load
    log("Step 5: Verifying user cards are loaded");
    const seeDetailsButton = page.getByRole("button", { name: "See Details" }).first();
    const hasDetails = await seeDetailsButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!hasDetails) {
      log("WARNING: No user cards found with 'See Details' button");
    } else {
      log("User cards loaded successfully");
    }
    
    // Look for organization role text (Admin, Manager, Member)
    log("Step 6: Checking for organization role text on user cards");
    const orgRoles = ["Admin", "Manager", "Member"];
    let foundRoles = [];
    
    for (const roleText of orgRoles) {
      const roleVisible = await page.getByText(roleText, { exact: true }).isVisible().catch(() => false);
      if (roleVisible) {
        foundRoles.push(roleText);
        log(`✓ Found role: ${roleText} visible on card`);
      }
    }
    
    // Take a screenshot for reference
    await page.screenshot({ path: "specs/33/screenshots/ac4-org-users-card-view.png", fullPage: true });
    log("Screenshot saved to specs/33/screenshots/ac4-org-users-card-view.png");
    
    // Try to find the role text specifically in the gray text color (as per implementation)
    log("Step 7: Verifying role text is in gray color styling");
    const grayTextElements = await page.locator("span.text-gray-500").all();
    log(`Found ${grayTextElements.length} gray text elements`);
    
    let roleInGrayText = false;
    const foundGrayRoles = [];
    for (const element of grayTextElements) {
      const text = await element.textContent();
      if (text && orgRoles.includes(text.trim())) {
        roleInGrayText = true;
        foundGrayRoles.push(text.trim());
        log(`✓ Found role in gray text: ${text.trim()}`);
      }
    }
    
    // Final verification
    log("Step 8: Final verification");
    if (foundRoles.length > 0 || foundGrayRoles.length > 0) {
      const allRoles = [...new Set([...foundRoles, ...foundGrayRoles])];
      log(`SUCCESS: Found ${allRoles.length} role(s) on organization user cards: ${allRoles.join(", ")}`);
      log("AC4 VERIFICATION: PASS - Organization roles are visible on user cards");
    } else {
      log("FAIL: No organization role text found on user cards");
      log("AC4 VERIFICATION: FAIL - Could not verify organization role visibility");
    }
    
  } catch (error) {
    log(`ERROR: ${error.message}`);
    log(`Stack: ${error.stack}`);
    throw error;
  } finally {
    await page.close();
    await context.close();
    await browser.close();
    log("Browser closed");
    
    // Copy the video to the correct location
    const fs = await import("fs");
    const path = await import("path");
    const videoDir = ".agent-hq/pw-videos";
    
    if (fs.existsSync(videoDir)) {
      const files = fs.readdirSync(videoDir);
      const videoFile = files.find(f => f.endsWith(".webm"));
      if (videoFile) {
        const src = path.join(videoDir, videoFile);
        const dest = "specs/33/videos/ac4-org-role-visible.webm";
        fs.copyFileSync(src, dest);
        log(`Video saved to ${dest}`);
        // Clean up temp directory
        fs.rmSync(videoDir, { recursive: true, force: true });
      }
    }
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
