#!/usr/bin/env node
/**
 * AC1: User without can_create_encounter sees no button in empty state
 * Auth: care-nurse (lacks can_create_encounter permission)
 */

import { chromium } from "playwright";
import { openAuthedContext, readAccessToken } from "../../../.agent-hq/qa-auth.mjs";

const FACILITY_ID = "6bb10676-1d20-4fc5-b730-0ff203c6e30d";
const API_BASE = process.env.REACT_CARE_API_URL || "http://localhost:9000";
const BASE_URL = "http://localhost:4000";

async function main() {
  const browser = await chromium.launch({ headless: true });
  let context, page;
  
  try {
    console.log("[ac1] Starting AC1: Nurse without can_create_encounter permission");
    
    // Step 1: Create a patient with zero encounters using nurse auth
    console.log("[ac1] Step 1: Creating test patient via API with nurse auth");
    
    const accessToken = readAccessToken("tests/.auth/nurse.json");
    
    // Fetch geo_organization first
    console.log("[ac1] Fetching geo_organization...");
    const geoOrgRes = await fetch(`${API_BASE}/api/v1/organization/?org_type=govt&limit=1`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    console.log(`[ac1] geo_org fetch status: ${geoOrgRes.status}`);
    
    if (!geoOrgRes.ok) {
      const errorText = await geoOrgRes.text();
      console.error(`[ac1] geo_org fetch failed: ${errorText}`);
      throw new Error(`Failed to fetch geo_organization: ${geoOrgRes.status}`);
    }
    
    const geoOrgData = await geoOrgRes.json();
    if (!geoOrgData.results || geoOrgData.results.length === 0) {
      throw new Error("No geo_organization found");
    }
    const geoOrgId = geoOrgData.results[0].id;
    console.log(`[ac1] Using geo_org ID: ${geoOrgId}`);
    
    // Create patient
    const patientData = {
      name: `QA Patient AC1 Nurse ${Date.now()}`,
      gender: "male",
      phone_number: `+919${String(Date.now()).slice(-9)}`,
      date_of_birth: "1990-01-15",
      geo_organization: geoOrgId,
      identifiers: [],
    };
    
    console.log("[ac1] Creating patient...");
    const patientRes = await fetch(`${API_BASE}/api/v1/patient/`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patientData),
    });
    console.log(`[ac1] Patient creation status: ${patientRes.status}`);
    
    if (!patientRes.ok) {
      const errorText = await patientRes.text();
      console.error(`[ac1] Patient creation failed: ${errorText}`);
      throw new Error(`Failed to create patient: ${patientRes.status}`);
    }
    
    const patient = await patientRes.json();
    const patientId = patient.id;
    console.log(`[ac1] Created patient ID: ${patientId}`);
    
    // Step 2: Open authenticated context as nurse
    console.log("[ac1] Step 2: Opening authenticated context as nurse");
    const size = { width: 1440, height: 900 };
    context = await browser.newContext({
      storageState: "tests/.auth/nurse.json",
      viewport: size,
      recordVideo: { dir: ".agent-hq/pw-videos", size },
    });
    page = await context.newPage();
    
    // Manual login if needed
    await page.goto(`${BASE_URL}/login`);
    console.log("[ac1] At login page");
    
    // Check if already authenticated
    const usernameField = page.getByRole("textbox", { name: /username/i });
    const isLoginPage = await usernameField.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (isLoginPage) {
      console.log("[ac1] Logging in as nurse");
      await usernameField.fill("care-nurse");
      await page.getByLabel(/password/i).fill("Ohcn@123");
      await page.getByRole("button", { name: /login/i }).click();
      await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });
      console.log("[ac1] Login successful");
    } else {
      console.log("[ac1] Already authenticated");
    }
    
    // Wait for shell to be ready
    await page.waitForSelector('[data-sidebar="sidebar"], h1:has-text("Hey")', { timeout: 15000 }).catch(() => {});
    console.log("[ac1] Shell ready");
    
    // Enable cursor/click overlay
    await page.screencast.showActions({ cursor: "pointer" });
    console.log("[ac1] Cursor overlay enabled");
    
    // Step 3: Navigate to patient encounters tab
    console.log(`[ac1] Step 3: Navigating to /facility/${FACILITY_ID}/patient/${patientId}/encounters`);
    await page.goto(`${BASE_URL}/facility/${FACILITY_ID}/patient/${patientId}/encounters`);
    
    // Wait for page to load
    await page.waitForLoadState("networkidle", { timeout: 15000 });
    console.log("[ac1] Page loaded");
    
    // Debug: check what's on the page
    const pageTitle = await page.title();
    console.log(`[ac1] Page title: ${pageTitle}`);
    
    // Check if there's an error message or permission issue
    const errorText = await page.locator("text=/permission|access denied|error/i").first().textContent().catch(() => null);
    if (errorText) {
      console.log(`[ac1] Found error/permission text: ${errorText}`);
    }
    
    // Look for any heading
    const headings = await page.locator("h1, h2, h3").allTextContents();
    console.log(`[ac1] Found headings: ${JSON.stringify(headings)}`);
    
    // Wait for empty state to appear (try multiple possible i18n keys)
    console.log("[ac1] Waiting for empty state...");
    const emptyStateHeading = page.locator("h3:has-text('No'), h3:has-text('no'), h2:has-text('No'), h2:has-text('no')").first();
    const isVisible = await emptyStateHeading.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!isVisible) {
      console.log("[ac1] Empty state heading not visible, checking for 'Create Encounter' text anywhere");
      const createText = await page.locator("text=/create.*encounter/i").first().textContent().catch(() => null);
      console.log(`[ac1] Found 'create encounter' text: ${createText}`);
    } else {
      await emptyStateHeading.waitFor({ state: "visible", timeout: 5000 });
      console.log("[ac1] Empty state visible");
    }
    
    // Step 4: Verify "Create Encounter" button is NOT visible
    console.log("[ac1] Step 4: Verifying 'Create Encounter' button is NOT visible");
    const createButton = page.getByRole("button", { name: /create encounter/i });
    const buttonVisible = await createButton.isVisible().catch(() => false);
    
    if (buttonVisible) {
      console.error("[ac1] FAIL: 'Create Encounter' button is visible for nurse (should be hidden)");
      throw new Error("FAIL: Button should not be visible for nurse without permission");
    }
    
    console.log("[ac1] SUCCESS: 'Create Encounter' button is not visible for nurse");
    
    // Wait a moment for video
    await page.waitForTimeout(2000);
    
    console.log("[ac1] AC1 completed successfully");
  } catch (error) {
    console.error(`[ac1] ERROR: ${error.message}`);
    if (error.stack) console.error(error.stack);
    throw error;
  } finally {
    if (page) await page.close().catch(() => {});
    if (context) await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
