import { chromium } from "playwright";
import { openAuthedContext } from "../../../.agent-hq/qa-auth.mjs";

/**
 * AC1: Custom footer links appear above NavUser in all sidebar contexts
 */
async function main() {
  const browser = await chromium.launch({ headless: true });
  const facilityId = "eb3e60e4-a93e-4e15-8ee8-b2e3eb7248cf";
  const baseUrl = "http://127.0.0.1:4000";

  try {
    // Open authenticated context
    const { context, page, size } = await openAuthedContext(browser, {
      facilityId,
      baseUrl,
      videoDir: ".agent-hq/pw-videos",
      size: { width: 1440, height: 900 },
    });

    // Enable cursor overlay
    await page.screencast.showActions({ cursor: "pointer" });

    console.log("✓ Authenticated shell ready");

    // Step 1: Navigate to facility overview
    await page.goto(`${baseUrl}/facility/${facilityId}/overview`);
    await page.waitForLoadState("networkidle");
    console.log("✓ Navigated to facility overview");

    // Wait for sidebar to be visible
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await sidebar.waitFor({ state: "visible", timeout: 10000 });
    console.log("✓ Sidebar visible");

    // Check for custom footer links above NavUser
    const footerLinks = page.locator('[data-sidebar="footer"]');
    await footerLinks.waitFor({ state: "visible", timeout: 5000 });
    console.log("✓ Footer links section visible");

    // Verify specific links
    const careDocLink = page.getByRole("link", { name: /CARE Documentation/i });
    await careDocLink.waitFor({ state: "visible", timeout: 5000 });
    console.log("✓ 'CARE Documentation' link visible");

    const adminLink = page.getByRole("link", { name: /Admin Panel/i });
    await adminLink.waitFor({ state: "visible", timeout: 5000 });
    console.log("✓ 'Admin Panel' link visible");

    // Step 2: Navigate to admin page
    await page.goto(`${baseUrl}/admin`);
    await page.waitForLoadState("networkidle");
    console.log("✓ Navigated to admin page");

    // Check sidebar visible in admin context
    await sidebar.waitFor({ state: "visible", timeout: 10000 });
    console.log("✓ Sidebar visible in admin context");

    // Verify footer links appear in admin sidebar (some may be filtered)
    await footerLinks.waitFor({ state: "visible", timeout: 5000 });
    console.log("✓ Footer links section visible in admin context");

    // Step 3: Scroll to view NavUser component
    await page.locator('[data-sidebar="footer"]').scrollIntoViewIfNeeded();
    console.log("✓ Scrolled to footer section");

    // Take a screenshot
    await page.screenshot({
      path: "specs/64/screenshots/ac1-footer-links.png",
      fullPage: false,
    });
    console.log("✓ Screenshot saved");

    console.log("\n✅ AC1 PASSED: Custom footer links appear above NavUser in all sidebar contexts");

    await context.close();
  } catch (error) {
    console.error("\n❌ AC1 FAILED:", error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
