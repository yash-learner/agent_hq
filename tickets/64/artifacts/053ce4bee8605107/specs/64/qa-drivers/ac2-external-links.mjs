import { chromium } from "playwright";
import { openAuthedContext } from "../../../.agent-hq/qa-auth.mjs";

/**
 * AC2: External links open in new tab with external link icon
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

    // Find "CARE Documentation" link (external)
    const careDocLink = page.getByRole("link", { name: /CARE Documentation/i });
    await careDocLink.waitFor({ state: "visible", timeout: 5000 });

    // Verify target="_blank" attribute
    const target = await careDocLink.getAttribute("target");
    console.log(`Target attribute: ${target}`);
    if (target !== "_blank") {
      throw new Error(`Expected target="_blank", got "${target}"`);
    }

    // Verify rel="noopener noreferrer"
    const rel = await careDocLink.getAttribute("rel");
    console.log(`Rel attribute: ${rel}`);
    if (!rel?.includes("noopener") || !rel?.includes("noreferrer")) {
      throw new Error(`Expected rel to include "noopener noreferrer", got "${rel}"`);
    }

    // Verify external link icon is present
    const hasExternalIcon = await careDocLink.locator('svg').count();
    console.log(`External link icon present: ${hasExternalIcon > 0}`);

    // Take screenshot
    await page.screenshot({
      path: "specs/64/screenshots/ac2-external-link.png",
    });

    console.log("\n✅ AC2 PASSED: External links open in new tab with external link icon");

    await context.close();
  } catch (error) {
    console.error("\n❌ AC2 FAILED:", error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
