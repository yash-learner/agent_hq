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

async function refreshToken() {
  console.log("🔄 Attempting token refresh...");
  const authFile = path.resolve("tests/.auth/user.json");
  const storageState = JSON.parse(fs.readFileSync(authFile, "utf-8"));
  const localStorage = storageState.origins?.[0]?.localStorage ?? [];
  const refreshTokenEntry = localStorage.find(
    (item) => item.name === "care_refresh_token"
  );

  if (!refreshTokenEntry) {
    console.error("❌ No refresh token found");
    return false;
  }

  try {
    const response = await fetch(`${API_URL}/api/v1/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshTokenEntry.value }),
    });

    if (!response.ok) {
      console.error(`❌ Refresh failed: ${response.status}`);
      return false;
    }

    const data = await response.json();
    
    // Update storage state with new tokens
    const accessIdx = localStorage.findIndex(
      (item) => item.name === "care_access_token"
    );
    const refreshIdx = localStorage.findIndex(
      (item) => item.name === "care_refresh_token"
    );

    if (accessIdx >= 0) localStorage[accessIdx].value = data.access;
    if (refreshIdx >= 0) localStorage[refreshIdx].value = data.refresh;

    fs.writeFileSync(authFile, JSON.stringify(storageState, null, 2));
    console.log("✅ Token refreshed successfully");
    return true;
  } catch (error) {
    console.error(`❌ Refresh error: ${error.message}`);
    return false;
  }
}

async function getLocation() {
  console.log("🔍 Fetching facility locations...");
  const headers = getApiHeaders();
  const response = await fetch(
    `${API_URL}/api/v1/facility/${FACILITY_ID}/location/`,
    { headers }
  );

  if (response.status === 401) {
    console.log("⚠️ Token expired, refreshing...");
    const refreshed = await refreshToken();
    if (refreshed) {
      return getLocation(); // Retry with new token
    }
    throw new Error("Failed to refresh token");
  }

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

async function getExistingDispenseOrders() {
  console.log("🔍 Checking existing dispense orders...");
  const headers = getApiHeaders();
  const response = await fetch(
    `${API_URL}/api/v1/facility/${FACILITY_ID}/order/dispense/?limit=100`,
    { headers }
  );

  if (response.status === 401) {
    console.log("⚠️ Token expired, refreshing...");
    const refreshed = await refreshToken();
    if (refreshed) {
      return getExistingDispenseOrders();
    }
    throw new Error("Failed to refresh token");
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch dispense orders: ${response.status}`
    );
  }

  const data = await response.json();
  console.log(`📦 Found ${data.count} existing dispense orders`);
  return data.count;
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

  if (response.status === 401) {
    console.log("⚠️ Token expired during create, refreshing...");
    const refreshed = await refreshToken();
    if (refreshed) {
      return createDispenseOrder(locationId, index);
    }
    throw new Error("Failed to refresh token");
  }

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
    console.log("🚀 Starting dispense order seed script");
    console.log(`📍 Facility: ${FACILITY_ID}`);
    console.log(`🧑 Patient: ${PATIENT_ID}`);

    const existingCount = await getExistingDispenseOrders();
    const targetCount = 25;
    const needed = Math.max(0, targetCount - existingCount);

    if (needed === 0) {
      console.log(`✅ Already have ${existingCount} dispense orders (>= ${targetCount})`);
      return;
    }

    console.log(`📝 Need to create ${needed} more dispense orders to reach ${targetCount}`);

    const locationId = await getLocation();

    for (let i = 0; i < needed; i++) {
      await createDispenseOrder(locationId, existingCount + i + 1);
      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(`🎉 Successfully created ${needed} dispense orders`);
    const finalCount = await getExistingDispenseOrders();
    console.log(`📊 Total dispense orders: ${finalCount}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
