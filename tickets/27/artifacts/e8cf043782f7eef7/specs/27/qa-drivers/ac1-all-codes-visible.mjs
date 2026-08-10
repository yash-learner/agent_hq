#!/usr/bin/env node
/**
 * QA Driver: AC1 - All codes visible in dropdown for new SR
 * Verifies that all 3 diagnostic report codes from the Activity Definition
 * appear in the dropdown when creating the first report.
 * 
 * SEED STRATEGY: API escape hatch (UI create failed - valueset search timeout)
 */

import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../../..");
const logPath = path.resolve(__dirname, "../qa-logs/ac1-all-codes-visible.log");

const log = (msg) => {
  const timestamp = new Date().toISOString();
  const logMsg = `[${timestamp}] ${msg}\n`;
  console.log(msg);
  fs.appendFileSync(logPath, logMsg);
};

// Clear log file
fs.writeFileSync(logPath, `QA AC1: All codes visible in dropdown\n${"=".repeat(60)}\n`);

const facilityId = "ea0a47dc-0ce5-4040-b544-507b2ffe5819";
const encounterId = "56d8591d-a674-45b7-ab61-adbc13562809";
const apiUrl = "http://localhost:9000";

// Get auth headers from storageState
function getAuthHeaders() {
  const authFile = path.resolve(rootDir, "tests/.auth/user.json");
  const storageState = JSON.parse(fs.readFileSync(authFile, "utf-8"));
  const localStorage = storageState.origins?.[0]?.localStorage ?? [];
  const tokenEntry = localStorage.find(
    (item) => item.name === "care_access_token"
  );
  if (!tokenEntry) throw new Error("No access token in auth storage state");
  return {
    Authorization: `Bearer ${tokenEntry.value}`,
    "Content-Type": "application/json",
  };
}

// Shared viewport/video size (care_fe standard: 1440x900)
const size = { width: 1440, height: 900 };

