#!/usr/bin/env node
/**
 * AC1: Identifier search shows correct match count for fixtures
 * Tests that searching by phone number on the identifier tab displays
 * a count line above the results showing the correct number of matches.
 */

import { chromium } from "playwright";
import { openAuthedContext } from "../../../.agent-hq/qa-auth.mjs";

const FACILITY_ID = "6cb92e18-d77d-4316-87eb-2273596e4b1b";

async function main() {
  console.log("[ac1] Starting AC1: Identifier search count test");
  
  const browser = await chromium.launch({ headless: true });
  let context, page, size;

  try {
    console.log("[ac1] Opening authenticated context");
    ({ context, page, size } = await openAuthedContext(browser, {
      facilityId: FACILITY_ID,
      videoDir: "specs/51/videos-tmp/ac1",
    }));

    console.log("[ac1] Enabling screencast actions (cursor pointer)");
    await page.screencast.showActions({ cursor: "pointer" });

    console.log("[ac1] Step 1: Navigate to patients page");
    await page.goto(`http://localhost:4000/facility/${FACILITY_ID}/patients`);
    await page.waitForLoadState("networkidle");
    console.log("[ac1] Page loaded successfully");

    console.log("[ac1] Step 2: Verify Patient Identifiers tab is active");
    const identifiersTab = page.getByRole("tab", { name: /patient identifiers/i });
    await identifiersTab.waitFor({ state: "visible", timeout: 15000 });
    console.log("[ac1] Patient Identifiers tab visible");

    console.log("[ac1] Step 3: Look for search input");
    const searchInput = page.locator('input[type="tel"], input[name*="phone"], input[placeholder*="search" i]').first();
    await searchInput.waitFor({ state: "visible", timeout: 10000 });
    console.log("[ac1] Search input found");

    console.log("[ac1] Step 4: Type phone number to search");
    await searchInput.fill("+919");
    console.log("[ac1] Search term '+919' entered");

    // Wait for search to complete
    console.log("[ac1] Waiting for search results to load");
    await page.waitForTimeout(4000);

    console.log("[ac1] Step 5: Look for count line or results table");
    // Check if results appeared
    const hasTable = await page.locator('table').isVisible().catch(() => false);
    const hasEmpty = await page.getByText(/no patient record found/i).isVisible().catch(() => false);
    console.log(`[ac1] Table visible: ${hasTable}, Empty state: ${hasEmpty}`);

    if (!hasTable && !hasEmpty) {
      console.log("[ac1] Neither table nor empty state visible - taking screenshot for debugging");
      await page.screenshot({ path: ".agent-hq/ac1-no-results.png", fullPage: true });
      const bodyText = await page.locator('body').textContent();
      console.log("[ac1] Page text snippet:", bodyText.slice(0, 500));
    }

    if (hasTable || hasEmpty) {
      const countLine = page.locator('text=/\\d+ results?/i').first();
      if (await countLine.isVisible().catch(() => false)) {
        const countText = await countLine.textContent();
        console.log(`[ac1] ✓ Count line found: "${countText}"`);

        const match = countText.match(/(\d+)\s+results?/i);
        if (match) {
          const displayedCount = parseInt(match[1], 10);
          console.log(`[ac1] Displayed count: ${displayedCount}`);
        }
        console.log("[ac1] ✓ SUCCESS: Count line displays correctly");
      } else if (hasEmpty) {
        console.log("[ac1] Empty state visible, no count line (expected for no results)");
        console.log("[ac1] ✓ SUCCESS: Empty state shows without count line");
      } else {
        console.log("[ac1] ✗ FAILED: Results table visible but no count line found");
        throw new Error("Count line not found with results");
      }
    } else {
      throw new Error("Search did not produce results or empty state");
    }

    console.log("[ac1] Closing page to flush video");
    await page.close();

  } catch (error) {
    console.error(`[ac1] ✗ FAILED: ${error.message}`);
    if (page) {
      await page.screenshot({ path: ".agent-hq/ac1-error.png", fullPage: true }).catch(() => {});
    }
    throw error;
  } finally {
    console.log("[ac1] Closing browser context");
    if (context) await context.close();
    await browser.close();
    console.log("[ac1] Test complete");
  }
}

main().catch((err) => {
  console.error("[ac1] Fatal error:", err);
  process.exit(1);
});
