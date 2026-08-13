import { chromium } from "playwright";
import { openAuthedContext } from "../../../.agent-hq/qa-auth.mjs";

/**
 * AC4: Links filtered by visibleIn sidebar context
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

    // Step 1: Verify link appears in facility context
    await page.goto(`${baseUrl}/facility/${facilityId}/overview`);
    await page.waitForLoadState("networkidle");

    const adminLinkInFacility = page.getByRole("link", { name: /Admin Panel/i });
    const isVisibleInFacility = await adminLinkInFacility.isVisible().catch(() => false);
    console.log(`"Admin Panel" visible in facility context: ${isVisibleInFacility}`);

    if (!isVisibleInFacility) {
      throw new Error(`"Admin Panel" link with visibleIn:["facility"] should appear in facility sidebar`);
    }

    await page.screenshot({
      path: "specs/64/screenshots/ac4-facility-context.png",
    });

    // Step 2: Verify link does NOT appear in admin context
    await page.goto(`${baseUrl}/admin`);
    await page.waitForLoadState("networkidle");

    const adminLinkInAdmin = page.getByRole("link", { name: /Admin Panel/i });
    const isVisibleInAdmin = await adminLinkInAdmin.isVisible().catch(() => false);
    console.log(`"Admin Panel" visible in admin context: ${isVisibleInAdmin}`);

    if (isVisibleInAdmin) {
      throw new Error(`"Admin Panel" link with visibleIn:["facility"] should NOT appear in admin sidebar`);
    }

    await page.screenshot({
      path: "specs/64/screenshots/ac4-admin-context.png",
    });

    // Step 3: Verify link reappears when returning to facility
    await page.goto(`${baseUrl}/facility/${facilityId}/overview`);
    await page.waitForLoadState("networkidle");

    const adminLinkAgain = page.getByRole("link", { name: /Admin Panel/i });
    const isVisibleAgain = await adminLinkAgain.isVisible().catch(() => false);
    console.log(`"Admin Panel" visible in facility context (second time): ${isVisibleAgain}`);

    if (!isVisibleAgain) {
      throw new Error(`"Admin Panel" link should reappear when returning to facility context`);
    }

    console.log("\n✅ AC4 PASSED: Links filtered by visibleIn sidebar context");

    await context.close();
  } catch (error) {
    console.error("\n❌ AC4 FAILED:", error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
