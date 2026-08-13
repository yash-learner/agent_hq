import { chromium } from "playwright";
import { openAuthedContext } from "../../../.agent-hq/qa-auth.mjs";

/**
 * AC6: Tooltip displays link name when sidebar is collapsed
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

    // Navigate to facility overview (desktop viewport required for collapse trigger)
    await page.goto(`${baseUrl}/facility/${facilityId}/overview`);
    await page.waitForLoadState("networkidle");

    // Verify sidebar is expanded
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await sidebar.waitFor({ state: "visible", timeout: 10000 });
    console.log("✓ Sidebar visible (expanded)");

    // Click collapse trigger
    const collapseTrigger = page.locator('[data-sidebar="trigger"]');
    await collapseTrigger.click();
    await page.waitForTimeout(500); // Wait for collapse animation
    console.log("✓ Sidebar collapsed");

    await page.screenshot({
      path: "specs/64/screenshots/ac6-sidebar-collapsed.png",
    });

    // Hover over a custom footer link
    const careDocLink = page.getByRole("link", { name: /CARE Documentation/i });
    await careDocLink.hover();
    await page.waitForTimeout(500); // Wait for tooltip to appear

    // Check for tooltip (shadcn/ui Tooltip component)
    const tooltip = page.locator('[role="tooltip"]');
    const isTooltipVisible = await tooltip.isVisible().catch(() => false);
    console.log(`Tooltip visible: ${isTooltipVisible}`);

    if (isTooltipVisible) {
      const tooltipText = await tooltip.textContent();
      console.log(`Tooltip text: "${tooltipText}"`);
      
      if (!tooltipText?.includes("CARE Documentation")) {
        throw new Error(`Expected tooltip to contain "CARE Documentation", got "${tooltipText}"`);
      }
    } else {
      throw new Error("Tooltip did not appear on hover in collapsed state");
    }

    await page.screenshot({
      path: "specs/64/screenshots/ac6-tooltip-visible.png",
    });

    console.log("\n✅ AC6 PASSED: Tooltip displays link name when sidebar is collapsed");

    await context.close();
  } catch (error) {
    console.error("\n❌ AC6 FAILED:", error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
