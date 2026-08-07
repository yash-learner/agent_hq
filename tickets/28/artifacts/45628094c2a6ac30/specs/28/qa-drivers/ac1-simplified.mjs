#!/usr/bin/env node
/**
 * AC1: Simplified driver using existing multi-code AD from fixtures/earlier run
 */

import { chromium } from "@playwright/test";
import * as fs from "fs";

const FACILITY_ID = "386772e0-eb8b-4a16-8c42-12a2f0836afa";
const AD_ID = "c41089a0-03b4-492b-a5da-d407875dfd89"; // Multi-Code Lab Test from earlier
const size = { width: 1440, height: 900 };

async function main() {
  console.log("=== AC1: Create up to N diagnostic reports (simplified) ===");
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: "tests/.auth/user.json",
    viewport: size,
    recordVideo: { dir: ".agent-hq/pw-videos", size },
  });
  
  const page = await context.newPage();
  await page.screencast.showActions({ cursor: "pointer" });
  
  try {
    // Navigate to facility overview to check auth
    console.log("Step: Verifying auth shell...");
    await page.goto(`http://localhost:4000/facility/${FACILITY_ID}/overview`);
    await page.waitForLoadState("networkidle");
    await page.locator(".animate-spin").waitFor({ state: "hidden", timeout: 10000 }).catch(() => {});
    
    const sidebarVisible = await page.locator('[data-sidebar="sidebar"]').isVisible().catch(() => false);
    if (!sidebarVisible) {
      throw new Error("Auth shell not verified");
    }
    console.log("✓ Auth shell verified");
    
    // Navigate to encounters
    console.log("\nStep: Navigating to encounters list...");
    await page.goto(`http://localhost:4000/facility/${FACILITY_ID}/encounters`);
    await page.waitForLoadState("networkidle");
    
    // Click first encounter
    console.log("Step: Opening first encounter...");
    await page.waitForTimeout(2000);
    const encounterCard = page.locator('a[href*="/encounter/"]').first();
    await encounterCard.waitFor({ state: "visible", timeout: 10000 });
    await encounterCard.click();
    
    await page.waitForURL(/\/encounter\//);
    const encounterUrl = page.url();
    console.log(`✓ Opened encounter: ${encounterUrl}`);
    
    // Go to Service Requests tab
    console.log("\nStep: Opening Service Requests tab...");
    await page.getByRole("tab", { name: /service request/i }).click();
    await page.waitForTimeout(2000);
    
    // Create Service Request
    console.log("Step: Creating Service Request...");
    await page.getByRole("button", { name: /create service request/i }).click();
    await page.waitForTimeout(1500);
    
    // Select Activity Definition
    console.log("Step: Selecting Activity Definition with 3 codes...");
    const adPicker = page.locator('button[role="combobox"]').filter({ hasText: /select activity definition/i });
    await adPicker.waitFor({ state: "visible", timeout: 10000 });
    await adPicker.click();
    await page.waitForTimeout(500);
    
    // Navigate to Lab Tests
    await page.getByText("Lab Tests").click();
    await page.waitForTimeout(500);
    
    // Find and select our multi-code AD
    await page.getByPlaceholder(/search/i).fill("Multi-Code Lab Test");
    await page.waitForTimeout(1000);
    await page.getByRole("option", { name: /Multi-Code Lab Test/i }).first().click();
    await page.waitForTimeout(1000);
    
    // Expand the card and set priority
    const srCard = page.locator('[data-slot="collapsible"]').filter({ hasText: /Multi-Code Lab Test/i }).first();
    await srCard.locator('[data-slot="collapsible-trigger"]').click();
    await page.waitForTimeout(500);
    await srCard.getByRole("radio", { name: /routine/i }).check();
    
    // Submit
    console.log("Step: Submitting Service Request...");
    await page.getByRole("button", { name: /submit/i }).click();
    
    const toast = await page.getByText(/questionnaire submitted successfully/i).waitFor({ timeout: 10000 }).then(() => true).catch(() => false);
    if (!toast) {
      throw new Error("Service Request creation failed");
    }
    console.log("✓ Service Request created");
    
    // Wait for redirect to SR detail page
    await page.waitForURL(/\/service_request\//, { timeout: 10000 });
    await page.waitForTimeout(3000); // Let page load
    
    console.log("\n--- TESTING DIAGNOSTIC REPORT CREATION ---");
    
    // Find the dropdown
    const dropdown = page.getByRole("combobox", { name: /select diagnostic report type/i });
    const dropdownVisible = await dropdown.isVisible().catch(() => false);
    
    if (!dropdownVisible) {
      console.warn("WARNING: Dropdown not visible yet. Scrolling to find Test Results Entry...");
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2000);
    }
    
    // Step 3: Check all 3 codes visible
    console.log("\nStep 3: Opening dropdown to verify 3 codes...");
    await dropdown.scrollIntoViewIfNeeded();
    await dropdown.click();
    await page.waitForTimeout(1000);
    
    const codes = await page.getByRole("option").allTextContents();
    console.log(`Found ${codes.length} codes: ${codes.join(", ")}`);
    
    if (codes.length !== 3) {
      throw new Error(`Expected 3 codes, found ${codes.length}`);
    }
    console.log("✓ All 3 codes visible");
    
    // Step 4-5: Create first report
    console.log("\nSteps 4-5: Creating first diagnostic report...");
    await page.getByRole("option").first().click();
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: /create report/i }).click();
    
    const toast1 = await page.getByText(/diagnostic report created successfully/i).waitFor({ timeout: 10000 }).then(() => true).catch(() => false);
    if (!toast1) {
      throw new Error("First report creation failed");
    }
    console.log("✓ First report created");
    
    // Step 6-7: Check only 2 codes remain
    await page.waitForTimeout(2000);
    console.log("\nSteps 6-7: Verifying only 2 codes remain...");
    await dropdown.click();
    await page.waitForTimeout(1000);
    
    const remainingCodes = await page.getByRole("option").count();
    if (remainingCodes !== 2) {
      throw new Error(`Expected 2 remaining codes, found ${remainingCodes}`);
    }
    console.log("✓ Only 2 codes remain");
    
    // Step 8-9: Create second report
    console.log("\nSteps 8-9: Creating second diagnostic report...");
    await page.getByRole("option").first().click();
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: /create report/i }).click();
    
    const toast2 = await page.getByText(/diagnostic report created successfully/i).waitFor({ timeout: 10000 }).then(() => true).catch(() => false);
    if (!toast2) {
      throw new Error("Second report creation failed");
    }
    console.log("✓ Second report created");
    
    // Step 10: Check only 1 code remains
    await page.waitForTimeout(2000);
    console.log("\nStep 10: Verifying only 1 code remains...");
    await dropdown.click();
    await page.waitForTimeout(1000);
    
    const lastCode = await page.getByRole("option").count();
    if (lastCode !== 1) {
      throw new Error(`Expected 1 remaining code, found ${lastCode}`);
    }
    console.log("✓ Only 1 code remains");
    
    // Step 11: Create third report
    console.log("\nStep 11: Creating third diagnostic report...");
    await page.getByRole("option").first().click();
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: /create report/i }).click();
    
    const toast3 = await page.getByText(/diagnostic report created successfully/i).waitFor({ timeout: 10000 }).then(() => true).catch(() => false);
    if (!toast3) {
      throw new Error("Third report creation failed");
    }
    console.log("✓ Third report created");
    
    // Step 12: Verify form hidden
    await page.waitForTimeout(2000);
    console.log("\nStep 12: Verifying form is hidden...");
    const formHidden = await dropdown.isVisible().catch(() => false);
    
    if (formHidden) {
      throw new Error("Form still visible after all codes used");
    }
    console.log("✓ Form hidden after all codes used");
    
    console.log("\n=== AC1 PASSED ===");
    
  } catch (error) {
    console.error("\n=== AC1 FAILED ===");
    console.error(`Error: ${error.message}`);
    throw error;
  } finally {
    await page.close();
    
    const video = await page.video();
    if (video) {
      const videoPath = await video.path();
      if (fs.existsSync(videoPath)) {
        fs.copyFileSync(videoPath, "specs/28/videos/ac1-multi-reports.webm");
        console.log("\nVideo: specs/28/videos/ac1-multi-reports.webm");
      }
    }
    
    await context.close();
    await browser.close();
  }
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
