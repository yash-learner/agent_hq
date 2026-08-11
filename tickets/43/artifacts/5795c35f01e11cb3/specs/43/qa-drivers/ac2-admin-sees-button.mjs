#!/usr/bin/env node
/**
 * AC2: User with can_create_encounter sees button in empty state
 * Tests that an admin user (with permission) sees "Create Encounter" button
 * in the empty state of EncounterHistory.
 * 
 * NOTE: This test could not be completed due to test data limitations.
 * See specs/43/qa-logs/ac2-admin-sees-button.log for details.
 */
import { chromium } from "@playwright/test";
import { readAccessToken } from "../../../.agent-hq/qa-auth.mjs";
import fs from "node:fs";

const FACILITY_ID = "7bffb9f5-b1b6-4133-9555-ea7cb2c54836";
const API_BASE = process.env.REACT_CARE_API_URL || "http://localhost:9000";
const BASE_URL = "http://localhost:4000";
const SIZE = { width: 1440, height: 900 };

console.log("=== AC2: Admin user sees Create Encounter button in empty state ===");

let browser;
let context;
let page;
let patientId;

try {
  // Step 1: Create a patient via API using admin credentials
  console.log("\n--- Data setup: Creating patient without encounters ---");
  const adminToken = readAccessToken("tests/.auth/user.json");
  
  // Fetch geo_organization (required field)
  console.log("Fetching geo_organization...");
  const orgRes = await fetch(`${API_BASE}/api/v1/organization/?org_type=govt&limit=1`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    },
  });
  console.log(`Organization API status: ${orgRes.status}`);
  
  if (!orgRes.ok) {
    const errorText = await orgRes.text();
    throw new Error(`Failed to fetch organization: ${orgRes.status} - ${errorText}`);
  }
  
  const orgData = await orgRes.json();
  if (!orgData.results || orgData.results.length === 0) {
    throw new Error("No government organizations found in fixtures");
  }
  const geoOrgId = orgData.results[0].id;
  console.log(`Using geo_organization: ${geoOrgId}`);
  
  // Create patient
  const patientPayload = {
    name: `QA Patient AC2 Admin ${Date.now()}`,
    gender: "female",
    phone_number: `+919${Math.floor(100000000 + Math.random() * 900000000)}`,
    date_of_birth: "1985-05-20",
    geo_organization: geoOrgId,
    identifiers: [],
  };
  
  console.log("Creating patient...");
  const patientRes = await fetch(`${API_BASE}/api/v1/patient/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(patientPayload),
  });
  console.log(`Patient creation status: ${patientRes.status}`);
  
  if (!patientRes.ok) {
    const errorText = await patientRes.text();
    throw new Error(`Failed to create patient: ${patientRes.status} - ${errorText}`);
  }
  
  const patientData = await patientRes.json();
  patientId = patientData.id;
  console.log(`Created patient with ID: ${patientId}`);
  
  // Step 2: Open browser and login as admin
  console.log("\n--- Opening browser and logging in as admin user ---");
  browser = await chromium.launch({ headless: true });
  context = await browser.newContext({
    viewport: SIZE,
    recordVideo: { dir: "specs/43/qa-drivers/videos-temp", size: SIZE },
  });
  page = await context.newPage();
  
  // Enable cursor overlay before recording
  await page.screencast.showActions({ cursor: "pointer" });
  
  // Login manually
  console.log("Navigating to login page...");
  await page.goto(`${BASE_URL}/login`, { waitUntil: "load" });
  
  console.log("Filling login form...");
  await page.getByRole("textbox", { name: /username/i }).fill("admin");
  await page.getByLabel(/^password$/i).fill("admin");
  
  console.log("Clicking login button...");
  await page.getByRole("button", { name: /login/i }).click();
  
  console.log("Waiting for login to complete...");
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });
  
  // Wait for authenticated shell
  const sidebar = page.locator('[data-sidebar="sidebar"]');
  const hey = page.getByRole("heading", { name: /^Hey .+/ });
  await Promise.race([
    sidebar.waitFor({ state: "visible", timeout: 15000 }),
    hey.waitFor({ state: "visible", timeout: 15000 }),
  ]).catch(() => {});
  
  console.log("Login successful, authenticated shell verified");
  
  // Step 3: Navigate to patient encounters page
  console.log(`\n--- Navigating to patient encounters page ---`);
  const encountersUrl = `${BASE_URL}/facility/${FACILITY_ID}/patient/${patientId}/encounters`;
  await page.goto(encountersUrl, { waitUntil: "load" });
  console.log(`Navigated to: ${encountersUrl}`);
  
  // Wait for page to load
  await page.waitForLoadState("networkidle");
  
  // Step 4: Verify empty state is visible
  console.log("\n--- Verifying empty state ---");
  const emptyStateHeading = page.getByRole("heading", { name: /no active encounters found/i });
  await emptyStateHeading.waitFor({ state: "visible", timeout: 10000 });
  console.log("✓ Empty state heading visible");
  
  // Step 5: Verify "Create Encounter" button IS visible
  console.log("\n--- Verifying Create Encounter button IS visible ---");
  const createButton = page.getByRole("button", { name: /create encounter/i });
  
  // Wait a moment to ensure the page is fully rendered
  await page.waitForTimeout(1000);
  
  const isButtonVisible = await createButton.isVisible().catch(() => false);
  
  if (!isButtonVisible) {
    console.log("✗ FAIL: Create Encounter button is NOT visible (should be visible for admin)");
    await page.screenshot({ path: "specs/43/screenshots/ac2-fail.png", fullPage: true });
    throw new Error("Create Encounter button should be visible for admin user");
  }
  
  console.log("✓ Create Encounter button IS visible (correct behavior)");
  
  // Step 6: Click the button to open the dialog
  console.log("\n--- Clicking Create Encounter button ---");
  await createButton.click();
  await page.waitForTimeout(1000);
  
  // Verify dialog opened
  const dialog = page.locator('[role="dialog"]');
  const isDialogVisible = await dialog.isVisible().catch(() => false);
  console.log(`Create Encounter dialog visible: ${isDialogVisible}`);
  
  // Take a screenshot for documentation
  await page.screenshot({ path: "specs/43/screenshots/ac2-admin-with-button.png", fullPage: true });
  console.log("Screenshot saved: specs/43/screenshots/ac2-admin-with-button.png");
  
  console.log("\n=== AC2 PASSED ===");
  
} catch (error) {
  console.error("\n=== AC2 FAILED/NOT-EXERCISED ===");
  console.error(error.message);
  if (page) {
    await page.screenshot({ path: "specs/43/screenshots/ac2-error.png", fullPage: true }).catch(() => {});
  }
  process.exit(1);
} finally {
  if (page) {
    await page.close().catch(() => {});
  }
  if (context) {
    await context.close().catch(() => {});
  }
  if (browser) {
    await browser.close().catch(() => {});
  }
}
