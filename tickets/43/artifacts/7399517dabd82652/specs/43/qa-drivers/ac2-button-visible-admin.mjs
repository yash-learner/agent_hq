#!/usr/bin/env node
/**
 * AC2: User with can_create_encounter sees button in empty state
 * Auth: admin (has can_create_encounter permission)
 */

import { chromium } from "playwright";
import { readAccessToken } from "../../../.agent-hq/qa-auth.mjs";

const FACILITY_ID = "6bb10676-1d20-4fc5-b730-0ff203c6e30d";
const API_BASE = process.env.REACT_CARE_API_URL || "http://localhost:9000";
const BASE_URL = "http://localhost:4000";

async function main() {
  const browser = await chromium.launch({ headless: true });
  let context, page;
  
  try {
    console.log("[ac2] Starting AC2: Admin with can_create_encounter permission");
    
    // Step 1: Create a patient with zero encounters using admin auth
    console.log("[ac2] Step 1: Creating test patient via API with admin auth");
    
    const accessToken = readAccessToken("tests/.auth/user.json");
    
    // Fetch geo_organization first
    console.log("[ac2] Fetching geo_organization...");
    const geoOrgRes = await fetch(`${API_BASE}/api/v1/organization/?org_type=govt&limit=1`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    console.log(`[ac2] geo_org fetch status: ${geoOrgRes.status}`);
    
    if (!geoOrgRes.ok) {
      const errorText = await geoOrgRes.text();
      console.error(`[ac2] geo_org fetch failed: ${errorText}`);
      throw new Error(`Failed to fetch geo_organization: ${geoOrgRes.status}`);
    }
    
    const geoOrgData = await geoOrgRes.json();
    if (!geoOrgData.results || geoOrgData.results.length === 0) {
      throw new Error("No geo_organization found");
    }
    const geoOrgId = geoOrgData.results[0].id;
    console.log(`[ac2] Using geo_org ID: ${geoOrgId}`);
    
    // Create patient
    const patientData = {
      name: `QA Patient AC2 Admin ${Date.now()}`,
      gender: "female",
      phone_number: `+919${String(Date.now()).slice(-9)}`,
      date_of_birth: "1985-05-20",
      geo_organization: geoOrgId,
      identifiers: [],
    };
    
    console.log("[ac2] Creating patient...");
    const patientRes = await fetch(`${API_BASE}/api/v1/patient/`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patientData),
    });
    console.log(`[ac2] Patient creation status: ${patientRes.status}`);
    
    if (!patientRes.ok) {
      const errorText = await patientRes.text();
      console.error(`[ac2] Patient creation failed: ${errorText}`);
      throw new Error(`Failed to create patient: ${patientRes.status}`);
    }
    
    const patient = await patientRes.json();
    const patientId = patient.id;
    console.log(`[ac2] Created patient ID: ${patientId}`);
    
    // Step 2: Open authenticated context as admin
    console.log("[ac2] Step 2: Opening authenticated context as admin");
    const size = { width: 1440, height: 900 };
    context = await browser.newContext({
      storageState: "tests/.auth/user.json",
      viewport: size,
      recordVideo: { dir: ".agent-hq/pw-videos", size },
    });
    page = await context.newPage();
    
    // Manual login if needed
    await page.goto(`${BASE_URL}/login`);
    console.log("[ac2] At login page");
    
    // Check if already authenticated
    const usernameField = page.getByRole("textbox", { name: /username/i });
    const isLoginPage = await usernameField.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (isLoginPage) {
      console.log("[ac2] Logging in as admin");
      await usernameField.fill("admin");
      await page.getByLabel(/password/i).fill("admin");
      await page.getByRole("button", { name: /login/i }).click();
      await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });
      console.log("[ac2] Login successful");
    } else {
      console.log("[ac2] Already authenticated");
    }
    
    // Wait for shell to be ready
    await page.waitForSelector('[data-sidebar="sidebar"], h1:has-text("Hey")', { timeout: 15000 }).catch(() => {});
    console.log("[ac2] Shell ready");
    
    // Enable cursor/click overlay
    await page.screencast.showActions({ cursor: "pointer" });
    console.log("[ac2] Cursor overlay enabled");
    
    // Step 3: Navigate to patient encounters tab
    console.log(`[ac2] Step 3: Navigating to /facility/${FACILITY_ID}/patient/${patientId}/encounters`);
    await page.goto(`${BASE_URL}/facility/${FACILITY_ID}/patient/${patientId}/encounters`);
    
    // Wait for page to load
    await page.waitForLoadState("networkidle", { timeout: 15000 });
    console.log("[ac2] Page loaded");
    
    // Debug: check what's on the page
    const pageTitle = await page.title();
    console.log(`[ac2] Page title: ${pageTitle}`);
    
    // Look for any heading
    const headings = await page.locator("h1, h2, h3").allTextContents();
    console.log(`[ac2] Found headings: ${JSON.stringify(headings)}`);
    
    // Wait a moment for any async rendering
    await page.waitForTimeout(2000);
    
    // Step 4: Verify "Create Encounter" button IS visible
    console.log("[ac2] Step 4: Verifying 'Create Encounter' button IS visible");
    const createButton = page.getByRole("button", { name: /create encounter/i });
    
    // Wait for button to be visible
    await createButton.waitFor({ state: "visible", timeout: 10000 });
    console.log("[ac2] 'Create Encounter' button is visible for admin");
    
    // Step 5: Click the button to open the dialog
    console.log("[ac2] Step 5: Clicking 'Create Encounter' button");
    await createButton.click();
    
    // Wait for dialog/form to open
    await page.waitForTimeout(1000);
    
    // Check for dialog - it could be a modal or inline form
    const dialogVisible = await page.locator("[role='dialog'], form").first().isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`[ac2] Dialog/form visible: ${dialogVisible}`);
    
    if (dialogVisible) {
      console.log("[ac2] Create encounter form opened successfully");
      
      // Step 6: Close the dialog without saving
      console.log("[ac2] Step 6: Closing dialog");
      const cancelButton = page.getByRole("button", { name: /cancel|close/i });
      const closeButton = page.locator("[aria-label='Close'], button:has-text('×')").first();
      
      const cancelVisible = await cancelButton.isVisible({ timeout: 2000 }).catch(() => false);
      const closeVisible = await closeButton.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (cancelVisible) {
        await cancelButton.click();
        console.log("[ac2] Clicked Cancel button");
      } else if (closeVisible) {
        await closeButton.click();
        console.log("[ac2] Clicked Close button");
      } else {
        // Try Escape key
        await page.keyboard.press("Escape");
        console.log("[ac2] Pressed Escape key");
      }
      
      await page.waitForTimeout(1000);
      console.log("[ac2] Dialog closed");
    }
    
    // Wait a moment for video
    await page.waitForTimeout(2000);
    
    console.log("[ac2] SUCCESS: AC2 completed successfully");
  } catch (error) {
    console.error(`[ac2] ERROR: ${error.message}`);
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
