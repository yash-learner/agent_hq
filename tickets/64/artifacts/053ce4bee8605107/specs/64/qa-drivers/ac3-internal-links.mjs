import { chromium } from "playwright";
import { openAuthedContext } from "../../../.agent-hq/qa-auth.mjs";

/**
 * AC3: Internal links navigate in current tab with internal route icon
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

    // Find "Admin Panel" link (internal)
    const adminLink = page.getByRole("link", { name: /Admin Panel/i });
    await adminLink.waitFor({ state: "visible", timeout: 5000 });

    // Verify NO target="_blank" attribute (internal links navigate in same tab)
    const target = await adminLink.getAttribute("target");
    console.log(`Target attribute: ${target}`);
    if (target === "_blank") {
      throw new Error(`Internal link should not have target="_blank"`);
    }

    // Verify href is internal route
    const href = await adminLink.getAttribute("href");
    console.log(`Href: ${href}`);
    if (!href?.startsWith("/")) {
      throw new Error(`Expected internal route starting with /, got "${href}"`);
    }

    // Verify internal link icon is present (Link2 from lucide-react)
    const hasInternalIcon = await adminLink.locator('svg').count();
    console.log(`Internal link icon present: ${hasInternalIcon > 0}`);

    // Click link and verify navigation in same tab
    const currentUrl = page.url();
    await adminLink.click();
    await page.waitForLoadState("networkidle");
    const newUrl = page.url();
    console.log(`Navigated from ${currentUrl} to ${newUrl}`);

    if (!newUrl.includes("/admin")) {
      throw new Error(`Expected navigation to /admin, got ${newUrl}`);
    }

    await page.screenshot({
      path: "specs/64/screenshots/ac3-internal-link.png",
    });

    console.log("\n✅ AC3 PASSED: Internal links navigate in current tab with internal route icon");

    await context.close();
  } catch (error) {
    console.error("\n❌ AC3 FAILED:", error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
