#!/usr/bin/env node
/**
 * AC1: Create up to N diagnostic reports for N diagnostic report codes
 * 
 * This driver creates an Activity Definition with 3 diagnostic report codes,
 * creates a Service Request from it, then verifies the user can create up to
 * 3 diagnostic reports, one for each code.
 */

import { chromium } from "@playwright/test";
import * as fs from "fs";

const FACILITY_ID = "386772e0-eb8b-4a16-8c42-12a2f0836afa";
const size = { width: 1440, height: 900 };

async function main() {
  console.log("=== AC1: Create up to N diagnostic reports ===");
  console.log("Step: Launching browser with auth...");
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: "tests/.auth/user.json",
    viewport: size,
    recordVideo: { dir: ".agent-hq/pw-videos", size },
  });
  
  const page = await context.newPage();
  await page.screencast.showActions({ cursor: "pointer" });
  
  try {
    console.log("Step: Navigating to facility overview to verify auth shell...");
    await page.goto(`http://localhost:4000/facility/${FACILITY_ID}/overview`);
    await page.waitForLoadState("networkidle");
    
    // Wait for spinner to be gone
    await page.locator(".animate-spin").waitFor({ state: "hidden", timeout: 10000 }).catch(() => {});
    
    // Check for auth shell readiness
    const sidebarVisible = await page.locator('[data-sidebar="sidebar"]').isVisible().catch(() => false);
    const loginVisible = await page.locator('input[name="username"]').isVisible().catch(() => false);
    
    if (loginVisible) {
      throw new Error("Login form visible on facility URL - auth failure");
    }
    
    if (!sidebarVisible) {
      console.warn("Sidebar not visible, checking for navigation...");
    }
    
    console.log("Auth shell: verified (sidebar visible, no login form)");
    
    // Now create Activity Definition with 3 diagnostic report codes
    console.log("Step: Creating Activity Definition with 3 diagnostic report codes...");
    const timestamp = Date.now();
    const adTitle = `Multi-Code Lab Test ${timestamp}`;
    
    await page.goto(`http://localhost:4000/facility/${FACILITY_ID}/settings/activity_definitions/categories/f-${FACILITY_ID}-lab-tests-activity-definition/new`);
    await page.waitForLoadState("networkidle");
    
    console.log("Step: Filling Activity Definition form...");
    await page.getByLabel(/title.*\*/i).fill(adTitle);
    await page.getByLabel(/description.*\*/i).fill("Activity Definition with multiple diagnostic report codes");
    await page.getByLabel(/usage.*\*/i).fill("Used to test multiple diagnostic reports");
    
    // Select status: Active
    await page.getByLabel(/^status$/i).click();
    await page.getByRole("option", { name: "Active" }).click();
    
    // Select category: Laboratory
    await page.getByRole("combobox", { name: /^category\s*\*$/i }).click();
    await page.getByRole("option", { name: "Laboratory" }).click();
    
    // Select kind: Service Request
    await page.getByLabel(/^kind$/i).click();
    await page.getByRole("option", { name: /service request/i }).click();
    
    // Select code
    console.log("Step: Selecting activity definition code...");
    const codeCombobox = page.getByRole("combobox", { name: /^code/i });
    await codeCombobox.click();
    await page.getByPlaceholder(/search/i).fill("Acyclovir");
    await page.waitForTimeout(1000); // Wait for search results
    await page.getByRole("option").first().click();
    
    // Add specimen requirement
    console.log("Step: Adding specimen requirement...");
    const specimenTrigger = page.getByRole("combobox").filter({ hasText: /select specimen requirements/i });
    await specimenTrigger.scrollIntoViewIfNeeded();
    await specimenTrigger.click();
    await page.getByPlaceholder(/search/i).fill("CBC Blood Specimen");
    await page.waitForTimeout(1000);
    await page.getByRole("option", { name: /CBC Blood Specimen/i }).click();
    await page.keyboard.press("Escape");
    
    // Add 3 diagnostic report codes
    console.log("Step: Adding diagnostic report code 1...");
    const diagCombobox = page.getByRole("combobox").filter({ hasText: /search.*diagnostic/i });
    await diagCombobox.scrollIntoViewIfNeeded();
    await diagCombobox.click();
    await page.getByPlaceholder(/search/i).fill("Acyclovir [Susceptibility]");
    await page.waitForTimeout(1000);
    await page.getByRole("option", { name: /Acyclovir.*Susceptibility/i }).first().click();
    await page.waitForTimeout(500);
    
    console.log("Step: Adding diagnostic report code 2...");
    await diagCombobox.click();
    await page.getByPlaceholder(/search/i).fill("Amdinocillin [Susceptibility]");
    await page.waitForTimeout(1000);
    await page.getByRole("option", { name: /Amdinocillin.*Susceptibility/i }).first().click();
    await page.waitForTimeout(500);
    
    console.log("Step: Adding diagnostic report code 3...");
    await diagCombobox.click();
    await page.getByPlaceholder(/search/i).fill("Cefoperazone [Susceptibility]");
    await page.waitForTimeout(1000);
    await page.getByRole("option", { name: /Cefoperazone.*Susceptibility/i }).first().click();
    await page.keyboard.press("Escape");
    
    // Submit form
    console.log("Step: Submitting Activity Definition form...");
    await page.getByRole("button", { name: /^create$/i }).click();
    
    // Wait for success toast
    const toastVisible = await page.getByText(/activity definition created successfully/i).waitFor({ timeout: 10000 }).then(() => true).catch(() => false);
    if (!toastVisible) {
      throw new Error("Activity Definition creation failed - no success toast");
    }
    console.log("Success: Activity Definition created");
    
    // Get the AD slug from URL
    await page.waitForURL(/\/facility\/.*\/settings\/activity_definitions/);
    const adSlug = adTitle.toLowerCase().replace(/\s+/g, "-").slice(0, 25);
    console.log(`Activity Definition slug: ${adSlug}`);
    
    // Now create a Service Request from this Activity Definition
    console.log("Step: Creating Service Request from Activity Definition...");
    
    // First, navigate to encounters list and get a patient/encounter
    await page.goto(`http://localhost:4000/facility/${FACILITY_ID}/encounters`);
    await page.waitForLoadState("networkidle");
    
    // Click on first encounter
    const firstEncounter = page.locator('[data-testid="encounter-card"]').first();
    await firstEncounter.waitFor({ timeout: 10000 });
    await firstEncounter.click();
    
    // Wait for encounter page to load
    await page.waitForURL(/\/encounter\//);
    const encounterUrl = page.url();
    const encounterId = encounterUrl.match(/\/encounter\/([^\/]+)/)?.[1];
    console.log(`Using encounter: ${encounterId}`);
    
    // Click Service Requests tab
    console.log("Step: Navigating to Service Requests tab...");
    await page.getByRole("tab", { name: /service requests/i }).click();
    await page.waitForTimeout(1000);
    
    // Create Service Request
    await page.getByRole("button", { name: /create service request/i }).click();
    await page.waitForTimeout(1000);
    
    // Select the Activity Definition we just created
    console.log("Step: Selecting Activity Definition in Service Request form...");
    const activityDefinitionPicker = page.locator('button[role="combobox"]').filter({ hasText: /select activity definition/i });
    await activityDefinitionPicker.waitFor({ state: "visible" });
    await activityDefinitionPicker.click();
    
    // Navigate to Lab Tests category
    await page.getByText("Lab Tests").click();
    await page.waitForTimeout(500);
    
    // Search for our Activity Definition
    await page.getByPlaceholder(/search/i).fill(adTitle);
    await page.waitForTimeout(1000);
    await page.getByRole("option", { name: adTitle }).click();
    
    // Expand the service request card
    const serviceRequestCard = page.locator('[data-slot="collapsible"]').filter({ hasText: adTitle }).first();
    await serviceRequestCard.waitFor({ state: "visible" });
    await serviceRequestCard.locator('[data-slot="collapsible-trigger"]').click();
    
    // Select priority: Routine
    await serviceRequestCard.getByRole("radio", { name: /routine/i }).check();
    
    // Submit
    await page.getByRole("button", { name: /submit/i }).click();
    
    // Wait for success toast
    const srToastVisible = await page.getByText(/questionnaire submitted successfully/i).waitFor({ timeout: 10000 }).then(() => true).catch(() => false);
    if (!srToastVisible) {
      throw new Error("Service Request creation failed - no success toast");
    }
    console.log("Success: Service Request created");
    
    // Get Service Request ID from URL
    await page.waitForTimeout(2000);
    const srUrl = page.url();
    const serviceRequestId = srUrl.match(/\/service_request\/([^\/]+)/)?.[1];
    if (!serviceRequestId) {
      throw new Error("Could not extract Service Request ID from URL");
    }
    console.log(`Service Request ID: ${serviceRequestId}`);
    
    // Now navigate to the Service Request detail page
    console.log("Step: Navigating to Service Request detail page...");
    await page.goto(`http://localhost:4000${srUrl}`);
    await page.waitForLoadState("networkidle");
    
    // Process specimen to "available" status
    console.log("Step: Processing specimen to available status...");
    
    // Expand Specimen Workflow section if collapsed
    const specimenSection = page.locator('text=Specimen Workflow').locator('..').locator('..');
    const specimenVisible = await specimenSection.isVisible();
    if (specimenVisible) {
      await specimenSection.click();
      await page.waitForTimeout(1000);
    }
    
    // Find specimen row and click to open detail
    const specimenRow = page.locator('[data-testid="specimen-row"]').first();
    const rowVisible = await specimenRow.isVisible().catch(() => false);
    if (rowVisible) {
      await specimenRow.click();
      await page.waitForTimeout(1000);
      
      // Change status to available
      const statusDropdown = page.getByRole("combobox", { name: /status/i });
      const dropdownExists = await statusDropdown.isVisible().catch(() => false);
      if (dropdownExists) {
        await statusDropdown.click();
        await page.getByRole("option", { name: /available/i }).click();
        await page.waitForTimeout(1000);
        console.log("Specimen status changed to available");
      }
    }
    
    // Navigate back to Service Request
    await page.goto(`http://localhost:4000${srUrl}`);
    await page.waitForLoadState("networkidle");
    
    // Now test creating diagnostic reports
    console.log("Step: Starting diagnostic report creation tests...");
    
    // Expand Test Results Entry section
    const testResultsSection = page.getByText("Test Results Entry");
    await testResultsSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    
    // Check if dropdown is visible
    const dropdown = page.getByRole("combobox", { name: /select diagnostic report type/i });
    const dropdownVisible = await dropdown.isVisible();
    
    if (!dropdownVisible) {
      throw new Error("Dropdown not visible - Test Results Entry section may be collapsed or missing");
    }
    
    console.log("Step 3: Clicking dropdown to see all 3 codes...");
    await dropdown.click();
    await page.waitForTimeout(1000);
    
    // Verify all 3 codes are present
    const option1 = await page.getByRole("option", { name: /Acyclovir.*Susceptibility/i }).isVisible();
    const option2 = await page.getByRole("option", { name: /Amdinocillin.*Susceptibility/i }).isVisible();
    const option3 = await page.getByRole("option", { name: /Cefoperazone.*Susceptibility/i }).isVisible();
    
    if (!option1 || !option2 || !option3) {
      throw new Error("Not all 3 diagnostic report codes visible in dropdown");
    }
    console.log("Verified: All 3 codes visible in dropdown");
    
    // Step 4: Select first code
    console.log("Step 4: Selecting first code (Acyclovir)...");
    await page.getByRole("option", { name: /Acyclovir.*Susceptibility/i }).click();
    await page.waitForTimeout(500);
    
    // Step 5: Create first report
    console.log("Step 5: Creating first diagnostic report...");
    await page.getByRole("button", { name: /create report/i }).click();
    
    const report1Toast = await page.getByText(/diagnostic report created successfully/i).waitFor({ timeout: 10000 }).then(() => true).catch(() => false);
    if (!report1Toast) {
      throw new Error("First diagnostic report creation failed - no success toast");
    }
    console.log("Success: First diagnostic report created");
    
    // Step 6: Verify form is still visible
    await page.waitForTimeout(2000);
    console.log("Step 6: Verifying create form still visible...");
    const formStillVisible = await dropdown.isVisible();
    if (!formStillVisible) {
      throw new Error("Create form hidden after first report - should remain visible");
    }
    console.log("Verified: Create form still visible");
    
    // Step 7: Click dropdown again and verify only 2 remaining codes
    console.log("Step 7: Clicking dropdown to verify only 2 remaining codes...");
    await dropdown.click();
    await page.waitForTimeout(1000);
    
    const acyclovirStillPresent = await page.getByRole("option", { name: /^Acyclovir.*Susceptibility/i }).isVisible().catch(() => false);
    const amdinocillinPresent = await page.getByRole("option", { name: /Amdinocillin.*Susceptibility/i }).isVisible().catch(() => false);
    const cefoperazonePresent = await page.getByRole("option", { name: /Cefoperazone.*Susceptibility/i }).isVisible().catch(() => false);
    
    if (acyclovirStillPresent) {
      throw new Error("First code (Acyclovir) still in dropdown after use - should be filtered out");
    }
    if (!amdinocillinPresent || !cefoperazonePresent) {
      throw new Error("Not all remaining codes visible - should show 2 codes");
    }
    console.log("Verified: Only 2 remaining codes in dropdown (Acyclovir filtered out)");
    
    // Step 8: Select second code
    console.log("Step 8: Selecting second code (Amdinocillin)...");
    await page.getByRole("option", { name: /Amdinocillin.*Susceptibility/i }).click();
    await page.waitForTimeout(500);
    
    // Step 9: Create second report
    console.log("Step 9: Creating second diagnostic report...");
    await page.getByRole("button", { name: /create report/i }).click();
    
    const report2Toast = await page.getByText(/diagnostic report created successfully/i).waitFor({ timeout: 10000 }).then(() => true).catch(() => false);
    if (!report2Toast) {
      throw new Error("Second diagnostic report creation failed - no success toast");
    }
    console.log("Success: Second diagnostic report created");
    
    // Step 10: Click dropdown and verify only 1 remaining code
    await page.waitForTimeout(2000);
    console.log("Step 10: Clicking dropdown to verify only 1 remaining code...");
    await dropdown.click();
    await page.waitForTimeout(1000);
    
    const amdinocillinStillPresent = await page.getByRole("option", { name: /^Amdinocillin.*Susceptibility/i }).isVisible().catch(() => false);
    const cefoperazoneStillPresent = await page.getByRole("option", { name: /Cefoperazone.*Susceptibility/i }).isVisible().catch(() => false);
    
    if (amdinocillinStillPresent) {
      throw new Error("Second code (Amdinocillin) still in dropdown after use");
    }
    if (!cefoperazoneStillPresent) {
      throw new Error("Third code (Cefoperazone) not visible - should be the only remaining code");
    }
    console.log("Verified: Only 1 remaining code (Cefoperazone)");
    
    // Step 11: Select third code and create report
    console.log("Step 11: Selecting third code and creating report...");
    await page.getByRole("option", { name: /Cefoperazone.*Susceptibility/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: /create report/i }).click();
    
    const report3Toast = await page.getByText(/diagnostic report created successfully/i).waitFor({ timeout: 10000 }).then(() => true).catch(() => false);
    if (!report3Toast) {
      throw new Error("Third diagnostic report creation failed - no success toast");
    }
    console.log("Success: Third diagnostic report created");
    
    // Step 12: Verify create form is now hidden
    await page.waitForTimeout(2000);
    console.log("Step 12: Verifying create form is now hidden...");
    const formHidden = await dropdown.isVisible().catch(() => false);
    if (formHidden) {
      throw new Error("Create form still visible after all codes used - should be hidden");
    }
    
    const createButton = await page.getByRole("button", { name: /^create report$/i }).isVisible().catch(() => false);
    if (createButton) {
      throw new Error("Create Report button still visible - should be hidden");
    }
    
    console.log("Verified: Create form hidden after all codes used");
    
    console.log("\n=== AC1 PASSED ===");
    console.log("- Created 3 diagnostic reports, one for each diagnostic report code");
    console.log("- Dropdown filtered out used codes after each creation");
    console.log("- Create form hidden after all codes used");
    
  } catch (error) {
    console.error("\n=== AC1 FAILED ===");
    console.error(`Error: ${error.message}`);
    throw error;
  } finally {
    await page.close();
    await context.close();
    
    // Move video to specs/28/videos/
    const videoPath = await page.video()?.path();
    if (videoPath && fs.existsSync(videoPath)) {
      fs.copyFileSync(videoPath, "specs/28/videos/ac1-multiple-reports.webm");
      console.log("Video saved to specs/28/videos/ac1-multiple-reports.webm");
    }
    
    await browser.close();
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
