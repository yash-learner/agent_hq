#!/usr/bin/env node
import fs from "fs";
import { chromium } from "playwright";

const seedData = JSON.parse(
  fs.readFileSync(".agent-hq/multiple-diagnostic-seed.json", "utf-8")
);

const { facilityId, serviceRequestId, diagnosticReportCodes } = seedData;

console.log("Criterion 1: All AD codes appear in dropdown initially");
console.log(`Service Request ID: ${serviceRequestId}`);
console.log(`Expected codes: ${diagnosticReportCodes.length}`);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  storageState: "tests/.auth/user.json",
  recordVideo: {
    dir: ".agent-hq/pw-videos",
    size: { width: 1440, height: 900 },
  },
});

const page = await context.newPage();

// Enable cursor overlay
await page.screencast.showActions({ cursor: "pointer" });

try {
  // Step 1: Navigate to Service Request detail page
  console.log("\nStep 1: Navigate to SR detail page");
  const url = `http://localhost:4000/facility/${facilityId}/service_requests/${serviceRequestId}`;
  await page.goto(url, { waitUntil: "networkidle" });
  console.log(`Navigated to: ${url}`);

  // Wait for page to load
  await page.waitForTimeout(2000);

  // Step 2: Locate and click the diagnostic report type dropdown
  console.log("\nStep 2: Click diagnostic report type dropdown");
  
  // Look for the dropdown by text content
  const dropdownTrigger = page.getByText("Select Diagnostic Report Type");
  await dropdownTrigger.waitFor({ state: "visible", timeout: 10000 });
  await dropdownTrigger.click();
  
  // Wait for dropdown to open
  await page.waitForTimeout(1000);

  // Step 3: Count visible options in the dropdown
  console.log("\nStep 3: Verify all 3 codes are visible");
  
  // Get all options in the dropdown
  const options = await page.locator('[role="option"]').all();
  console.log(`Found ${options.length} options in dropdown`);

  // Verify we have 3 options (matching the 3 diagnostic report codes)
  if (options.length !== 3) {
    throw new Error(
      `Expected 3 options, found ${options.length}`
    );
  }

  // Log each option text
  for (let i = 0; i < options.length; i++) {
    const text = await options[i].textContent();
    console.log(`  Option ${i + 1}: ${text}`);
  }

  console.log("\n✅ Criterion 1 passed: All 3 AD codes appear in dropdown");
} catch (error) {
  console.error("\n❌ Criterion 1 failed:", error.message);
  throw error;
} finally {
  await page.close();
  await context.close();
  await browser.close();
  
  // Move video to correct location
  const videoPath = await page.video()?.path();
  if (videoPath && fs.existsSync(videoPath)) {
    fs.mkdirSync("specs/20/videos", { recursive: true });
    fs.copyFileSync(videoPath, "specs/20/videos/criterion-1-all-codes-dropdown.webm");
    console.log("\n📹 Video saved to: specs/20/videos/criterion-1-all-codes-dropdown.webm");
  }
}
