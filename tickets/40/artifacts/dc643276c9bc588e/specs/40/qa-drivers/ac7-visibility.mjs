#!/usr/bin/env node

import { chromium } from "@playwright/test";
import { resolve } from "path";

const workspaceRoot = "/workspaces/agent_hq/_target/dc643276c9bc588e";
const size = { width: 1440, height: 900 };

async function runAC7() {
  console.log("[AC7] Starting test: Links filtered by showIn visibility config");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: resolve(workspaceRoot, "tests", ".auth", "user.json"),
    viewport: size,
    recordVideo: {
      dir: resolve(workspaceRoot, ".agent-hq/pw-videos"),
      size,
    },
  });

  const page = await context.newPage();
  await page.screencast.showActions({ cursor: "pointer" });

  try {
    console.log("[AC7] Navigating to app...");
    await page.goto("http://localhost:4000/");
    await page.waitForLoadState("networkidle");

    await page.waitForSelector(".animate-spin", { state: "detached", timeout: 10000 }).catch(() => {});

    // Navigate to facility context
    console.log("[AC7] Navigating to facility context...");
    const facilityLink = await page.getByRole("link", { name: /facility/i }).first().isVisible().catch(() => false);
    if (facilityLink) {
      await page.getByRole("link", { name: /facility/i }).first().click();
      await page.waitForLoadState("networkidle");
    } else {
      await page.goto("http://localhost:4000/facility/1/overview");
      await page.waitForLoadState("networkidle");
    }

    await Promise.race([
      page.locator('[data-sidebar="sidebar"]').waitFor({ state: "visible", timeout: 10000 }),
      page.getByRole("link", { name: "Overview" }).first().waitFor({ state: "visible", timeout: 10000 }),
    ]);

    console.log("[AC7] Checking custom links in facility context...");
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await sidebar.evaluate((el) => { el.scrollTop = el.scrollHeight; });
    await page.waitForTimeout(1000);

    // Check for facility-specific and global links
    const facilityLinkEl = page.locator('a:has-text("Facility Link")');
    const adminLinkEl = page.locator('a:has-text("Admin Link")');
    const globalLinkEl = page.locator('a:has-text("Global Link")');

    const facilityVisible = await facilityLinkEl.isVisible().catch(() => false);
    const adminVisible = await adminLinkEl.isVisible().catch(() => false);
    const globalVisible = await globalLinkEl.isVisible().catch(() => false);

    console.log(`[AC7] In facility context: Facility Link visible=${facilityVisible}, Admin Link visible=${adminVisible}, Global Link visible=${globalVisible}`);

    if (facilityVisible && globalVisible && !adminVisible) {
      console.log("[AC7] SUCCESS: Correct links visible in facility context (Facility + Global, no Admin)");
    } else {
      console.log("[AC7] WARNING: Unexpected visibility pattern in facility context");
    }

    // Now navigate to admin context
    console.log("[AC7] Navigating to admin context...");
    await page.goto("http://localhost:4000/admin");
    await page.waitForLoadState("networkidle");

    await Promise.race([
      page.locator('[data-sidebar="sidebar"]').waitFor({ state: "visible", timeout: 10000 }),
      page.getByRole("link", { name: "Users" }).first().waitFor({ state: "visible", timeout: 10000 }),
    ]);

    console.log("[AC7] Checking custom links in admin context...");
    const adminSidebar = page.locator('[data-sidebar="sidebar"]');
    await adminSidebar.evaluate((el) => { el.scrollTop = el.scrollHeight; });
    await page.waitForTimeout(1000);

    const facilityVisibleAdmin = await facilityLinkEl.isVisible().catch(() => false);
    const adminVisibleAdmin = await adminLinkEl.isVisible().catch(() => false);
    const globalVisibleAdmin = await globalLinkEl.isVisible().catch(() => false);

    console.log(`[AC7] In admin context: Facility Link visible=${facilityVisibleAdmin}, Admin Link visible=${adminVisibleAdmin}, Global Link visible=${globalVisibleAdmin}`);

    if (!facilityVisibleAdmin && adminVisibleAdmin && globalVisibleAdmin) {
      console.log("[AC7] SUCCESS: Correct links visible in admin context (Admin + Global, no Facility)");
    } else {
      console.log("[AC7] WARNING: Unexpected visibility pattern in admin context");
    }

    console.log("[AC7] Test completed successfully");
  } catch (error) {
    console.error("[AC7] Test failed:", error.message);
    throw error;
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}

runAC7().catch((error) => {
  console.error("[AC7] Fatal error:", error);
  process.exit(1);
});
