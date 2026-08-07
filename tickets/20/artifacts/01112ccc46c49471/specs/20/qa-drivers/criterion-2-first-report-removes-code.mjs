#!/usr/bin/env node
import fs from "fs";
import { chromium } from "playwright";

const seedData = JSON.parse(
  fs.readFileSync(".agent-hq/multiple-diagnostic-seed.json", "utf-8")
);

const { facilityId, serviceRequestId, diagnosticReportCodes } = seedData;

console.log("Criterion 2: Code removed from dropdown after first report creation");
console.log(`Service Request ID: ${serviceRequestId}`);

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
  // Navigate to Service Request detail page
  const url = `http://localhost:4000/facility/${facilityId}/service_requests/${serviceRequestId}`;
  await page.goto(url, { waitUntil: "networkidle" });
  console.log(`\nNavigated to: ${url}`);
  await page.waitForTimeout(2000);

  // Step 1: Select first diagnostic report code
  console.log("\nStep 1: Select first diagnostic report code from dropdown");
  const dropdownTrigger = page.getByText("Select Diagnostic Report Type");
  await dropdownTrigger.waitFor({ state: "visible", timeout: 10000 });
  await dropdownTrigger.click();
  await page.waitForTimeout(1000);

  // Click the first option
  const firstOption = page.locator('[role="option"]').first();
  const firstOptionText = await firstOption.textContent();
  console.log(`Selected: ${firstOptionText}`);
  await firstOption.click();
  await page.waitForTimeout(1000);

  // Step 2: Click "Create Report" button
  console.log("\nStep 2: Click 'Create Report' button");
  
  // Look for create button
  const createButtonCandidates = await page.getByRole("button").all();
  console.log(`Found ${createButtonCandidates.length} buttons on page`);
  
  // Find button with "Create" text
  let createButton = null;
  for (const btn of createButtonCandidates) {
    const text = await btn.textContent();
    if (text && /create\s*report/i.test(text)) {
      console.log(`Found Create Report button: "${text}"`);
      createButton = btn;
      break;
    }
  }
  
  if (!createButton) {
    throw new Error("Create Report button not found");
  }
  
  await createButton.click();
  
  // Wait for either success toast or error
  console.log("Waiting for response...");
  await page.waitForTimeout(4000);
  
  // Take screenshot to see result
  await page.screenshot({ path: ".agent-hq/after-first-create.png", fullPage: true });
  console.log("Screenshot saved for debugging");

  // Check for any toast messages
  const allText = await page.locator("body").textContent();
  if (allText.includes("successfully") || allText.includes("created")) {
    console.log("Success indication found");
  }

  // Step 3: Click dropdown again to verify used code is removed
  console.log("\nStep 3: Click dropdown again to verify only 2 codes remain");
  
  // Wait a bit more for UI to update
  await page.waitForTimeout(2000);
  
  const dropdownTrigger2 = page.getByText("Select Diagnostic Report Type");
  const dropdownCount = await dropdownTrigger2.count();
  console.log(`Found ${dropdownCount} dropdown triggers`);
  
  if (dropdownCount === 0) {
    throw new Error("Dropdown disappeared after creating first report - form may have hidden");
  }
  
  await dropdownTrigger2.first().waitFor({ state: "visible", timeout: 10000 });
  await dropdownTrigger2.first().click();
  await page.waitForTimeout(1000);

  // Count remaining options
  const options = await page.locator('[role="option"]').all();
  console.log(`Found ${options.length} options in dropdown`);

  // Verify we have 2 options (one was used)
  if (options.length !== 2) {
    throw new Error(`Expected 2 options, found ${options.length}`);
  }

  // Verify the used code is not in the list
  const optionTexts = await Promise.all(
    options.map((opt) => opt.textContent())
  );
  console.log("Remaining options:");
  optionTexts.forEach((text, i) => {
    console.log(`  Option ${i + 1}: ${text}`);
  });

  if (optionTexts.includes(firstOptionText)) {
    throw new Error(
      `Used code "${firstOptionText}" should not be in dropdown`
    );
  }

  console.log("\n✅ Criterion 2 passed: Used code removed from dropdown");
} catch (error) {
  console.error("\n❌ Criterion 2 failed:", error.message);
  throw error;
} finally {
  await page.close();
  await context.close();
  await browser.close();

  // Move video to correct location
  const videoPath = await page.video()?.path();
  if (videoPath && fs.existsSync(videoPath)) {
    fs.mkdirSync("specs/20/videos", { recursive: true });
    fs.copyFileSync(
      videoPath,
      "specs/20/videos/criterion-2-first-report-removes-code.webm"
    );
    console.log(
      "\n📹 Video saved to: specs/20/videos/criterion-2-first-report-removes-code.webm"
    );
  }
}
