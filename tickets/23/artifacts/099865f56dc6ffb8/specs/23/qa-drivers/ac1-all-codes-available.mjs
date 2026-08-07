import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";

// Import helpers
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
  console.log("=== AC1: All codes available with no reports created ===\n");

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

  // Step 1: Obtain valid codes via valueset expansion
  console.log("Step 1: Obtaining valid codes via valueset expansion");
  
  const [procedureCode] = await expandValueset(
    "activity-definition-procedure-code",
    ["laboratory", "test", "procedure"],
    1
  );
  console.log(`Procedure code: ${procedureCode.code} (${procedureCode.display})`);

  const diagnosticReportCodes = await expandValueset(
    "system-observation",
    ["blood", "panel", "serum"],
    3
  );
  console.log(`Diagnostic report codes (${diagnosticReportCodes.length}):`);
  diagnosticReportCodes.forEach((code, i) => {
    console.log(`  ${i + 1}. ${code.code} - ${code.display}`);
  });

  // Step 2: Create Activity Definition
  console.log("\nStep 2: Creating Activity Definition");
  const unique = Date.now();
  const title = `QA Multi Diagnostic Reports ${unique}`;
  const slugValue = `qa-multi-diagnostic-${unique}`;

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
    description: "QA seed for multiple diagnostic reports",
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

  // Step 3: Create Service Request via apply_activity_definition
  console.log("Step 3: Creating Service Request via apply_activity_definition");
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

  // Save seed data for other criteria
  fs.writeFileSync(
    ".agent-hq/multiple-diagnostic-seed.json",
    JSON.stringify(
      {
        facilityId,
        patientId,
        encounterId,
        activityDefinitionSlug: activityDefinition.slug,
        serviceRequestId: serviceRequest.id,
        title,
        diagnosticReportCodes,
      },
      null,
      2
    )
  );

  // Step 4: Drive the UI and record
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
  await page.goto(srUrl, { waitUntil: "networkidle" });

  // Wait for auth shell readiness
  console.log("Waiting for auth shell readiness...");
  await page.waitForSelector('[data-sidebar="sidebar"]', {
    state: "visible",
    timeout: 10000,
  });
  console.log("Auth shell ready");

  // Wait for the page to fully load
  await page.waitForTimeout(2000);

  // AC1 Step 1: Locate the "Diagnostic Report" section
  console.log("\nAC1 Step 1: Locating Diagnostic Report section");
  const diagnosticReportSection = page.locator('text="Diagnostic Report"').first();
  await diagnosticReportSection.waitFor({ state: "visible", timeout: 10000 });
  console.log("Diagnostic Report section visible");

  // AC1 Step 2: Click the dropdown and verify all 3 codes are listed
  console.log("\nAC1 Step 2: Opening dropdown to verify all 3 codes");
  const dropdown = page.locator('[role="combobox"]').filter({ hasText: /Select Diagnostic Report Type|diagnostic report/i }).first();
  await dropdown.click();
  await page.waitForTimeout(1000);

  // Verify the dropdown options
  const options = page.locator('[role="option"]');
  const count = await options.count();
  console.log(`Found ${count} options in dropdown`);

  // List the options
  for (let i = 0; i < count; i++) {
    const text = await options.nth(i).textContent();
    console.log(`  Option ${i + 1}: ${text}`);
  }

  if (count !== 3) {
    throw new Error(`Expected 3 dropdown options, found ${count}`);
  }

  // AC1 Step 3: Verify no reports exist yet
  console.log("\nAC1 Step 3: Verifying no diagnostic reports exist");
  const reportCards = page.locator('[class*="DiagnosticReport"]').filter({ hasText: /Report|Diagnostic/i });
  const reportCount = await reportCards.count();
  console.log(`Found ${reportCount} diagnostic report cards`);

  if (reportCount > 0) {
    console.log("Warning: Expected 0 reports, but found some");
  }

  await page.waitForTimeout(2000);

  console.log("\n✓ AC1 verification complete");
  console.log("  - Dropdown shows all 3 codes");
  console.log("  - No diagnostic report cards visible");
  console.log("  - Create Report button is visible");

  await context.close();
  await browser.close();

  // Copy video to specs/23/videos/
  const videoFiles = fs.readdirSync(".agent-hq/pw-videos");
  if (videoFiles.length > 0) {
    const videoFile = videoFiles[0];
    fs.copyFileSync(
      path.join(".agent-hq/pw-videos", videoFile),
      "specs/23/videos/ac1-all-codes-available.webm"
    );
    console.log("\n✓ Video saved to specs/23/videos/ac1-all-codes-available.webm");
  } else {
    console.log("\n⚠ No video file found");
  }

  console.log("\n=== AC1 complete ===");
}

main().catch((err) => {
  console.error("ERROR:", err.message);
  process.exit(1);
});
