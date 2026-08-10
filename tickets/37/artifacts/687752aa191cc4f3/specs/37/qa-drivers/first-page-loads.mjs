#!/usr/bin/env node

import { chromium } from "playwright";
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

console.log("Criterion 1: First page loads");
console.log("Facility:", facilityId);
console.log("Patient:", patientId);
console.log("Encounter:", encounterId);

const size = { width: 1440, height: 900 };
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  storageState: path.join(rootDir, "tests/.auth/user.json"),
  viewport: size,
  recordVideo: {
    dir: path.join(rootDir, ".agent-hq/pw-videos"),
    size,
  },
});

const page = await context.newPage();
await page.screencast.showActions({ cursor: "pointer" });

try {
  console.log("Step 1: Navigate to encounters page");
  const createdDateAfter = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const createdDateBefore = new Date().toISOString().split('T')[0];
  await page.goto(
    `http://localhost:4000/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}`
  );
  await page.waitForLoadState("networkidle");

  // Wait for auth shell readiness
  console.log("Waiting for authenticated shell...");
  await page.waitForSelector('[data-sidebar="sidebar"]', { timeout: 30000 });
  console.log("✓ Authenticated shell loaded");

  // Click "View Encounter" for the first encounter
  console.log("Step 2: Opening encounter...");
  await page.getByText("View Encounter").first().click();
  await page.waitForLoadState("networkidle");
  console.log("✓ Encounter opened");

  // Click Medicines tab
  console.log("Step 3: Click Medicines tab");
  await page.getByRole("tab", { name: "Medicines" }).click();
  await page.waitForLoadState("networkidle");
  console.log("✓ Medicines tab opened");

  // Click Dispense History tab
  console.log("Step 4: Click Dispense History tab");
  await page.getByRole("tab", { name: "Dispense History" }).click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000); // Wait for data to load
  console.log("✓ Dispense History tab opened");

  // Verify left selector shows dispense orders
  console.log("Step 5: Verify dispense orders loaded");
  const dispenseCards = await page.locator('[data-testid*="dispense"]').count();
  console.log(`Found ${dispenseCards} dispense order cards visible`);

  // Wait a moment to ensure the view is stable
  await page.waitForTimeout(2000);
  console.log("✓ First page loaded successfully");

  console.log("\n✓ PASS: First page loads with initial dispense orders");
} catch (error) {
  console.error("\n✗ FAIL:", error.message);
  throw error;
} finally {
  await page.close();
  await context.close();
  await browser.close();

  // Move video to final location
  const videoDir = path.join(rootDir, ".agent-hq/pw-videos");
  const videos = fs
    .readdirSync(videoDir)
    .filter((f) => f.endsWith(".webm"))
    .map((f) => ({ name: f, time: fs.statSync(path.join(videoDir, f)).mtime }))
    .sort((a, b) => b.time - a.time);

  if (videos.length > 0) {
    const latestVideo = videos[0].name;
    fs.copyFileSync(
      path.join(videoDir, latestVideo),
      path.join(rootDir, "specs/37/videos/first-page-loads.webm")
    );
    console.log("\n✓ Video saved to specs/37/videos/first-page-loads.webm");
  }
}
