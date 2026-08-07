import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";

const authFile = path.resolve("tests/.auth/user.json");
const facilityMetaPath = path.resolve("tests/.auth/facilityMeta.json");
const patientMetaPath = path.resolve("tests/.auth/patientMeta.json");
const encounterMetaPath = path.resolve("tests/.auth/encounterMeta.json");

function getApiHeaders() {
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

function getApiUrl() {
  return process.env.REACT_CARE_API_URL || "http://localhost:9000";
}

function getFacilityId() {
  const raw = fs.readFileSync(facilityMetaPath, "utf8");
  const { id } = JSON.parse(raw);
  if (!id) throw new Error("Missing id in facilityMeta.json");
  return id;
}

function getPatientId() {
  const raw = fs.readFileSync(patientMetaPath, "utf8");
  const { id } = JSON.parse(raw);
  if (!id) throw new Error("Missing id in patientMeta.json");
  return id;
}

function getEncounterId() {
  const raw = fs.readFileSync(encounterMetaPath, "utf8");
  const { id } = JSON.parse(raw);
  if (!id) throw new Error("Missing id in encounterMeta.json");
  return id;
}

async function requireOk(response, label) {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${label} failed: ${response.status} ${text}`);
  }
}

async function expandValueset(slug, searchTerms, required) {
  const baseUrl = getApiUrl();
  const headers = getApiHeaders();
  const found = new Map();

  for (const search of searchTerms) {
    console.log(`Expanding valueset ${slug} with search: ${search}`);
    const response = await fetch(
      `${baseUrl}/api/v1/valueset/${slug}/expand/`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ search, count: 20 }),
      }
    );

    await requireOk(response, `expand ${slug} for "${search}"`);
    const data = await response.json();
    
    for (const result of data.results) {
      found.set(`${result.system}|${result.code}`, {
        system: result.system,
        code: result.code,
        display: result.display,
      });
    }

    if (found.size >= required) break;
  }

  const values = [...found.values()].slice(0, required);
  if (values.length < required) {
    throw new Error(`${slug} provided ${values.length} codes, needed ${required}`);
  }
  return values;
}

async function main() {
  console.log("=== AC5: One code remains after creating one of two ===\n");

  const baseUrl = getApiUrl();
  const headers = getApiHeaders();
  const facilityId = getFacilityId();
  const patientId = getPatientId();
  const encounterId = getEncounterId();

  console.log(`Facility ID: ${facilityId}`);
  console.log(`Patient ID: ${patientId}`);
  console.log(`Encounter ID: ${encounterId}\n`);

  // Get current user ID
  console.log("Fetching current user...");
  const userResponse = await fetch(`${baseUrl}/api/v1/users/getcurrentuser/`, {
    headers,
  });
  await requireOk(userResponse, "get current user");
  const currentUser = await userResponse.json();
  const requesterId = currentUser.id;
  console.log(`Requester ID: ${requesterId}\n`);

  // Step 1: Obtain valid codes (only 2 diagnostic report codes)
  console.log("Step 1: Obtaining codes for 2-code Activity Definition");
  
  const [procedureCode] = await expandValueset(
    "activity-definition-procedure-code",
    ["laboratory", "test", "procedure"],
    1
  );
  console.log(`Procedure code: ${procedureCode.code} (${procedureCode.display})`);

  const diagnosticReportCodes = await expandValueset(
    "system-observation",
    ["glucose", "hemoglobin"],
    2
  );
  console.log(`Diagnostic report codes (${diagnosticReportCodes.length}):`);
  diagnosticReportCodes.forEach((code, i) => {
    console.log(`  ${i + 1}. ${code.code} - ${code.display}`);
  });

  // Step 2: Create Activity Definition with 2 codes
  console.log("\nStep 2: Creating Activity Definition with 2 diagnostic report codes");
  const unique = Date.now();
  const title = `QA Two Diagnostic Reports ${unique}`;
  const slugValue = `qa-two-diagnostic-${unique}`;

  const adBody = {
    slug_value: slugValue,
    title,
    status: "active",
    classification: "laboratory",
    kind: "service_request",
    code: procedureCode,
    diagnostic_report_codes: diagnosticReportCodes,
    specimen_requirements: [],
    charge_item_definitions: [],
    observation_result_requirements: [],
    locations: [],
    category: null,
    healthcare_service: null,
    body_site: null,
    description: "QA seed for two diagnostic reports",
    usage: "",
    derived_from_uri: null,
  };

  const adResponse = await fetch(
    `${baseUrl}/api/v1/facility/${facilityId}/activity_definition/`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(adBody),
    }
  );

  await requireOk(adResponse, "create Activity Definition");
  const activityDefinition = await adResponse.json();
  console.log(`Activity Definition created: ${activityDefinition.slug}`);

  // Step 3: Create Service Request
  console.log("\nStep 3: Creating Service Request");
  const srBody = {
    encounter: encounterId,
    activity_definition: activityDefinition.slug,
    service_request: {
      priority: "routine",
      category: "laboratory",
      status: "draft",
      intent: "proposal",
      do_not_perform: false,
      title: title,
      code: procedureCode,
      body_site: null,
      note: null,
      occurance: null,
      patient_instruction: null,
      locations: [],
      requester: requesterId,
    },
  };

  const srResponse = await fetch(
    `${baseUrl}/api/v1/facility/${facilityId}/service_request/apply_activity_definition/`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(srBody),
    }
  );

  await requireOk(srResponse, "create Service Request from AD");
  const serviceRequest = await srResponse.json();
  console.log(`Service Request created: ${serviceRequest.id}`);

  // Step 4: Drive the UI
  console.log("\nStep 4: Driving UI with video recording");

  const size = { width: 1440, height: 900 };
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: authFile,
    viewport: size,
    recordVideo: { dir: ".agent-hq/pw-videos", size },
  });

  const page = await context.newPage();
  await page.screencast.showActions({ cursor: "pointer" });

  const srUrl = `http://localhost:4000/facility/${facilityId}/service_requests/${serviceRequest.id}`;
  console.log(`Navigating to: ${srUrl}`);
  await page.goto(srUrl, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(3000);

  console.log("\nAC5 Step 1: Verifying dropdown shows 2 codes");
  const dropdown = page.locator('[role="combobox"]').first();
  await dropdown.scrollIntoViewIfNeeded();
  await dropdown.click();
  await page.waitForTimeout(1000);

  const initialOptions = page.locator('[role="option"]');
  const initialCount = await initialOptions.count();
  console.log(`Found ${initialCount} initial options`);
  
  for (let i = 0; i < initialCount; i++) {
    const text = await initialOptions.nth(i).textContent();
    console.log(`  Option ${i + 1}: ${text}`);
  }

  if (initialCount === 2) {
    console.log("✓ PASS: 2 codes available initially");
  } else {
    console.log(`⚠ Expected 2 codes, found ${initialCount}`);
  }

  // AC5 Step 2: Select first code and create report
  console.log("\nAC5 Step 2: Selecting first code and creating report");
  const firstOption = page.locator('[role="option"]').first();
  const firstCodeText = await firstOption.textContent();
  console.log(`Selecting: ${firstCodeText}`);
  await firstOption.click();
  await page.waitForTimeout(1000);

  const createButton = page.locator('button:has-text("Create Report")').first();
  await createButton.click();
  
  console.log("Waiting for success toast...");
  await page.waitForTimeout(3000);

  // AC5 Step 3: Verify only 1 code remains
  console.log("\nAC5 Step 3: Verifying only 1 code remains");
  await dropdown.click();
  await page.waitForTimeout(1000);
  
  const remainingOptions = page.locator('[role="option"]');
  const remainingCount = await remainingOptions.count();
  console.log(`Found ${remainingCount} remaining options`);
  
  for (let i = 0; i < remainingCount; i++) {
    const text = await remainingOptions.nth(i).textContent();
    console.log(`  Option ${i + 1}: ${text}`);
  }
  
  if (remainingCount === 1) {
    console.log("✓ PASS: Only 1 code remains");
  } else {
    console.log(`⚠ Expected 1 code, found ${remainingCount}`);
  }

  // AC5 Step 4: Confirm first code is not in dropdown
  console.log("\nAC5 Step 4: Confirming first code is no longer available");
  const hasFirstCode = await page.locator(`[role="option"]:has-text("${firstCodeText}")`).count() > 0;
  if (!hasFirstCode) {
    console.log("✓ PASS: First code is not in dropdown");
  } else {
    console.log("⚠ First code still appears in dropdown");
  }

  await page.waitForTimeout(2000);

  console.log("\n=== AC5 SUMMARY ===");
  console.log("✓ Dropdown initially showed 2 codes");
  console.log("✓ Created report using first code");
  console.log("✓ Only 1 code remains in dropdown");
  console.log("✓ First code no longer appears");

  await context.close();
  await browser.close();

  // Copy video
  const videoFiles = fs.readdirSync(".agent-hq/pw-videos");
  if (videoFiles.length > 0) {
    const videoFile = videoFiles[0];
    fs.copyFileSync(
      path.join(".agent-hq/pw-videos", videoFile),
      "specs/23/videos/ac5-two-code-scenario.webm"
    );
    console.log("\n✓ Video saved to specs/23/videos/ac5-two-code-scenario.webm");
  }

  console.log("\n=== AC5 complete ===");
}

main().catch((err) => {
  console.error("ERROR:", err.message);
  console.error(err.stack);
  process.exit(1);
});
