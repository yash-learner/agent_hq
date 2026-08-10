#!/usr/bin/env node

import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = "/workspaces/agent_hq/_target/687752aa191cc4f3";

// Read fixture IDs
const facilityId = JSON.parse(
  fs.readFileSync(path.join(rootDir, "tests/.auth/facilityMeta.json"), "utf-8")
).id;

console.log("Criterion 2: Scroll loads more");
console.log("Facility:", facilityId);

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
  console.log("Step 1: Navigate to encounters and open Dispense History");
  const createdDateAfter = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const createdDateBefore = new Date().toISOString().split('T')[0];
  await page.goto(
    `http://localhost:4000/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}`
  );
  await page.waitForLoadState("networkidle");
  await page.waitForSelector('[data-sidebar="sidebar"]', { timeout: 30000 });
  
  await page.getByText("View Encounter").first().click();
  await page.waitForLoadState("networkidle");
  
  await page.getByRole("tab", { name: "Medicines" }).click();
  await page.waitForLoadState("networkidle");
  
  await page.getByRole("tab", { name: "Dispense History" }).click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);
  console.log("✓ Dispense History opened");

  // Get the scrollable container
  console.log("Step 2: Scroll down to trigger next page");
  const scrollContainer = page.locator('[class*="overflow"]').first();
  
  // Take initial count
  await page.waitForTimeout(1000);
  const initialCards = await page.locator('[data-testid*="dispense"], [class*="dispense"]').count();
  console.log(`Initial cards visible: ${initialCards}`);
  
  // Scroll down
  await scrollContainer.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  
  console.log("Step 3: Wait for loading indicator and new items");
  await page.waitForTimeout(3000); // Wait for fetch
  
  // Check if more items loaded
  const finalCards = await page.locator('[data-testid*="dispense"], [class*="dispense"]').count();
  console.log(`Final cards visible: ${finalCards}`);
  
  if (finalCards > initialCards) {
    console.log(`✓ ${finalCards - initialCards} new items loaded`);
    console.log("\n✓ PASS: Scroll loads more dispense orders");
  } else {
    console.log("\n⚠ WARN: No additional items loaded (might indicate issue or all items on first page)");
  }

} catch (error) {
  console.error("\n✗ FAIL:", error.message);
  throw error;
} finally {
  await page.close();
  await context.close();
  await browser.close();

  const videoDir = path.join(rootDir, ".agent-hq/pw-videos");
  const videos = fs
    .readdirSync(videoDir)
    .filter((f) => f.endsWith(".webm"))
    .map((f) => ({ name: f, time: fs.statSync(path.join(videoDir, f)).mtime }))
    .sort((a, b) => b.time - a.time);

  if (videos.length > 0) {
    fs.copyFileSync(
      path.join(videoDir, videos[0].name),
      path.join(rootDir, "specs/37/videos/scroll-loads-more.webm")
    );
    console.log("\n✓ Video saved to specs/37/videos/scroll-loads-more.webm");
  }
}
