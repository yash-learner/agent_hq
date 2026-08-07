import fs from "fs";
import path from "path";

const authFile = path.resolve("tests/.auth/user.json");
const seedFile = path.resolve(".agent-hq/multiple-diagnostic-seed.json");

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

async function requireOk(response, label) {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${label} failed: ${response.status} ${text}`);
  }
}

async function main() {
  console.log("=== Creating fresh SR for AC2-AC4 ===\n");

  // Load existing seed data
  const seed = JSON.parse(fs.readFileSync(seedFile, "utf-8"));
  
  const baseUrl = getApiUrl();
  const headers = getApiHeaders();

  // Get current user ID
  console.log("Fetching current user...");
  const userResponse = await fetch(`${baseUrl}/api/v1/users/getcurrentuser/`, {
    headers,
  });
  await requireOk(userResponse, "get current user");
  const currentUser = await userResponse.json();
  const requesterId = currentUser.id;
  console.log(`Requester ID: ${requesterId}\n`);

  // Create a new Service Request using the same Activity Definition
  console.log("Creating new Service Request for AC2-AC4 flow...");
  
  const procedureCode = {
    system: "http://snomed.info/sct",
    code: "15220000",
    display: "Laboratory test",
  };
  
  const unique = Date.now();
  const title = `QA Multi Diagnostic Reports AC2-4 ${unique}`;
  
  const srBody = {
    encounter: seed.encounterId,
    activity_definition: seed.activityDefinitionSlug,
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
    `${baseUrl}/api/v1/facility/${seed.facilityId}/service_request/apply_activity_definition/`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(srBody),
    }
  );

  await requireOk(srResponse, "create Service Request from AD");
  const serviceRequest = await srResponse.json();
  console.log(`Service Request created: ${serviceRequest.id}`);

  // Update seed file with new SR
  const newSeed = {
    ...seed,
    serviceRequestId_AC2_4: serviceRequest.id,
    title_AC2_4: title,
  };
  
  fs.writeFileSync(
    seedFile,
    JSON.stringify(newSeed, null, 2)
  );

  console.log("\n✓ Fresh SR created for AC2-AC4");
  console.log(`SR ID: ${serviceRequest.id}`);
}

main().catch((err) => {
  console.error("ERROR:", err.message);
  process.exit(1);
});
