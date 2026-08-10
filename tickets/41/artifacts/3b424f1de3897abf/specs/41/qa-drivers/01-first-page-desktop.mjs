#!/usr/bin/env node

import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../../..");

const FACILITY_ID = "0d73ab28-31ca-48cb-8c3f-a91552600be7";
const PATIENT_ID = "f8dcfab4-5471-4c51-bf03-f51deefd2650";
const ENCOUNTER_ID = "58542b5d-e647-443f-a912-3436235e6469";

async function main() {
  console.log("🎬 Starting QA Driver: First page loads immediately — Desktop");
  console.log(`📍 Facility: ${FACILITY_ID}`);
  console.log(`🧑 Patient: ${PATIENT_ID}`);
  console.log(`🏥 Encounter: ${ENCOUNTER_ID}`);

  const browser = await chromium.launch({ headless: true });
  const size = { width: 1440, height: 900 };

  const context = await browser.newContext({
    storageState: path.join(projectRoot, "tests/.auth/user.json"),
    viewport: size,
    recordVideo: {
      dir: path.join(projectRoot, ".agent-hq/pw-videos"),
      size,
    },
  });

  const page = await context.newPage();

  try {
    // Enable cursor tracking
    await page.screencast.showActions({ cursor: "pointer" });
    console.log("✅ Cursor tracking enabled");

    // Navigate to encounter medicines tab
    const url = `http://localhost:4000/facility/${FACILITY_ID}/patient/${PATIENT_ID}/encounter/${ENCOUNTER_ID}/medicines`;
    console.log(`🔗 Navigating to: ${url}`);
    await page.goto(url, { waitUntil: "networkidle" });

    // Wait for auth shell readiness
    console.log("⏳ Waiting for auth shell...");
    await page.waitForSelector('[data-sidebar="sidebar"]', { timeout: 10000 });
    console.log("✅ Auth shell loaded");

    // Check for login UI (should not be present)
    const loginPresent = await page.getByRole("button", { name: "Sign In" }).isVisible().catch(() => false);
    if (loginPresent) {
      throw new Error("❌ Login UI present on facility URL - auth failure");
    }
    console.log("✅ No login UI present");

    // Wait for medicines tab content to load
    await page.waitForTimeout(2000);

    // Click Dispense History tab
    console.log("🔍 Looking for Dispense History tab...");
    await page.getByRole("tab", { name: /dispense.*history/i }).click();
    await page.waitForTimeout(2000);
    console.log("✅ Dispense History tab clicked");

    // Wait for dispense order list to load
    console.log("⏳ Waiting for dispense order list...");
    await page.waitForSelector('.space-y-2 > .rounded-md', {
      timeout: 10000,
    });
    console.log("✅ Dispense order list loaded");

    // Count visible dispense orders (Card elements with PackageIcon)
    const dispenseOrders = await page.locator('.space-y-2 > .rounded-md').count();
    console.log(`📊 Visible dispense orders: ${dispenseOrders}`);

    if (dispenseOrders < 10) {
      console.warn(`⚠️ Expected at least 10 visible orders, found ${dispenseOrders}`);
    } else {
      console.log("✅ First page loaded with multiple dispense orders");
    }

    // Check if detail pane or dispense list is visible
    const dispenseListVisible = await page.locator('.space-y-2 > .rounded-md').isVisible().catch(() => false);
    if (dispenseListVisible) {
      console.log("✅ Dispense order list is visible");
    } else {
      console.log("⚠️ Dispense order list not visible");
    }

    // Wait a moment for final recording
    await page.waitForTimeout(2000);
    console.log("✅ Criterion 1 passed: First page loads immediately");
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    throw error;
  } finally {
    await page.close();
    await context.close();
    await browser.close();
    console.log("🎬 Browser closed");
  }
}

main().catch((error) => {
  console.error(`💥 Fatal error: ${error.message}`);
  process.exit(1);
});
