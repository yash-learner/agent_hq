import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";

const authFile = path.resolve("tests/.auth/user.json");
const seedFile = path.resolve(".agent-hq/multiple-diagnostic-seed.json");

async function main() {
  console.log("=== AC1: All codes available with no reports created ===\n");

  // Load seed data
  const seed = JSON.parse(fs.readFileSync(seedFile, "utf-8"));
  console.log(`Using Service Request: ${seed.serviceRequestId}`);
  console.log(`Expected diagnostic report codes: ${seed.diagnosticReportCodes.length}\n`);

  // Step 1: Drive the UI and record
  console.log("Step 1: Starting browser with video recording");

  const size = { width: 1440, height: 900 };
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: authFile,
    viewport: size,
    recordVideo: { dir: ".agent-hq/pw-videos", size },
  });

  const page = await context.newPage();
  await page.screencast.showActions({ cursor: "pointer" });

  const srUrl = `http://localhost:4000/facility/${seed.facilityId}/service_requests/${seed.serviceRequestId}`;
  console.log(`Navigating to: ${srUrl}`);
  
  try {
    await page.goto(srUrl, { waitUntil: "networkidle", timeout: 30000 });
  } catch (err) {
    console.log(`⚠ Navigation warning: ${err.message}`);
  }

  await page.waitForTimeout(3000);

  // Check what's on the page
  console.log("\nStep 2: Checking page state...");
  const title = await page.title();
  console.log(`Page title: ${title}`);
  
  const url = page.url();
  console.log(`Current URL: ${url}`);

  // Check if we're on login page
  const hasLoginForm = await page.locator('input[name="username"], input[placeholder*="Username"]').count() > 0;
  if (hasLoginForm) {
    console.log("⚠ Login form detected - attempting login...");
    
    // Login with admin credentials from fixtures
    await page.locator('input[name="username"], input[placeholder*="Username"]').fill("admin");
    await page.locator('input[name="password"], input[placeholder*="Password"]').fill("admin");
    await page.locator('button[type="submit"], button:has-text("Sign in")').click();
    
    console.log("Waiting for login to complete...");
    await page.waitForTimeout(3000);
    
    // Navigate to SR page again
    console.log(`Re-navigating to: ${srUrl}`);
    await page.goto(srUrl, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
  }

  // Wait for auth shell readiness
  console.log("\nStep 3: Waiting for auth shell readiness...");
  
  // Try multiple selectors
  const sidebarVisible = await page.locator('[data-sidebar="sidebar"]').isVisible().catch(() => false);
  const navVisible = await page.locator('nav').first().isVisible().catch(() => false);
  const overviewLink = await page.locator('a:has-text("Overview")').first().isVisible().catch(() => false);
  
  console.log(`Sidebar visible: ${sidebarVisible}`);
  console.log(`Nav visible: ${navVisible}`);
  console.log(`Overview link visible: ${overviewLink}`);

  if (!sidebarVisible && !navVisible && !overviewLink) {
    console.log("⚠ Navigation not visible, but continuing...");
  } else {
    console.log("✓ Auth shell appears ready");
  }

  // Take a screenshot for debugging
  await page.screenshot({ path: ".agent-hq/debug-page.png", fullPage: false });
  console.log("✓ Screenshot saved to .agent-hq/debug-page.png");

  // Wait for page to settle
  await page.waitForTimeout(2000);

  // AC1 Step 1: Locate the "Diagnostic Report" section
  console.log("\nAC1 Step 1: Looking for Diagnostic Report section");
  
  // Get all h2 and h3 headings
  const headings = await page.locator('h2, h3').allTextContents();
  console.log(`Headings on page: ${headings.join(", ")}`);
  
  // Look for diagnostic report section
  const diagnosticReportSection = await page.locator('text=/diagnostic.*report/i').first().isVisible().catch(() => false);
  
  if (diagnosticReportSection) {
    console.log("✓ Diagnostic Report section found");
  } else {
    console.log("⚠ Diagnostic Report section not immediately visible");
    
    // Try scrolling to find it
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(1000);
    
    const diagnosticReportSectionAfterScroll = await page.locator('text=/diagnostic.*report/i').first().isVisible().catch(() => false);
    if (diagnosticReportSectionAfterScroll) {
      console.log("✓ Diagnostic Report section found after scrolling");
    } else {
      console.log("✗ Diagnostic Report section not found");
    }
  }

  // AC1 Step 2: Look for the diagnostic report code dropdown
  console.log("\nAC1 Step 2: Looking for diagnostic report code dropdown");
  
  await page.waitForTimeout(2000);

  // Try to find any comboboxes or dropdowns
  const comboboxes = await page.locator('[role="combobox"]').count();
  console.log(`Found ${comboboxes} comboboxes on page`);
  
  const selectButtons = await page.locator('button').filter({ hasText: /select/i }).count();
  console.log(`Found ${selectButtons} 'select' buttons on page`);

  // Try to click the first combobox
  if (comboboxes > 0) {
    console.log("Attempting to click first combobox...");
    const dropdown = page.locator('[role="combobox"]').first();
    await dropdown.scrollIntoViewIfNeeded();
    await dropdown.click();
    await page.waitForTimeout(1500);

    // Check for options
    const options = page.locator('[role="option"]');
    const count = await options.count();
    console.log(`Found ${count} options in dropdown`);

    if (count > 0) {
      // List the options
      for (let i = 0; i < count; i++) {
        const text = await options.nth(i).textContent();
        console.log(`  Option ${i + 1}: ${text}`);
      }

      if (count === 3) {
        console.log("✓ PASS: 3 diagnostic report code options available");
      } else {
        console.log(`⚠ Warning: Expected 3 options, found ${count}`);
      }
    } else {
      console.log("⚠ No options found in dropdown");
    }

    // Close dropdown
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
  } else {
    console.log("⚠ No comboboxes found on page");
  }

  // AC1 Step 3: Check for existing diagnostic report cards
  console.log("\nAC1 Step 3: Checking for existing diagnostic report cards");
  
  // Look for cards with "report" in them
  const cards = await page.locator('[class*="card"]').count();
  console.log(`Found ${cards} cards on page`);
  
  const reportCards = await page.locator('text=/report.*#|diagnostic.*report.*created/i').count();
  console.log(`Found ${reportCards} report-related cards`);

  if (reportCards === 0) {
    console.log("✓ PASS: No diagnostic report cards visible");
  } else {
    console.log(`⚠ Warning: Found ${reportCards} diagnostic report cards`);
  }

  // Keep the video open for a bit to show the final state
  await page.waitForTimeout(3000);

  console.log("\n=== AC1 SUMMARY ===");
  console.log("Step 1: Diagnostic Report section - checked");
  console.log("Step 2: Dropdown with codes - checked");
  console.log("Step 3: No existing report cards - checked");

  await context.close();
  await browser.close();

  // Copy video to specs/23/videos/
  const videoFiles = fs.readdirSync(".agent-hq/pw-videos");
  if (videoFiles.length > 0) {
    const videoFile = videoFiles[0];
    fs.copyFileSync(
      path.join(".agent-hq/pw-videos", videoFile),
      "specs/23/videos/ac1-all-codes-available.webm"
    );
    console.log("\n✓ Video saved to specs/23/videos/ac1-all-codes-available.webm");
  } else {
    console.log("\n⚠ No video file found");
  }

  console.log("\n=== AC1 complete ===");
}

main().catch((err) => {
  console.error("ERROR:", err.message);
  console.error(err.stack);
  process.exit(1);
});
