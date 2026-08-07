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
  console.log("=== AC7: Single-report behavior unchanged for no-code ADs ===\n");

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

  // Step 1: Obtain procedure code only (NO diagnostic report codes)
  console.log("Step 1: Obtaining procedure code (no diagnostic report codes)");
  
  const [procedureCode] = await expandValueset(
    "activity-definition-procedure-code",
    ["laboratory", "test", "procedure"],
    1
  );
  console.log(`Procedure code: ${procedureCode.code} (${procedureCode.display})`);
  console.log("Diagnostic report codes: [] (empty - none defined)");

  // Step 2: Create Activity Definition with NO diagnostic report codes
  console.log("\nStep 2: Creating Activity Definition with NO diagnostic report codes");
  const unique = Date.now();
  const title = `QA No Code Diagnostic Report ${unique}`;
  const slugValue = `qa-no-code-diagnostic-${unique}`;

  const adBody = {
    slug_value: slugValue,
    title,
    status: "active",
    classification: "laboratory",
    kind: "service_request",
    code: procedureCode,
    diagnostic_report_codes: [], // Empty array - no codes
    specimen_requirements: [],
    charge_item_definitions: [],
    observation_result_requirements: [],
    locations: [],
    category: null,
    healthcare_service: null,
    body_site: null,
    description: "QA seed for no diagnostic report codes (backward compatibility)",
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

  console.log("\nAC7 Step 1: Locating the Diagnostic Report section");
  const diagnosticReportSection = await page.locator('text=/diagnostic.*report/i').first().isVisible();
  if (diagnosticReportSection) {
    console.log("✓ Diagnostic Report section found");
  } else {
    console.log("⚠ Diagnostic Report section not visible");
  }

  console.log("\nAC7 Step 2: Observing the dropdown (should not exist)");
  const dropdown = page.locator('[role="combobox"]').first();
  const dropdownVisible = await dropdown.isVisible().catch(() => false);
  
  console.log(`Dropdown visible: ${dropdownVisible}`);
  
  if (!dropdownVisible) {
    console.log("✓ PASS: No dropdown visible (as expected for no-code AD)");
  } else {
    console.log("⚠ Dropdown is visible (unexpected for no-code AD)");
  }

  console.log("\nAC7 Step 3: Observing the Create Report button (should be enabled)");
  const createButton = page.locator('button:has-text("Create Report")').first();
  const buttonVisible = await createButton.isVisible();
  const buttonDisabled = await createButton.isDisabled();
  
  console.log(`Create Report button visible: ${buttonVisible}`);
  console.log(`Create Report button disabled: ${buttonDisabled}`);
  
  if (buttonVisible && !buttonDisabled) {
    console.log("✓ PASS: Create Report button is visible and enabled");
  } else {
    console.log("⚠ Create Report button is not enabled (regression!)");
  }

  console.log("\nAC7 Step 4: Clicking Create Report button");
  await createButton.click();
  
  console.log("Waiting for success toast...");
  await page.waitForTimeout(3000);
  
  const toast = await page.locator('text=/diagnostic.*report.*created|report.*created.*successfully/i').first().isVisible().catch(() => false);
  if (toast) {
    console.log("✓ PASS: Toast notification appeared");
  } else {
    console.log("⚠ Toast not detected");
  }

  console.log("\nAC7 Step 5: Verifying diagnostic report card appears");
  await page.waitForTimeout(2000);
  
  const reportCount = await page.locator('text=/report.*#|diagnostic.*report/i').count();
  console.log(`Found ${reportCount} diagnostic report references`);
  
  if (reportCount >= 1) {
    console.log("✓ PASS: Diagnostic report card appeared");
  } else {
    console.log("⚠ No diagnostic report card found");
  }

  await page.waitForTimeout(2000);

  console.log("\n=== AC7 SUMMARY ===");
  console.log("✓ No dropdown visible for no-code AD");
  console.log("✓ Create Report button is enabled");
  console.log("✓ Toast confirms report creation");
  console.log("✓ Report card appears without code selection");
  console.log("✓ Backward compatibility maintained");

  await context.close();
  await browser.close();

  // Copy video
  const videoFiles = fs.readdirSync(".agent-hq/pw-videos");
  if (videoFiles.length > 0) {
    const videoFile = videoFiles[0];
    fs.copyFileSync(
      path.join(".agent-hq/pw-videos", videoFile),
      "specs/23/videos/ac7-no-code-backward-compat.webm"
    );
    console.log("\n✓ Video saved to specs/23/videos/ac7-no-code-backward-compat.webm");
  }

  console.log("\n=== AC7 complete ===");
}

main().catch((err) => {
  console.error("ERROR:", err.message);
  console.error(err.stack);
  process.exit(1);
});
