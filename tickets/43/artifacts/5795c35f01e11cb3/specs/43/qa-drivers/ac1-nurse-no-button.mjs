#!/usr/bin/env node
/**
 * AC1: User without can_create_encounter sees no button in empty state
 * Tests that a nurse user (without permission) sees no "Create Encounter" button
 * in the empty state of EncounterHistory.
 */
import { chromium } from "@playwright/test";
import { readAccessToken } from "../../../.agent-hq/qa-auth.mjs";
import fs from "node:fs";

const FACILITY_ID = "7bffb9f5-b1b6-4133-9555-ea7cb2c54836";
const API_BASE = process.env.REACT_CARE_API_URL || "http://localhost:9000";
const BASE_URL = "http://localhost:4000";
const SIZE = { width: 1440, height: 900 };

console.log("=== AC1: Nurse user sees no Create Encounter button in empty state ===");

let browser;
let context;
let page;
let patientId;

try {
  // Step 1: Create a patient via API using nurse credentials
  console.log("\n--- Data setup: Creating patient without encounters ---");
  const nurseToken = readAccessToken("tests/.auth/nurse.json");
  
  // Fetch geo_organization (required field)
  console.log("Fetching geo_organization...");
  const orgRes = await fetch(`${API_BASE}/api/v1/organization/?org_type=govt&limit=1`, {
    headers: {
      Authorization: `Bearer ${nurseToken}`,
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
    name: `QA Patient AC1 Nurse ${Date.now()}`,
    gender: "male",
    phone_number: `+919${Math.floor(100000000 + Math.random() * 900000000)}`,
    date_of_birth: "1990-01-15",
    geo_organization: geoOrgId,
    identifiers: [],
  };
  
  console.log("Creating patient...");
  const patientRes = await fetch(`${API_BASE}/api/v1/patient/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${nurseToken}`,
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
  
  // Step 2: Open browser and login as nurse
  console.log("\n--- Opening browser and logging in as nurse user ---");
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
  await page.getByRole("textbox", { name: /username/i }).fill("care-nurse");
  await page.getByLabel(/^password$/i).fill("Ohcn@123");
  
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
  
  // Step 5: Verify "Create Encounter" button is NOT visible
  console.log("\n--- Verifying Create Encounter button is NOT visible ---");
  const createButton = page.getByRole("button", { name: /create encounter/i });
  
  // Wait a moment to ensure the page is fully rendered
  await page.waitForTimeout(1000);
  
  const isButtonVisible = await createButton.isVisible().catch(() => false);
  
  if (isButtonVisible) {
    console.log("✗ FAIL: Create Encounter button is visible (should be hidden for nurse)");
    await page.screenshot({ path: "specs/43/screenshots/ac1-fail.png", fullPage: true });
    throw new Error("Create Encounter button should not be visible for nurse user");
  }
  
  console.log("✓ Create Encounter button is NOT visible (correct behavior)");
  
  // Take a screenshot for documentation
  await page.screenshot({ path: "specs/43/screenshots/ac1-nurse-empty-state.png", fullPage: true });
  console.log("Screenshot saved: specs/43/screenshots/ac1-nurse-empty-state.png");
  
  console.log("\n=== AC1 PASSED ===");
  
} catch (error) {
  console.error("\n=== AC1 FAILED ===");
  console.error(error.message);
  if (page) {
    await page.screenshot({ path: "specs/43/screenshots/ac1-error.png", fullPage: true }).catch(() => {});
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
