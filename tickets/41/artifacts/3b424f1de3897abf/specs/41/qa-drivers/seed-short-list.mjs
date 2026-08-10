#!/usr/bin/env node

import fs from "fs";
import path from "path";

const FACILITY_ID = "0d73ab28-31ca-48cb-8c3f-a91552600be7";
const PATIENT_ID = "f8dcfab4-5471-4c51-bf03-f51deefd2650";
const API_URL = "http://localhost:9000";

function getApiHeaders() {
  const authFile = path.resolve("tests/.auth/user.json");
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

async function createEncounter() {
  console.log("🏥 Creating a new encounter for short list test...");
  const headers = getApiHeaders();

  // Create encounter via API
  const response = await fetch(
    `${API_URL}/api/v1/facility/${FACILITY_ID}/encounter/`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        patient: PATIENT_ID,
        encounter_class: "inpatient",
        status: "in-progress",
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create encounter: ${response.status} - ${error}`);
  }

  const encounter = await response.json();
  console.log(`✅ Created encounter: ${encounter.id}`);
  return encounter.id;
}

async function getLocation() {
  console.log("🔍 Fetching facility locations...");
  const headers = getApiHeaders();
  const response = await fetch(
    `${API_URL}/api/v1/facility/${FACILITY_ID}/location/`,
    { headers }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch locations: ${response.status}`);
  }

  const data = await response.json();
  if (!data.results || data.results.length === 0) {
    throw new Error("No locations found for facility");
  }

  const locationId = data.results[0].id;
  console.log(`✅ Using location: ${locationId}`);
  return locationId;
}

async function createDispenseOrder(locationId, index) {
  const headers = getApiHeaders();
  const body = {
    patient: PATIENT_ID,
    location: locationId,
    status: "completed",
  };

  const response = await fetch(
    `${API_URL}/api/v1/facility/${FACILITY_ID}/order/dispense/`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `Failed to create dispense order ${index}: ${response.status} - ${error}`
    );
  }

  const data = await response.json();
  console.log(`✅ Created dispense order ${index} (ID: ${data.id})`);
  return data;
}

async function main() {
  try {
    console.log("🚀 Creating short list test data");

    const encounterId = await createEncounter();
    const locationId = await getLocation();

    // Create only 5 dispense orders (well below page size of 14)
    for (let i = 1; i <= 5; i++) {
      await createDispenseOrder(locationId, i);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(`🎉 Successfully created encounter ${encounterId} with 5 dispense orders`);
    
    // Save encounter ID for the test driver
    const metaPath = path.resolve(".agent-hq/short-list-encounter.json");
    fs.writeFileSync(metaPath, JSON.stringify({ id: encounterId }, null, 2));
    console.log(`📝 Saved encounter ID to ${metaPath}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
