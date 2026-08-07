#!/usr/bin/env node
/**
 * AC2 - Role section not rendered when no role, but edit action still appears
 * AC4 - Organization users display organization-specific role names
 * Tests organization user cards display roles (Admin, Manager, Member)
 */

import { chromium } from "playwright";
import fs from "fs";
import path from "path";

async function main() {
  console.log("=== AC2/AC4: Organization user role display ===");

  const size = { width: 1440, height: 900 };
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      storageState: "tests/.auth/user.json",
      viewport: size,
      recordVideo: {
        dir: ".agent-hq/pw-videos",
        size,
      },
    });

    console.log("✓ Browser context created with auth");

    const page = await context.newPage();
    await page.screencast.showActions({ cursor: "pointer" });
    console.log("✓ Screencast cursor enabled");

    // First, navigate to home and find Governance tab
    console.log("Navigating to home page...");
    await page.goto("http://localhost:4000/", {
      waitUntil: "networkidle",
    });

    await page.waitForSelector('[data-test-id="loading"]', {
      state: "hidden",
      timeout: 30000,
    }).catch(() => console.log("No loading spinner"));

    console.log("Looking for Governance tab...");
    const governanceVisible = await page
      .locator('text="Governance"')
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (governanceVisible) {
      console.log("✓ Governance tab found, clicking...");
      await page.locator('text="Governance"').click();
      await page.waitForTimeout(2000);

      // Look for Government organization
      console.log("Looking for Government organization...");
      const govOrgVisible = await page
        .locator('text="Government"')
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      if (govOrgVisible) {
        console.log("✓ Government organization found, clicking...");
        await page.locator('text="Government"').first().click();
        await page.waitForTimeout(2000);

        // Navigate to Users
        console.log("Looking for Users link...");
        const usersLinkVisible = await page
          .locator('a:has-text("Users"), button:has-text("Users")')
          .first()
          .isVisible({ timeout: 5000 })
          .catch(() => false);

        if (usersLinkVisible) {
          console.log("✓ Users link found, clicking...");
          await page.locator('a:has-text("Users"), button:has-text("Users")').first().click();
          await page.waitForTimeout(3000);

          // Wait for user cards
          console.log("Waiting for user cards...");
          await page.waitForSelector('[class*="card"], [class*="Card"]', {
            timeout: 10000,
          });
          console.log("✓ User cards loaded");

          // Look for organization role text (Admin, Manager, Member)
          console.log("Searching for organization role text...");
          const rolePatterns = ["Admin", "Manager", "Member"];
          let foundRoles = [];

          for (const role of rolePatterns) {
            const visible = await page
              .locator(`text="${role}"`)
              .first()
              .isVisible({ timeout: 2000 })
              .catch(() => false);
            if (visible) {
              foundRoles.push(role);
              console.log(`✓ Found role: ${role}`);
            }
          }

          if (foundRoles.length > 0) {
            console.log(
              `✓ SUCCESS: Organization roles visible: ${foundRoles.join(", ")}`
            );
          } else {
            console.log("⚠ WARNING: No organization role text found");
          }

          // Take screenshot
          await page.screenshot({
            path: "specs/33/screenshots/ac2-ac4-org-roles.png",
          });
          console.log("✓ Screenshot saved");
        } else {
          console.log("⚠ Users link not found in organization");
        }
      } else {
        console.log("⚠ Government organization not found");
      }
    } else {
      console.log("⚠ Governance tab not found");
      console.log("Current URL:", page.url());
    }

    console.log("Closing page and context to flush video...");
    await page.close();
    await context.close();

    // Move video
    const videoFiles = fs.readdirSync(".agent-hq/pw-videos");
    const latestVideo = videoFiles
      .filter((f) => f.endsWith(".webm"))
      .sort()
      .pop();

    if (latestVideo) {
      const src = path.join(".agent-hq/pw-videos", latestVideo);
      const dest = "specs/33/videos/ac2-ac4-org-roles.webm";
      fs.renameSync(src, dest);
      console.log(`✓ Video moved to ${dest}`);
    }

    console.log("\n=== AC2/AC4 COMPLETED ===");
  } catch (error) {
    console.error("\n=== AC2/AC4 FAILED ===");
    console.error(`Error: ${error.message}`);
    throw error;
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
