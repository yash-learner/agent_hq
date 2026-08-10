#!/usr/bin/env node
/**
 * Simplified QA Driver for AC1: All codes visible in dropdown for new SR
 * Uses UI for seed, focuses on live verification
 */

import { chromium } from "playwright";
import { writeFileSync } from "fs";

const size = { width: 1440, height: 900 };
const facilityId = "4ced37df-f171-4ead-99ff-290ffe7a302b";
const patientId = "151fe99a-bf7f-45f9-8b4f-3cee719e220e";
const encounterId = "9b1df998-a61c-4c19-a1ce-46deee3ddfff";

let serviceRequestId = null;
let healthcareService = "pathology-lab"; // Default from fixtures

async function main() {
  console.log("=== AC1: All codes visible in dropdown for new SR ===\n");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    baseURL: "http://localhost:4000",
    storageState: "tests/.auth/user.json",
    viewport: size,
    recordVideo: {
      dir: ".agent-hq/pw-videos",
      size,
    },
  });

  const page = await context.newPage();
  await page.screencast.showActions({ cursor: "pointer" });

  try {
    // Check auth shell
    console.log("[AUTH] Verifying authenticated shell");
    await page.goto(`/facility/${facilityId}/overview`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    
    // Wait for facility nav or sidebar
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    const overviewLink = page.getByRole("link", { name: /overview/i });
    
    if (await sidebar.isVisible({ timeout: 5000 }).catch(() => false) ||
        await overviewLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log("  ✓ Authenticated shell verified\n");
    } else {
      throw new Error("Auth shell not verified - no facility nav found");
    }

    // Simple UI seed approach - create minimal AD and SR
    console.log("[SEED] Creating Activity Definition via UI");
    const adTitle = `qa-ad-27-${Date.now()}`;
    
    await page.goto(
      `/facility/${facilityId}/settings/activity_definitions/categories/f-${facilityId}-lab-tests-activity-definition/new`
    );
    await page.waitForLoadState("networkidle");
    
    // Fill minimal required fields
    await page.getByLabel(/title.*\*/i).fill(adTitle);
    await page.getByLabel(/description.*\*/i).fill("Test AD");
    await page.getByLabel(/usage.*\*/i).fill("Test");
    
    // Status
    await page.getByLabel(/^status$/i).click();
    await page.getByRole("option", { name: "Active" }).click();
    
    // Category (classification)
    await page.getByRole("combobox", { name: /^category\s*\*$/i }).click();
    await page.getByRole("option", { name: "Laboratory" }).click();
    
    // Kind
    await page.getByLabel(/^kind$/i).click();
    await page.getByRole("option", { name: /service request/i }).click();
    
    // Code
    const codeCombobox = page.getByRole("combobox", { name: /^code/i });
    await codeCombobox.click();
    await page.keyboard.type("Fluoroscopic venography");
    await page.waitForTimeout(1500);
    await page.getByRole("option").first().click();
    console.log("  Filled basic AD fields");
    
    // Add 3 diagnostic report codes
    console.log("  Adding 3 diagnostic report codes...");
    const codes = [
      "Acyclovir",
      "Amdinocillin", 
      "Cefoperazone",
    ];
    
    for (let i = 0; i < 3; i++) {
      const diagCombobox = page
        .getByRole("combobox")
        .filter({ hasText: /search.*diagnostic/i });
      await diagCombobox.scrollIntoViewIfNeeded();
      await diagCombobox.click();
      await page.keyboard.type(codes[i]);
      await page.waitForTimeout(1500);
      const firstOption = page.getByRole("option").first();
      if (await firstOption.isVisible({ timeout: 3000 })) {
        await firstOption.click();
        console.log(`    ✓ Added code ${i + 1}/3`);
      }
      await page.waitForTimeout(500);
    }
    
    // Submit
    await page.getByRole("button", { name: /^create$/i }).click();
    await page.waitForSelector('text=/activity definition created/i', { timeout: 10000 });
    console.log("  ✓ Activity Definition created\n");
    
    // Create Service Request
    console.log("[SEED] Creating Service Request via UI");
    await page.goto(`/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/service_requests`);
    await page.waitForLoadState("networkidle");
    
    await page.getByRole("button", { name: /create service request/i }).click();
    await page.waitForTimeout(1000);
    
    const adPicker = page.locator('button[role="combobox"]').filter({ hasText: /select activity definition/i });
    await adPicker.click();
    await page.getByRole("button", { name: /lab tests/i }).click();
    await page.keyboard.type(adTitle.substring(0, 15));
    await page.waitForTimeout(1500);
    await page.getByRole("option").first().click();
    console.log(`  Selected AD: ${adTitle}`);
    
    const srCard = page.locator('[data-slot="collapsible"]').filter({ hasText: adTitle }).first();
    await srCard.locator('[data-slot="collapsible-trigger"]').click();
    await srCard.getByRole("radio", { name: /routine/i }).check();
    
    await page.getByRole("button", { name: /submit/i }).click();
    await page.waitForSelector('text=/questionnaire submitted/i', { timeout: 10000 });
    console.log("  ✓ Service Request created\n");
    
    // Extract SR ID from URL or page
    await page.waitForTimeout(2000);
    const url = page.url();
    const urlMatch = url.match(/service_request[s]?\/([a-f0-9-]+)/);
    if (urlMatch) {
      serviceRequestId = urlMatch[1];
    } else {
      // Try to find it in the SR list
      const srLink = page.locator('a[href*="/service_request/"]').first();
      if (await srLink.isVisible({ timeout: 3000 })) {
        const href = await srLink.getAttribute('href');
        const match = href.match(/service_request\/([a-f0-9-]+)/);
        if (match) serviceRequestId = match[1];
      }
    }
    
    if (!serviceRequestId) {
      // Fallback: look for any SR card and try to open it
      const cards = page.locator('[data-slot="collapsible"]').filter({ hasText: adTitle });
      const count = await cards.count();
      if (count > 0) {
        await cards.first().locator('a').first().click();
        await page.waitForLoadState("networkidle");
        const currentUrl = page.url();
        const match = currentUrl.match(/service_request\/([a-f0-9-]+)/);
        if (match) serviceRequestId = match[1];
      }
    }
    
    console.log(`  Service Request ID: ${serviceRequestId || "unknown"}\n`);
    
    // LIVE TEST: Navigate to SR details and verify dropdown
    console.log("[LIVE] AC1: Verifying all 3 codes visible in dropdown");
    
    if (serviceRequestId) {
      await page.goto(`/facility/${facilityId}/service/${healthcareService}/service_request/${serviceRequestId}`);
    }
    
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    
    // Find Test Results Entry section
    const testResultsHeading = page.locator('text=/test results entry/i').first();
    if (await testResultsHeading.isVisible({ timeout: 5000 })) {
      await testResultsHeading.scrollIntoViewIfNeeded();
      console.log("  ✓ Found 'Test Results Entry' section");
    }
    
    // Look for diagnostic report dropdown
    const dropdown = page.getByRole("combobox").filter({ hasText: /select diagnostic report type/i });
    
    if (await dropdown.isVisible({ timeout: 5000 })) {
      console.log("  ✓ Diagnostic report code dropdown visible");
      
      // Click to open
      await dropdown.click();
      await page.waitForTimeout(1500);
      console.log("  ✓ Dropdown opened");
      
      // Count options
      const options = page.getByRole("option");
      const count = await options.count();
      console.log(`  Found ${count} options in dropdown`);
      
      // Verify all 3 expected codes are present
      const expectedFragments = ["Acyclovir", "Amdinocillin", "Cefoperazone"];
      let foundCount = 0;
      
      for (const fragment of expectedFragments) {
        const option = options.filter({ hasText: new RegExp(fragment, "i") });
        if (await option.count() > 0) {
          foundCount++;
          console.log(`  ✓ Found code containing: ${fragment}`);
        } else {
          console.log(`  ✗ Missing code containing: ${fragment}`);
        }
      }
      
      // Verify Create Report button state
      const createButton = page.getByRole("button", { name: /create report/i });
      const isDisabled = await createButton.isDisabled().catch(() => true);
      console.log(`  Create Report button disabled (initial): ${isDisabled ? "✓" : "✗"}`);
      
      if (foundCount === 3) {
        console.log("\n✓ AC1 PASSED: All 3 diagnostic report codes visible in dropdown");
      } else {
        throw new Error(`Only found ${foundCount}/3 expected codes`);
      }
      
    } else {
      console.log("  ✗ Diagnostic report dropdown not found");
      throw new Error("Dropdown not visible");
    }
    
  } catch (error) {
    console.error("\n✗ AC1 FAILED:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }

  // Move video to correct location
  try {
    const { readdirSync, renameSync } = await import("fs");
    const { join } = await import("path");
    const videoDir = ".agent-hq/pw-videos";
    const files = readdirSync(videoDir);
    const video = files.find(f => f.endsWith(".webm"));
    if (video) {
      renameSync(
        join(videoDir, video),
        "specs/27/videos/ac1-all-codes-visible.webm"
      );
      console.log("\n✓ Video saved to specs/27/videos/ac1-all-codes-visible.webm");
    }
  } catch (e) {
    console.log(`Note: Could not move video: ${e.message}`);
  }

  console.log("\n=== AC1 Complete ===");
}

main();
