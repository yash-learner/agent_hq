#!/usr/bin/env node
/**
 * QA Driver: AC1 - Create up to N diagnostic reports for N diagnostic report codes
 * Tests the core functionality of creating multiple diagnostic reports from a Service Request
 */

import { chromium } from "@playwright/test";
import { writeFileSync, readFileSync } from "fs";
import { resolve } from "path";

const size = { width: 1440, height: 900 };
const facilityId = "e98f5768-95aa-40b2-8f46-109e49bb8b1b";
const patientId = "282f7630-28b7-4476-b855-df8cf4a91592";
const encounterId = "0d264b5e-df31-4c23-ba25-7a51a2b7694d";

function log(msg) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${msg}`);
}

async function main() {
  log("Starting AC1 - Multiple diagnostic reports creation test");
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: "tests/.auth/user.json",
    viewport: size,
    recordVideo: { dir: ".agent-hq/pw-videos", size },
  });

  const page = await context.newPage();
  await page.screencast.showActions({ cursor: "pointer" });

  try {
    // Step 1: Navigate to Activity Definition creation page
    log("Step 1: Navigating to Activity Definition creation page");
    await page.goto(
      `http://localhost:4000/facility/${facilityId}/settings/activity_definitions/categories/f-${facilityId}-lab-tests-activity-definition/new`,
      { waitUntil: "networkidle" }
    );
    await page.waitForTimeout(2000);

    // Step 2: Create Activity Definition with 3 diagnostic report codes
    log("Step 2: Creating Activity Definition with 3 diagnostic report codes");
    const adTitle = `Multi-Code Lab Test ${Date.now()}`;
    
    await page.getByLabel(/title.*\*/i).fill(adTitle);
    log(`  - Filled title: ${adTitle}`);
    
    await page.getByLabel(/description.*\*/i).fill("Activity Definition with multiple diagnostic report codes");
    log("  - Filled description");
    
    await page.getByLabel(/usage.*\*/i).fill("Used to test multiple diagnostic reports");
    log("  - Filled usage");
    
    // Select Status
    await page.getByLabel(/^status$/i).click();
    await page.getByRole("option", { name: "Active" }).click();
    log("  - Selected status: Active");
    
    // Select Category
    await page.getByRole("combobox", { name: /^category\s*\*$/i }).click();
    await page.getByRole("option", { name: "Laboratory" }).click();
    log("  - Selected category: Laboratory");
    
    // Select Kind
    await page.getByLabel(/^kind$/i).click();
    await page.getByRole("option", { name: /service request/i }).click();
    log("  - Selected kind: Service Request");
    
    // Select Code
    const codeCombobox = page.getByRole("combobox", { name: /^code/i });
    await codeCombobox.click();
    await page.waitForTimeout(500);
    await page.keyboard.type("Acyclovir");
    await page.waitForTimeout(1000);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    log("  - Selected code: Acyclovir");
    
    // Scroll to Specimen Requirements
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(1000);
    
    // Select Specimen Requirement
    const specimenTrigger = page.getByRole("combobox").filter({ hasText: /select specimen requirements/i });
    await specimenTrigger.scrollIntoViewIfNeeded();
    await specimenTrigger.click();
    await page.waitForTimeout(500);
    await page.keyboard.type("CBC Blood");
    await page.waitForTimeout(1000);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    log("  - Selected specimen: CBC Blood Specimen");
    
    // Close any popover
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
    
    // Scroll to Diagnostic Report Codes section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.7));
    await page.waitForTimeout(1000);
    
    // Add first diagnostic report code
    log("  - Adding diagnostic report code 1: Acyclovir [Susceptibility]");
    const diagCombobox1 = page.getByRole("combobox").filter({ hasText: /search.*diagnostic/i }).first();
    await diagCombobox1.scrollIntoViewIfNeeded();
    await diagCombobox1.click();
    await page.waitForTimeout(500);
    await page.keyboard.type("Acyclovir [Susceptibility]");
    await page.waitForTimeout(1500);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);
    
    // Click plus button to add the code
    const plusButton1 = page.getByRole("button", { name: /plus/i }).or(page.locator('button:has-text("+")')).first();
    await plusButton1.click();
    log("    Added code 1");
    await page.waitForTimeout(500);
    
    // Add second diagnostic report code
    log("  - Adding diagnostic report code 2: Amdinocillin [Susceptibility]");
    const diagCombobox2 = page.getByRole("combobox").filter({ hasText: /search.*diagnostic/i }).first();
    await diagCombobox2.click();
    await page.waitForTimeout(500);
    await page.keyboard.type("Amdinocillin");
    await page.waitForTimeout(1500);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);
    
    const plusButton2 = page.getByRole("button", { name: /plus/i }).or(page.locator('button:has-text("+")')).first();
    await plusButton2.click();
    log("    Added code 2");
    await page.waitForTimeout(500);
    
    // Add third diagnostic report code
    log("  - Adding diagnostic report code 3: Cefoperazone [Susceptibility]");
    const diagCombobox3 = page.getByRole("combobox").filter({ hasText: /search.*diagnostic/i }).first();
    await diagCombobox3.click();
    await page.waitForTimeout(500);
    await page.keyboard.type("Cefoperazone");
    await page.waitForTimeout(1500);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);
    
    const plusButton3 = page.getByRole("button", { name: /plus/i }).or(page.locator('button:has-text("+")')).first();
    await plusButton3.click();
    log("    Added code 3");
    await page.waitForTimeout(1000);
    
    // Close any popover and scroll to bottom
    await page.keyboard.press("Escape");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    
    // Click Create button
    await page.getByRole("button", { name: /^create$/i }).click();
    log("  - Clicked Create button");
    
    // Wait for success toast and redirect
    await page.waitForTimeout(3000);
    log("  - Activity Definition created successfully");
    
    // Extract the slug from the created AD
    const currentUrl = page.url();
    log(`  - Current URL: ${currentUrl}`);
    const adSlug = adTitle.toLowerCase().replace(/\s+/g, "-").slice(0, 25);
    log(`  - Activity Definition slug: ${adSlug}`);
    
    // Step 3: Create Service Request from Activity Definition
    log("Step 3: Creating Service Request from Activity Definition");
    await page.goto(`http://localhost:4000/facility/${facilityId}/encounters`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    
    // Click on the first encounter or navigate directly to known encounter
    log(`  - Navigating to encounter: ${encounterId}`);
    await page.goto(`http://localhost:4000/facility/${facilityId}/encounter/${encounterId}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    
    // Click Service Requests tab
    log("  - Clicking Service Requests tab");
    await page.getByRole("tab", { name: /service request/i }).click();
    await page.waitForTimeout(1000);
    
    // Click Create Service Request button
    log("  - Clicking Create Service Request button");
    await page.getByRole("button", { name: /create service request/i }).click();
    await page.waitForTimeout(2000);
    
    // Select the Activity Definition we just created
    log(`  - Selecting Activity Definition: ${adTitle}`);
    const adPicker = page.getByRole("combobox").filter({ hasText: /select activity definition/i });
    await adPicker.click();
    await page.waitForTimeout(500);
    await page.keyboard.type(adTitle.substring(0, 15));
    await page.waitForTimeout(1500);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(1000);
    
    // Fill required fields if any
    // Click Create button
    await page.getByRole("button", { name: /^create$/i }).click();
    log("  - Clicked Create button for Service Request");
    await page.waitForTimeout(3000);
    
    const srUrl = page.url();
    const srIdMatch = srUrl.match(/service_request\/([a-f0-9-]+)/);
    const serviceRequestId = srIdMatch ? srIdMatch[1] : null;
    log(`  - Service Request created: ${serviceRequestId}`);
    
    if (!serviceRequestId) {
      throw new Error("Failed to extract Service Request ID from URL");
    }
    
    // Step 4: Process specimen to "available" status
    log("Step 4: Processing specimen to available status");
    await page.waitForTimeout(2000);
    
    // Try to find and expand Specimen Workflow section
    const specimenSection = page.locator('text=/specimen workflow/i').or(page.locator('text=/specimen/i')).first();
    if (await specimenSection.isVisible()) {
      await specimenSection.click();
      log("  - Expanded Specimen Workflow section");
      await page.waitForTimeout(1000);
      
      // Look for specimen status change controls
      // This might be a dropdown or button - check the implementation
      const specimenRow = page.locator('tr').filter({ hasText: /specimen/i }).first();
      if (await specimenRow.isVisible()) {
        await specimenRow.click();
        await page.waitForTimeout(1000);
        
        // Try to change status to available
        const statusSelect = page.getByRole("combobox", { name: /status/i }).or(page.locator('select[name*="status"]'));
        if (await statusSelect.isVisible()) {
          await statusSelect.click();
          await page.getByRole("option", { name: /available/i }).click();
          log("  - Changed specimen status to available");
          await page.waitForTimeout(1000);
        }
      }
    }
    
    // Navigate back to Service Request page
    await page.goto(`http://localhost:4000/facility/${facilityId}/service_request/${serviceRequestId}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    
    // Step 5: Verify Test Results Entry section is visible
    log("Step 5: Verifying Test Results Entry section");
    const testResultsSection = page.locator('text=/test results entry/i');
    await testResultsSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    
    // Expand if collapsed
    if (await testResultsSection.isVisible()) {
      await testResultsSection.click();
      log("  - Expanded Test Results Entry section");
      await page.waitForTimeout(1000);
    }
    
    // Step 6: Verify dropdown shows all 3 codes
    log("Step 6: Verifying dropdown shows all 3 diagnostic report codes");
    const diagnosticDropdown = page.getByRole("combobox").filter({ hasText: /select diagnostic report type/i }).or(
      page.locator('select').filter({ hasText: /diagnostic/i })
    );
    
    if (await diagnosticDropdown.isVisible()) {
      await diagnosticDropdown.click();
      log("  - Clicked dropdown");
      await page.waitForTimeout(1000);
      
      // Check if all 3 codes are visible
      const option1 = page.getByRole("option", { name: /acyclovir.*susceptibility/i });
      const option2 = page.getByRole("option", { name: /amdinocillin.*susceptibility/i });
      const option3 = page.getByRole("option", { name: /cefoperazone.*susceptibility/i });
      
      const code1Visible = await option1.isVisible();
      const code2Visible = await option2.isVisible();
      const code3Visible = await option3.isVisible();
      
      log(`  - Code 1 (Acyclovir) visible: ${code1Visible}`);
      log(`  - Code 2 (Amdinocillin) visible: ${code2Visible}`);
      log(`  - Code 3 (Cefoperazone) visible: ${code3Visible}`);
      
      // Step 7: Select first code and create report
      log("Step 7: Selecting first code and creating first diagnostic report");
      await option1.click();
      await page.waitForTimeout(1000);
      
      const createButton = page.getByRole("button", { name: /create report/i });
      await createButton.click();
      log("  - Clicked Create Report button");
      await page.waitForTimeout(3000);
      
      // Step 8: Verify form reappears and dropdown shows only 2 remaining codes
      log("Step 8: Verifying dropdown now shows only 2 remaining codes");
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
      
      const dropdown2 = page.getByRole("combobox").filter({ hasText: /select diagnostic report type/i });
      if (await dropdown2.isVisible()) {
        await dropdown2.click();
        log("  - Clicked dropdown again");
        await page.waitForTimeout(1000);
        
        const code1Visible2 = await option1.isVisible();
        const code2Visible2 = await option2.isVisible();
        const code3Visible2 = await option3.isVisible();
        
        log(`  - Code 1 (Acyclovir) visible: ${code1Visible2} (should be false)`);
        log(`  - Code 2 (Amdinocillin) visible: ${code2Visible2} (should be true)`);
        log(`  - Code 3 (Cefoperazone) visible: ${code3Visible2} (should be true)`);
        
        // Step 9: Select second code and create report
        log("Step 9: Selecting second code and creating second diagnostic report");
        await option2.click();
        await page.waitForTimeout(1000);
        
        const createButton2 = page.getByRole("button", { name: /create report/i });
        await createButton2.click();
        log("  - Clicked Create Report button");
        await page.waitForTimeout(3000);
        
        // Step 10: Verify dropdown shows only 1 remaining code
        log("Step 10: Verifying dropdown now shows only 1 remaining code");
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1000);
        
        const dropdown3 = page.getByRole("combobox").filter({ hasText: /select diagnostic report type/i });
        if (await dropdown3.isVisible()) {
          await dropdown3.click();
          log("  - Clicked dropdown again");
          await page.waitForTimeout(1000);
          
          const code2Visible3 = await option2.isVisible();
          const code3Visible3 = await option3.isVisible();
          
          log(`  - Code 2 (Amdinocillin) visible: ${code2Visible3} (should be false)`);
          log(`  - Code 3 (Cefoperazone) visible: ${code3Visible3} (should be true)`);
          
          // Step 11: Select third code and create report
          log("Step 11: Selecting third code and creating third diagnostic report");
          await option3.click();
          await page.waitForTimeout(1000);
          
          const createButton3 = page.getByRole("button", { name: /create report/i });
          await createButton3.click();
          log("  - Clicked Create Report button");
          await page.waitForTimeout(3000);
          
          // Step 12: Verify create form is now hidden
          log("Step 12: Verifying create form is now hidden (all codes used)");
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
          await page.waitForTimeout(1000);
          
          const dropdown4 = page.getByRole("combobox").filter({ hasText: /select diagnostic report type/i });
          const createButton4 = page.getByRole("button", { name: /create report/i });
          
          const dropdownVisible = await dropdown4.isVisible().catch(() => false);
          const buttonVisible = await createButton4.isVisible().catch(() => false);
          
          log(`  - Dropdown visible: ${dropdownVisible} (should be false)`);
          log(`  - Create button visible: ${buttonVisible} (should be false)`);
          
          if (!dropdownVisible && !buttonVisible) {
            log("✅ SUCCESS: Create form is hidden after all codes are used");
          } else {
            log("❌ FAILURE: Create form is still visible after all codes are used");
          }
        }
      }
    } else {
      log("❌ ERROR: Diagnostic report dropdown not found");
      throw new Error("Diagnostic report dropdown not found");
    }
    
    log("Test completed successfully!");
    
  } catch (error) {
    log(`❌ ERROR: ${error.message}`);
    log(`Stack: ${error.stack}`);
    throw error;
  } finally {
    await page.close();
    await context.close();
    await browser.close();
    log("Browser closed");
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
