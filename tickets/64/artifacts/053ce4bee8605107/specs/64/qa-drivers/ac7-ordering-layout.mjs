import { chromium } from "playwright";
import { openAuthedContext } from "../../../.agent-hq/qa-auth.mjs";

/**
 * AC7: Links appear in configuration order, stacked vertically
 */
async function main() {
  const browser = await chromium.launch({ headless: true });
  const facilityId = "eb3e60e4-a93e-4e15-8ee8-b2e3eb7248cf";
  const baseUrl = "http://127.0.0.1:4000";

  try {
    const { context, page } = await openAuthedContext(browser, {
      facilityId,
      baseUrl,
      videoDir: ".agent-hq/pw-videos",
      size: { width: 1440, height: 900 },
    });

    await page.screencast.showActions({ cursor: "pointer" });

    console.log("✓ Authenticated shell ready");

    // Navigate to facility overview
    await page.goto(`${baseUrl}/facility/${facilityId}/overview`);
    await page.waitForLoadState("networkidle");

    // Get all footer links
    const footerLinks = page.locator('[data-sidebar="footer"] a');
    const count = await footerLinks.count();
    console.log(`Found ${count} footer links`);

    // Expected order from .env.local:
    // 1. CARE Documentation
    // 2. Admin Panel (visibleIn: facility, so should appear)
    // 3. Third Link
    const expectedOrder = ["CARE Documentation", "Admin Panel", "Third Link"];
    
    const actualOrder = [];
    for (let i = 0; i < count; i++) {
      const text = await footerLinks.nth(i).textContent();
      actualOrder.push(text?.trim() || "");
      console.log(`  ${i + 1}. ${text?.trim()}`);
    }

    // Verify order matches configuration
    for (let i = 0; i < expectedOrder.length; i++) {
      if (actualOrder[i] !== expectedOrder[i]) {
        throw new Error(
          `Link order mismatch at position ${i + 1}: expected "${expectedOrder[i]}", got "${actualOrder[i]}"`
        );
      }
    }

    console.log("✓ Links appear in configuration order");

    // Verify vertical stacking by checking Y coordinates
    const positions = [];
    for (let i = 0; i < count; i++) {
      const box = await footerLinks.nth(i).boundingBox();
      positions.push({ index: i, y: box?.y || 0, x: box?.x || 0 });
    }

    // Each subsequent link should have a higher Y coordinate (stacked vertically)
    for (let i = 1; i < positions.length; i++) {
      if (positions[i].y <= positions[i - 1].y) {
        throw new Error(
          `Links are not vertically stacked: link ${i + 1} Y=${positions[i].y} should be > link ${i} Y=${positions[i - 1].y}`
        );
      }
    }

    console.log("✓ Links are stacked vertically");

    await page.screenshot({
      path: "specs/64/screenshots/ac7-ordering.png",
    });

    console.log("\n✅ AC7 PASSED: Links appear in configuration order, stacked vertically");

    await context.close();
  } catch (error) {
    console.error("\n❌ AC7 FAILED:", error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
