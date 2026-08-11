// AC1: Users without can_create_encounter permission see no button in empty state
import { chromium } from "playwright";
import { openAuthedContext, readAccessToken } from "../../../.agent-hq/qa-auth.mjs";
import fs from "node:fs";

const FACILITY_ID = "afb2f504-7657-4647-b554-2218d119beb1";
const API_BASE = "http://localhost:9000";
const BASE_URL = "http://localhost:4001";

(async () => {
  const browser = await chromium.launch({ headless: false });
  
  // Step 1: Create a patient with zero encounters using admin token
  console.log("[AC1] Creating test patient with admin token...");
  const adminToken = readAccessToken("tests/.auth/user.json");
  const patientRes = await fetch(
    `${API_BASE}/api/v1/facility/${FACILITY_ID}/patient/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: `AC1 Test Patient ${Date.now()}`,
        phone_number: "+919876543210",
        date_of_birth: "1990-01-01",
        gender: "male",
        address: "Test Address",
        permanent_address: "Test Address",
        pincode: "123456",
        state: "Kerala",
        district: "Ernakulam",
        local_body: "Kochi",
        ward: "1",
      }),
    }
  );
  
  if (!patientRes.ok) {
    console.error("[AC1] Failed to create patient:", await patientRes.text());
    await browser.close();
    return;
  }
  
  const patient = await patientRes.json();
  console.log(`[AC1] Created patient ${patient.id}`);
  
  // Step 2: Login as nurse (lacks can_create_encounter)
  console.log("[AC1] Opening browser as nurse...");
  const { context, page } = await openAuthedContext(browser, {
    authFile: "tests/.auth/nurse.json",
    baseUrl: BASE_URL,
    facilityId: FACILITY_ID,
    credentials: { username: "care-nurse", password: "Ohcn@123" },
  });
  
  await page.screencast.showActions({ cursor: "pointer" });
  
  // Step 3: Navigate to patient
  console.log(`[AC1] Navigating to patient ${patient.id}...`);
  await page.goto(`${BASE_URL}/facility/${FACILITY_ID}/patient/${patient.id}`);
  await page.waitForLoadState("networkidle");
  
  // Step 4: Click Encounters tab
  console.log("[AC1] Clicking Encounters tab...");
  const encountersTab = page.getByRole("link", { name: /Encounters/i });
  await encountersTab.click();
  await page.waitForLoadState("networkidle");
  
  // Step 5: Verify empty state has NO "Create Encounter" button
  console.log("[AC1] Verifying no Create Encounter button...");
  const emptyState = page.locator("text=No active encounters found");
  await emptyState.waitFor({ state: "visible", timeout: 5000 });
  
  const createButton = page.getByRole("button", { name: /Create Encounter/i });
  const buttonVisible = await createButton.isVisible().catch(() => false);
  
  if (buttonVisible) {
    console.error("[AC1] FAIL: Create Encounter button is visible for nurse!");
  } else {
    console.log("[AC1] PASS: Create Encounter button is NOT visible for nurse");
  }
  
  await context.close();
  await browser.close();
})();
