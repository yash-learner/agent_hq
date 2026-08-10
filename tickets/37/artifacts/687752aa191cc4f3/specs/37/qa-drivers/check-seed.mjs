#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../../..");

// Read fixture IDs
const facilityId = JSON.parse(
  fs.readFileSync(path.join(rootDir, "tests/.auth/facilityMeta.json"), "utf-8")
).id;
const patientId = JSON.parse(
  fs.readFileSync(path.join(rootDir, "tests/.auth/patientMeta.json"), "utf-8")
).id;
const encounterId = JSON.parse(
  fs.readFileSync(path.join(rootDir, "tests/.auth/encounterMeta.json"), "utf-8")
).id;

// Get auth token
const authFile = path.join(rootDir, "tests/.auth/user.json");
const storageState = JSON.parse(fs.readFileSync(authFile, "utf-8"));
const localStorage = storageState.origins?.[0]?.localStorage ?? [];
const tokenEntry = localStorage.find(
  (item) => item.name === "care_access_token"
);
if (!tokenEntry) throw new Error("No access token in auth storage state");

const apiUrl = process.env.REACT_CARE_API_URL || "http://localhost:9000";
const headers = {
  Authorization: `Bearer ${tokenEntry.value}`,
  "Content-Type": "application/json",
};

console.log("Checking dispense orders for patient:", patientId);
console.log("Facility:", facilityId);
console.log("Encounter:", encounterId);

// Check existing dispense orders
const response = await fetch(
  `${apiUrl}/api/v1/facility/${facilityId}/order/dispense/?patient=${patientId}&limit=100`,
  { headers }
);

if (!response.ok) {
  console.error(
    `Failed to fetch dispense orders: ${response.status} ${response.statusText}`
  );
  const text = await response.text();
  console.error("Response:", text);
  process.exit(1);
}

const data = await response.json();
console.log(`Found ${data.count} existing dispense orders`);

if (data.count >= 15) {
  console.log("✓ Sufficient dispense orders exist for pagination testing");
  process.exit(0);
}

console.log(`Need to create ${15 - data.count} more dispense orders`);

// Get facility locations to use for dispense orders
const locationsResponse = await fetch(
  `${apiUrl}/api/v1/facility/${facilityId}/location/?limit=1`,
  { headers }
);

if (!locationsResponse.ok) {
  console.error(
    `Failed to fetch locations: ${locationsResponse.status} ${locationsResponse.statusText}`
  );
  process.exit(1);
}

const locationsData = await locationsResponse.json();
if (locationsData.count === 0) {
  console.error("No locations found in facility");
  process.exit(1);
}

const locationId = locationsData.results[0].id;
console.log("Using location:", locationId);

// Create dispense orders
const neededCount = 15 - data.count;
for (let i = 0; i < neededCount; i++) {
  const body = {
    patient: patientId,
    location: locationId,
    status: "completed",
    name: `QA Test Dispense Order ${Date.now()}-${i}`,
    note: `Created for QA pagination testing - ${new Date().toISOString()}`,
  };

  console.log(`Creating dispense order ${i + 1}/${neededCount}...`);

  const createResponse = await fetch(
    `${apiUrl}/api/v1/facility/${facilityId}/order/dispense/`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    }
  );

  if (!createResponse.ok) {
    console.error(
      `Failed to create dispense order: ${createResponse.status} ${createResponse.statusText}`
    );
    const errorText = await createResponse.text();
    console.error("Response:", errorText);
    // Continue with remaining creates
  } else {
    const created = await createResponse.json();
    console.log(`✓ Created dispense order: ${created.id}`);
  }
}

// Verify final count
const finalResponse = await fetch(
  `${apiUrl}/api/v1/facility/${facilityId}/order/dispense/?patient=${patientId}&limit=100`,
  { headers }
);

const finalData = await finalResponse.json();
console.log(`\n✓ Total dispense orders: ${finalData.count}`);
