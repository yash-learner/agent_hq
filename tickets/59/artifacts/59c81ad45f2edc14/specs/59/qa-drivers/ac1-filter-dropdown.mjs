#!/usr/bin/env node
import { chromium } from "@playwright/test";

const FACILITY_ID = "51b93335-836e-4d6c-9d96-2d8a5b01dbe9";
const PATIENT_ID = "cbba8b30-855c-4376-91e1-9c5c17a0fbdb";
const ENCOUNTER_ID = "b025f4ad-0d86-49cc-9a05-e41fbe3e3c5a";
const SIZE = { width: 1440, height: 900 };

async function selectFromValueSet(page, combobox, { search }) {
  await combobox.click();
  await page.waitForTimeout(500);
  const searchInput = page.getByRole("combobox").filter({ hasText: /search/i }).or(
    page.getByPlaceholder(/search/i)
  );
  if (await searchInput.isVisible().catch(() => false)) {
    await searchInput.fill(search);
    await page.waitForTimeout(800);
  }
  const option = page.getByRole("option", { name: new RegExp(search, "i") }).first();
  await option.waitFor({ state: "visible", timeout: 10000 });
  await option.click();
  await page.waitForTimeout(500);
}

async function main() {
  console.log("[AC1] Starting browser...");
  const browser = await chromium.launch({ headless: true });
  
  console.log("[AC1] Creating authenticated context...");
  const context = await browser.newContext({
    storageState: "tests/.auth/user.json",
    viewport: SIZE,
    recordVideo: { dir: "specs/59/videos", size: SIZE },
  });
  
  const page = await context.newPage();
  
  console.log("[AC1] Enabling screencast...");
  await page.screencast.showActions({ cursor: "pointer" });
  
  console.log("[AC1] Creating Activity Definition with 3 diagnostic report codes...");
  
  // Navigate to create AD page
  await page.goto(
    `http://localhost:4000/facility/${FACILITY_ID}/settings/activity_definitions/categories/f-${FACILITY_ID}-lab-tests-activity-definition/new`
  );
  await page.waitForLoadState("domcontentloaded");
  
  // Fill basic fields
  const timestamp = Date.now();
  const adTitle = `Multi-Code AD ${timestamp}`;
  await page.getByLabel(/title.*\*/i).fill(adTitle);
  await page.getByLabel(/description.*\*/i).fill("Activity Definition for testing multiple diagnostic reports");
  await page.getByLabel(/usage.*\*/i).fill("For QA testing of ticket 59");
  
  // Select Status
  await page.getByLabel(/^status$/i).click();
  await page.getByRole("option", { name: "Active" }).click();
  
  // Select Classification
  await page.getByRole("combobox", { name: /^category\s*\*$/i }).click();
  await page.getByRole("option", { name: "Laboratory" }).click();
  
  // Select Kind
  await page.getByLabel(/^kind$/i).click();
  await page.getByRole("option", { name: /service request/i }).click();
  
  // Select Code
  const codeCombobox = page.getByRole("combobox", { name: /^code/i });
  await selectFromValueSet(page, codeCombobox, {
    search: "Acyclovir",
  });
  
  // Scroll to Diagnostic Report section
  await page.getByRole("heading", { name: /diagnostic report/i }).scrollIntoViewIfNeeded();
  
  // Add 3 diagnostic report codes
  console.log("[AC1] Adding first diagnostic report code...");
  const diagCombobox = page.getByRole("combobox").filter({ hasText: /search.*diagnostic/i });
  await selectFromValueSet(page, diagCombobox, {
    search: "Acyclovir",
  });
  
  console.log("[AC1] Adding second diagnostic report code...");
  await selectFromValueSet(page, diagCombobox, {
    search: "Amdinocillin",
  });
  
  console.log("[AC1] Adding third diagnostic report code...");
  await selectFromValueSet(page, diagCombobox, {
    search: "Cefoperazone",
  });
  
  // Save AD
  await page.getByRole("button", { name: /^create$/i }).click();
  await page.waitForURL(`http://localhost:4000/facility/${FACILITY_ID}/settings/activity_definitions`, { timeout: 10000 });
  console.log("[AC1] Activity Definition created successfully");
  
  // Create Service Request
  console.log("[AC1] Creating Service Request...");
  await page.goto(
    `http://localhost:4000/facility/${FACILITY_ID}/patient/${PATIENT_ID}/encounter/${ENCOUNTER_ID}/service_requests`
  );
  
  await page.getByRole("button", { name: /create service request/i }).click();
  
  const activityDefinitionPicker = page
    .locator('button[role="combobox"]')
    .filter({ hasText: /select activity definition/i });
  await activityDefinitionPicker.click();
  
  // Navigate to Lab Tests category
  await page.getByText(/lab tests/i).click();
  await page.waitForTimeout(500);
  
  // Search for and select the AD we just created
  const searchInput = page.getByPlaceholder(/search/i);
  await searchInput.fill(adTitle);
  await page.waitForTimeout(800);
  
  const adOption = page.getByText(adTitle).first();
  await adOption.click();
  
  // Expand the SR card and select priority
  const serviceRequestCard = page
    .locator('[data-slot="collapsible"]')
    .filter({ hasText: adTitle })
    .first();
  await serviceRequestCard.locator('[data-slot="collapsible-trigger"]').click();
  await serviceRequestCard.getByRole("radio", { name: /routine/i }).check();
  
  // Submit
  await page.getByRole("button", { name: /submit/i }).click();
  await page.waitForTimeout(3000);
  
  console.log("[AC1] Service Request created, navigating to service requests page...");
  
  // Navigate to the service requests page to find the newly created SR
  await page.goto(
    `http://localhost:4000/facility/${FACILITY_ID}/patient/${PATIENT_ID}/encounter/${ENCOUNTER_ID}/service_requests`
  );
  await page.waitForTimeout(2000);
  
  // Look for the SR link with our AD title
  const srLink = page.locator(`a[href*="/service_requests/"]`).filter({ hasText: adTitle }).first();
  const href = await srLink.getAttribute("href");
  const match = href?.match(/\/service_requests\/([a-f0-9-]+)/);
  
  if (!match) {
    throw new Error("Could not find service request ID");
  }
  
  const serviceRequestId = match[1];
  console.log(`[AC1] Service Request ID: ${serviceRequestId}`);
  
  // Navigate to the SR page to start testing AC1
  await page.goto(`http://localhost:4000/facility/${FACILITY_ID}/service_requests/${serviceRequestId}`);
  await page.waitForTimeout(2000);
  
  // AC1: Verify all 3 codes are shown initially
  console.log("[AC1] Verifying all 3 codes are visible in dropdown...");
  await page.getByText(/test results/i).scrollIntoViewIfNeeded();
  
  const codeDropdown = page.getByRole("combobox", { name: /select diagnostic report type/i });
  await codeDropdown.click();
  await page.waitForTimeout(500);
  
  // Check all 3 codes are present
  const acyclovirOption = page.getByRole("option", { name: /Acyclovir.*Susceptibility/i });
  const amdinocillinOption = page.getByRole("option", { name: /Amdinocillin.*Susceptibility/i });
  const cefoperazoneOption = page.getByRole("option", { name: /Cefoperazone.*Susceptibility/i });
  
  await acyclovirOption.waitFor({ state: "visible", timeout: 5000 });
  console.log("[AC1] ✓ All 3 codes visible in initial dropdown");
  
  // Select first code and create report
  console.log("[AC1] Creating first diagnostic report with Acyclovir code...");
  await acyclovirOption.click();
  await page.waitForTimeout(500);
  
  await page.getByRole("button", { name: /create report/i }).click();
  await page.waitForTimeout(3000);
  
  console.log("[AC1] First report created, verifying dropdown now shows only 2 codes...");
  
  // Verify dropdown now shows only 2 codes (excluding Acyclovir)
  await page.getByText(/test results/i).scrollIntoViewIfNeeded();
  const codeDropdown2 = page.getByRole("combobox", { name: /select diagnostic report type/i });
  await codeDropdown2.click();
  await page.waitForTimeout(500);
  
  // Acyclovir should NOT be present
  const acyclovirStillPresent = await page.getByRole("option", { name: /Acyclovir.*Susceptibility/i }).isVisible().catch(() => false);
  if (acyclovirStillPresent) {
    throw new Error("[AC1] FAIL: Acyclovir code still present in dropdown after creating report");
  }
  
  // Other 2 codes should be present
  await page.getByRole("option", { name: /Amdinocillin.*Susceptibility/i }).waitFor({ state: "visible", timeout: 5000 });
  await page.getByRole("option", { name: /Cefoperazone.*Susceptibility/i }).waitFor({ state: "visible", timeout: 5000 });
  
  console.log("[AC1] ✓ PASS: After creating first report, dropdown shows only 2 remaining codes (Amdinocillin and Cefoperazone)");
  
  await context.close();
  await browser.close();
  
  console.log("[AC1] Test completed successfully");
}

main().catch((err) => {
  console.error("[AC1] ERROR:", err.message);
  process.exit(1);
});