async function run() {
  const browser = await chromium.launch({ headless: true });
  
  try {
    log("=== SEED ATTEMPT LOG ===");
    log("Method: both (UI attempted first, failed; then API)");
    log("UI Attempt: Valueset search for Activity Definition code timed out");
    log("Falling back to API seed (facility-scoped paths from *Api.ts)");
    log("");

    // Get patient ID from encounter
    log("Fetching encounter to get patient ID");
    const headers = getAuthHeaders();
    const encounterResp = await fetch(
      `${apiUrl}/api/v1/encounter/${encounterId}/`,
      { headers }
    );
    
    if (!encounterResp.ok) {
      const errorText = await encounterResp.text();
      log(`Encounter API Error: ${encounterResp.status} ${encounterResp.statusText}`);
      log(`Response: ${errorText}`);
      throw new Error(`Failed to fetch encounter: ${encounterResp.status}`);
    }
    
    const encounter = await encounterResp.json();
    const patientId = encounter.patient.id;
    log(`Patient ID: ${patientId}`);

    // Create Activity Definition via API
    log("\n--- API SETUP: Creating Activity Definition ---");
    const adTitle = `qa-ad-27-multi-${Date.now()}`;
    const adSlug = adTitle.toLowerCase().replace(/\s+/g, "-").slice(0, 25);
    
    // Get the category ID for Lab Tests
    log("Fetching resource category for Lab Tests");
    const categoryResp = await fetch(
      `${apiUrl}/api/v1/facility/${facilityId}/resource_category/`,
      { headers }
    );
    const categories = await categoryResp.json();
    const labCategory = categories.results.find(c => c.title === "Lab Tests" && c.resource_type === "activity_definition");
    if (!labCategory) {
      throw new Error("Lab Tests category not found");
    }
    log(`Lab Tests category ID: ${labCategory.id}`);

    const adBody = {
      facility: facilityId,
      category: labCategory.id,
      title: adTitle,
      slug_value: adSlug,
      description: "QA test AD for multiple diagnostic report codes",
      usage: "Testing ticket 27 implementation",
      status: "active",
      classification: "laboratory",
      kind: "service_request",
      code: {
        system: "http://snomed.info/sct",
        code: "442341001",
        display: "Fluoroscopic venography of left limb with contrast",
      },
      body_site: null,
      derived_from_uri: null,
      diagnostic_report_codes: [
        {
          system: "http://loinc.org",
          code: "18860-2",
          display: "Acyclovir [Susceptibility]",
        },
        {
          system: "http://loinc.org",
          code: "18865-1",
          display: "Amdinocillin [Susceptibility] by Serum bactericidal titer",
        },
        {
          system: "http://loinc.org",
          code: "18895-8",
          display: "Cefoperazone [Susceptibility] by Minimum inhibitory concentration (MIC)",
        },
      ],
      specimen_requirements: [],
      observation_result_requirements: [],
      charge_item_definitions: [],
      locations: [],
      healthcare_service: null,
    };

    log(`Posting Activity Definition: ${adTitle}`);
    const adResp = await fetch(
      `${apiUrl}/api/v1/facility/${facilityId}/activity_definition/`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(adBody),
      }
    );

    if (!adResp.ok) {
      const errorText = await adResp.text();
      log(`API Error: ${adResp.status} ${adResp.statusText}`);
      log(`Response: ${errorText}`);
      throw new Error(`Failed to create Activity Definition: ${adResp.status}`);
    }

    const activityDef = await adResp.json();
    log(`✓ Activity Definition created: ${activityDef.id}`);
    log(`  Slug: ${activityDef.slug}`);
    log(`  Diagnostic report codes: ${activityDef.diagnostic_report_codes.length}`);

    // Create Service Request via API
    log("\n--- API SETUP: Creating Service Request ---");
    const srBody = {
      encounter: encounterId,
      activity_definition: activityDef.id,
      priority: "routine",
      status: "active",
      intent: "order",
    };

    log("Posting Service Request");
    const srResp = await fetch(
      `${apiUrl}/api/v1/facility/${facilityId}/service_request/`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(srBody),
      }
    );

    if (!srResp.ok) {
      const errorText = await srResp.text();
      log(`API Error: ${srResp.status} ${srResp.statusText}`);
      log(`Response: ${errorText}`);
      throw new Error(`Failed to create Service Request: ${srResp.status}`);
    }

    const serviceRequest = await srResp.json();
    log(`✓ Service Request created: ${serviceRequest.id}`);
    
    // Start browser for UI verification
    log("\n=== UI VERIFICATION ===");
    log("Loading auth state from tests/.auth/user.json");
    const context = await browser.newContext({
      storageState: path.resolve(rootDir, "tests/.auth/user.json"),
      viewport: size,
      recordVideo: {
        dir: path.resolve(rootDir, ".agent-hq/pw-videos"),
        size,
      },
    });

    const page = await context.newPage();
    
    // Enable cursor/click overlay
    log("Enabling cursor overlay for video recording");
    await page.screencast.showActions({ cursor: "pointer" });

    // Auth shell readiness check
    log("Navigating to facility overview to verify auth shell");
    await page.goto(`http://localhost:4000/facility/${facilityId}/overview`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    log("Waiting for loading to complete");
    await page.waitForTimeout(2000);

    log("Verifying facility nav or sidebar is visible");
    const sidebarVisible = await page.locator('[data-sidebar="sidebar"]').isVisible().catch(() => false);
    const overviewVisible = await page.getByRole("link", { name: /overview/i }).isVisible().catch(() => false);
    
    if (!sidebarVisible && !overviewVisible) {
      throw new Error("Auth shell verification failed: sidebar and overview nav not visible");
    }
    log("✓ Auth shell verified: user is authenticated");

    // Navigate to Service Request diagnostic report page
    log("\n--- LIVE FLOW: AC1 Verification ---");
    log(`Navigating to Service Request: ${serviceRequest.id}`);
    await page.goto(
      `http://localhost:4000/facility/${facilityId}/service/pathology-lab/service_request/${serviceRequest.id}`,
      { waitUntil: "networkidle", timeout: 30000 }
    );

    log("Waiting for page to load");
    await page.waitForTimeout(2000);

    log("Looking for Test Results Entry section");
    await page.waitForSelector("text=/test results/i", { timeout: 10000 }).catch(() => {
      log("⚠ Test Results Entry section not immediately visible");
    });

    log("Scrolling to find diagnostic report dropdown");
    const dropdown = page.getByRole("combobox").filter({ hasText: /select diagnostic report type|diagnostic report/i }).first();
    await dropdown.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    
    const dropdownVisible = await dropdown.isVisible().catch(() => false);
    if (!dropdownVisible) {
      log("✗ Dropdown not found - may need specimens collected first");
      throw new Error("Diagnostic report dropdown not visible");
    }

    log("Clicking dropdown to open code list");
    await dropdown.click();
    await page.waitForTimeout(1500);

    log("\nVerifying all 3 codes are present:");
    
    const code1Visible = await page.getByRole("option", { name: /acyclovir.*susceptibility/i }).isVisible().catch(() => false);
    log(`  - Acyclovir [Susceptibility]: ${code1Visible ? "✓ VISIBLE" : "✗ MISSING"}`);
    
    const code2Visible = await page.getByRole("option", { name: /amdinocillin.*serum/i }).isVisible().catch(() => false);
    log(`  - Amdinocillin [Susceptibility] by Serum bactericidal titer: ${code2Visible ? "✓ VISIBLE" : "✗ MISSING"}`);
    
    const code3Visible = await page.getByRole("option", { name: /cefoperazone.*minimum/i }).isVisible().catch(() => false);
    log(`  - Cefoperazone [Susceptibility] by Minimum inhibitory concentration: ${code3Visible ? "✓ VISIBLE" : "✗ MISSING"}`);

    if (code1Visible && code2Visible && code3Visible) {
      log("\n✓ SUCCESS: All 3 codes visible in dropdown");
    } else {
      throw new Error("Not all 3 codes visible in dropdown");
    }

    // Keep dropdown open for video
    await page.waitForTimeout(2000);

    // Save Service Request ID for next tests
    const metaPath = path.resolve(rootDir, ".agent-hq/serviceRequestMeta.json");
    fs.writeFileSync(metaPath, JSON.stringify({ 
      id: serviceRequest.id,
      adId: activityDef.id,
      adSlug: activityDef.slug,
      patientId 
    }, null, 2));
    log(`\nSaved Service Request metadata to ${metaPath}`);

    log("\n--- Closing and saving video ---");
    await context.close();

    // Move video to specs/27/videos/
    const videoDir = path.resolve(rootDir, ".agent-hq/pw-videos");
    const videoFiles = fs.readdirSync(videoDir).filter(f => f.endsWith(".webm"));
    if (videoFiles.length > 0) {
      const videoSrc = path.join(videoDir, videoFiles[videoFiles.length - 1]);
      const videoDest = path.resolve(__dirname, "../videos/ac1-all-codes-visible.webm");
      fs.copyFileSync(videoSrc, videoDest);
      log(`✓ Video saved to ${videoDest}`);
    }

    log("\n=== AC1 COMPLETE ===");
    log("\n=== SEED ATTEMPT SUMMARY ===");
    log("Method: both");
    log("UI Create: Attempted Activity Definition form, failed at valueset search (timeout)");
    log("API Seed: Successfully created Activity Definition + Service Request via facility-scoped API");
    log("Live Verification: Confirmed all 3 diagnostic report codes visible in dropdown");
  } catch (error) {
    log(`\n✗ ERROR: ${error.message}`);
    if (error.stack) {
      log(`Stack: ${error.stack}`);
    }
    throw error;
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  log(`\nFatal error: ${error.message}`);
  process.exit(1);
});
