#!/usr/bin/env node
/**
 * AC1: Create up to N diagnostic reports for N diagnostic report codes
 * 
 * Uses API seed to create prerequisites (Activity Definition with 3 codes, Service Request),
 * then tests the diagnostic report creation UI flow with video evidence.
 */

import { chromium } from "@playwright/test";
import * as fs from "fs";

const FACILITY_ID = "386772e0-eb8b-4a16-8c42-12a2f0836afa";
const size = { width: 1440, height: 900 };

// Get auth token
function getAuthHeaders() {
  const authFile = "tests/.auth/user.json";
  const storageState = JSON.parse(fs.readFileSync(authFile, "utf-8"));
  const localStorage = storageState.origins?.[0]?.localStorage ?? [];
  const tokenEntry = localStorage.find(item => item.name === "care_access_token");
  return {
    Authorization: `Bearer ${tokenEntry.value}`,
    "Content-Type": "application/json",
  };
}

async function apiCall(path, method = "GET", body = null) {
  const url = `http://localhost:9000${path}`;
  const options = {
    method,
    headers: getAuthHeaders(),
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const response = await fetch(url, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API ${method} ${path} failed: ${response.status} ${text.substring(0, 200)}`);
  }
  return response.json();
}

async function main() {
  console.log("=== AC1: Create up to N diagnostic reports ===");
  console.log("\n--- DATA SETUP VIA API (seed escape hatch for deep graph) ---");
  
  // Get an existing encounter and patient
  console.log("Step: Finding existing encounter...");
  const encounters = await apiCall(`/api/v1/encounter/?facility=${FACILITY_ID}&limit=1`);
  if (encounters.count === 0) {
    throw new Error("No encounters found in fixtures");
  }
  const encounterId = encounters.results[0].id;
  const patientId = encounters.results[0].patient.id;
  console.log(`Using encounter: ${encounterId}, patient: ${patientId}`);
  
  // Find existing Activity Definition with 3 diagnostic report codes (from previous run)
  console.log("\nStep: Finding existing Activity Definition with 3 diagnostic report codes...");
  const ads = await apiCall(`/api/v1/facility/${FACILITY_ID}/activity_definition/`);
  const multiCodeAD = ads.results.find(ad => 
    ad.diagnostic_report_codes && ad.diagnostic_report_codes.length === 3
  );
  
  if (!multiCodeAD) {
    throw new Error("No Activity Definition with 3 diagnostic report codes found. Expected from fixtures/previous run.");
  }
  
  console.log(`Using existing Activity Definition: ${multiCodeAD.title} (${multiCodeAD.id})`);
  console.log(`Diagnostic report codes: ${multiCodeAD.diagnostic_report_codes.map(c => c.display).join(", ")}`);
  
  // Create Service Request from this Activity Definition
  console.log("\nStep: Creating Service Request via API...");
  const srData = {
    activity_definition: multiCodeAD.id,
    priority: "routine",
    status: "active"
  };
  
  const serviceRequest = await apiCall(
    `/api/v1/encounter/${encounterId}/service_request/`,
    "POST",
    srData
  );
  console.log(`Service Request created: ${serviceRequest.id}`);
  
  console.log("\n--- UI VERIFICATION WITH VIDEO ---");
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: "tests/.auth/user.json",
    viewport: size,
    recordVideo: { dir: ".agent-hq/pw-videos", size },
  });
  
  const page = await context.newPage();
  await page.screencast.showActions({ cursor: "pointer" });
  
  try {
    // Navigate to Service Request detail page
    console.log("\nStep 1: Navigating to Service Request detail page...");
    await page.goto(`http://localhost:4000/facility/${FACILITY_ID}/patient/${patientId}/encounter/${encounterId}/service_request/${serviceRequest.id}`);
    await page.waitForLoadState("networkidle");
    
    // Auth shell verification
    await page.locator(".animate-spin").waitFor({ state: "hidden", timeout: 10000 }).catch(() => {});
    const sidebarVisible = await page.locator('[data-sidebar="sidebar"]').isVisible().catch(() => false);
    if (!sidebarVisible) {
      throw new Error("Auth shell not verified - sidebar not visible");
    }
    console.log("Auth shell: verified");
    
    // Find Test Results Entry section
    console.log("\nStep 2: Locating Test Results Entry section...");
    await page.waitForTimeout(2000); // Let page fully load
    
    // Look for the dropdown and create button
    const dropdown = page.getByRole("combobox", { name: /select diagnostic report type/i });
    const createButton = page.getByRole("button", { name: /create report/i });
    
    const dropdownVisible = await dropdown.isVisible().catch(() => false);
    const buttonVisible = await createButton.isVisible().catch(() => false);
    
    if (!dropdownVisible || !buttonVisible) {
      throw new Error(`Diagnostic report form not visible. Dropdown: ${dropdownVisible}, Button: ${buttonVisible}`);
    }
    console.log("Test Results Entry form visible");
    
    // Step 3: Click dropdown to see all 3 codes
    console.log("\nStep 3: Opening dropdown to verify all 3 codes...");
    await dropdown.scrollIntoViewIfNeeded();
    await dropdown.click();
    await page.waitForTimeout(1000);
    
    const code1 = await page.getByRole("option", { name: /Acyclovir.*Susceptibility/i }).isVisible().catch(() => false);
    const code2 = await page.getByRole("option", { name: /Amdinocillin.*Susceptibility/i }).isVisible().catch(() => false);
    const code3 = await page.getByRole("option", { name: /Cefoperazone.*Susceptibility/i }).isVisible().catch(() => false);
    
    if (!code1 || !code2 || !code3) {
      throw new Error(`Not all 3 codes visible. Acyclovir: ${code1}, Amdinocillin: ${code2}, Cefoperazone: ${code3}`);
    }
    console.log("✓ All 3 diagnostic report codes visible in dropdown");
    
    // Step 4: Select first code
    console.log("\nStep 4: Selecting first code (Acyclovir)...");
    await page.getByRole("option", { name: /Acyclovir.*Susceptibility/i }).first().click();
    await page.waitForTimeout(500);
    
    // Step 5: Create first report
    console.log("\nStep 5: Creating first diagnostic report...");
    await createButton.click();
    
    const toast1 = await page.getByText(/diagnostic report created successfully/i).waitFor({ timeout: 10000 }).then(() => true).catch(() => false);
    if (!toast1) {
      throw new Error("First diagnostic report creation failed - no success toast");
    }
    console.log("✓ First diagnostic report created successfully");
    
    // Step 6: Verify form still visible
    await page.waitForTimeout(2000);
    console.log("\nStep 6: Verifying create form still visible...");
    const formStillVisible = await dropdown.isVisible().catch(() => false);
    if (!formStillVisible) {
      throw new Error("Create form hidden after first report - should remain visible");
    }
    console.log("✓ Create form still visible after first report");
    
    // Step 7: Click dropdown again and verify only 2 remaining codes
    console.log("\nStep 7: Verifying only 2 remaining codes in dropdown...");
    await dropdown.click();
    await page.waitForTimeout(1000);
    
    const acyclovirStillVisible = await page.getByRole("option", { name: /^Acyclovir.*Susceptibility/i }).isVisible().catch(() => false);
    const amdinocillinVisible = await page.getByRole("option", { name: /Amdinocillin.*Susceptibility/i }).isVisible().catch(() => false);
    const cefoperazoneVisible = await page.getByRole("option", { name: /Cefoperazone.*Susceptibility/i }).isVisible().catch(() => false);
    
    if (acyclovirStillVisible) {
      throw new Error("First code (Acyclovir) still visible - should be filtered out");
    }
    if (!amdinocillinVisible || !cefoperazoneVisible) {
      throw new Error(`Not all remaining codes visible. Amdinocillin: ${amdinocillinVisible}, Cefoperazone: ${cefoperazoneVisible}`);
    }
    console.log("✓ Only 2 remaining codes visible (Acyclovir filtered out)");
    
    // Step 8: Select second code
    console.log("\nStep 8: Selecting second code (Amdinocillin)...");
    await page.getByRole("option", { name: /Amdinocillin.*Susceptibility/i }).first().click();
    await page.waitForTimeout(500);
    
    // Step 9: Create second report
    console.log("\nStep 9: Creating second diagnostic report...");
    await createButton.click();
    
    const toast2 = await page.getByText(/diagnostic report created successfully/i).waitFor({ timeout: 10000 }).then(() => true).catch(() => false);
    if (!toast2) {
      throw new Error("Second diagnostic report creation failed - no success toast");
    }
    console.log("✓ Second diagnostic report created successfully");
    
    // Step 10: Click dropdown and verify only 1 remaining code
    await page.waitForTimeout(2000);
    console.log("\nStep 10: Verifying only 1 remaining code...");
    await dropdown.click();
    await page.waitForTimeout(1000);
    
    const amdinocillinStillVisible = await page.getByRole("option", { name: /^Amdinocillin.*Susceptibility/i }).isVisible().catch(() => false);
    const cefoperazoneStillVisible = await page.getByRole("option", { name: /Cefoperazone.*Susceptibility/i }).isVisible().catch(() => false);
    
    if (amdinocillinStillVisible) {
      throw new Error("Second code (Amdinocillin) still visible - should be filtered out");
    }
    if (!cefoperazoneStillVisible) {
      throw new Error("Third code (Cefoperazone) not visible - should be the only remaining code");
    }
    console.log("✓ Only 1 remaining code (Cefoperazone)");
    
    // Step 11: Select third code and create report
    console.log("\nStep 11: Selecting third code and creating final report...");
    await page.getByRole("option", { name: /Cefoperazone.*Susceptibility/i }).first().click();
    await page.waitForTimeout(500);
    await createButton.click();
    
    const toast3 = await page.getByText(/diagnostic report created successfully/i).waitFor({ timeout: 10000 }).then(() => true).catch(() => false);
    if (!toast3) {
      throw new Error("Third diagnostic report creation failed - no success toast");
    }
    console.log("✓ Third diagnostic report created successfully");
    
    // Step 12: Verify create form is now hidden
    await page.waitForTimeout(2000);
    console.log("\nStep 12: Verifying create form is now hidden...");
    const formHidden = await dropdown.isVisible().catch(() => false);
    const buttonHidden = await createButton.isVisible().catch(() => false);
    
    if (formHidden || buttonHidden) {
      throw new Error(`Create form still visible after all codes used. Dropdown: ${formHidden}, Button: ${buttonHidden}`);
    }
    console.log("✓ Create form hidden after all codes used");
    
    console.log("\n=== AC1 PASSED ===");
    console.log("Summary:");
    console.log("- Created 3 diagnostic reports, one for each diagnostic report code");
    console.log("- Dropdown correctly filtered out used codes after each creation");
    console.log("- Create form hidden after all codes exhausted");
    
  } catch (error) {
    console.error("\n=== AC1 FAILED ===");
    console.error(`Error: ${error.message}`);
    throw error;
  } finally {
    await page.close();
    
    // Move video to specs/28/videos/
    const video = await page.video();
    if (video) {
      const videoPath = await video.path();
      if (fs.existsSync(videoPath)) {
        fs.copyFileSync(videoPath, "specs/28/videos/ac1-multi-reports.webm");
        console.log("\nVideo saved to specs/28/videos/ac1-multi-reports.webm");
      }
    }
    
    await context.close();
    await browser.close();
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
