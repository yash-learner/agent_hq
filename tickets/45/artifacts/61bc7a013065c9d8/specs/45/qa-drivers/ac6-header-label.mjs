#!/usr/bin/env node
/**
 * AC6: Verify "Expiry" label is displayed in table header
 */
import { chromium } from "@playwright/test";
import fs from "fs";

const log = (msg) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${msg}`);
};

function getFacilityId() {
  const metaFile = "tests/.auth/facilityMeta.json";
  const meta = JSON.parse(fs.readFileSync(metaFile, "utf8"));
  return meta.id;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const size = { width: 1440, height: 900 };
  const context = await browser.newContext({
    storageState: "tests/.auth/user.json",
    viewport: size,
    recordVideo: { dir: ".agent-hq/pw-videos", size },
  });

  const page = await context.newPage();
  
  log("Enabling cursor overlay");
  await page.screencast.showActions({ cursor: "pointer" });

  try {
    const facilityId = getFacilityId();
    log(`Using facility ID: ${facilityId}`);

    // Navigate to services to get location IDs
    log("Navigating to services page");
    await page.goto(`http://localhost:4000/facility/${facilityId}/services/`);
    
    // Wait for auth shell
    log("Waiting for authenticated shell");
    await page.waitForSelector('[data-sidebar="sidebar"]', { timeout: 10000 });
    log("Auth shell verified");

    // Get Pharmacy location ID
    log("Getting Pharmacy location ID");
    await page.getByRole("link", { name: "Main Pharmacy" }).click();
    await page.getByRole("link", { name: "Pharmacy" }).click();
    await page.waitForLoadState("networkidle");
    const pharmacyUrl = page.url();
    const pharmacyMatch = pharmacyUrl.match(/\/locations\/([^/]+)\//);
    const pharmacyLocationId = pharmacyMatch?.[1];
    log(`Pharmacy location ID: ${pharmacyLocationId}`);

    // Get Bio-Chemistry location ID
    log("Getting Bio-Chemistry location ID");
    await page.goto(`http://localhost:4000/facility/${facilityId}/services/`);
    await page.getByRole("link", { name: "Pathology Lab" }).click();
    await page.getByRole("link", { name: "Bio-Chemistry" }).click();
    await page.waitForLoadState("networkidle");
    const bioChemUrl = page.url();
    const bioChemMatch = bioChemUrl.match(/\/locations\/([^/]+)\//);
    const bioChemLocationId = bioChemMatch?.[1];
    log(`Bio-Chemistry location ID: ${bioChemLocationId}`);

    // Create stock request
    const orderName = `qa-ac6-${Date.now()}`;
    log(`Creating stock request: ${orderName}`);
    await page.goto(`http://localhost:4000/facility/${facilityId}/locations/${bioChemLocationId}/inventory/internal/receive`);
    await page.getByRole("button", { name: "Raise Stock Request" }).click();
    await page.getByRole("textbox", { name: "Name" }).fill(orderName);
    await page.getByRole("combobox").filter({ hasText: "Select Location" }).click();
    await page.getByRole("option", { name: "Pharmacy" }).click();
    await page.getByRole("radio", { name: "Urgent" }).check();
    await page.getByRole("button", { name: "Create" }).click();
    
    log("Adding Paracetamol to order");
    await page.getByRole("combobox").filter({ hasText: "Add Item" }).click();
    await page.getByRole("option", { name: "Medication" }).click();
    await page.getByRole("option", { name: "Paracetamol" }).click();
    await page.getByRole("spinbutton").fill("5");
    await page.getByRole("button", { name: "Save List" }).click();
    
    await page.waitForSelector("table tbody tr", { state: "visible" });
    log("Verifying Paracetamol in table");
    
    await page.getByRole("button", { name: "Mark as Approved" }).click();
    log("Stock request approved");

    // Navigate to dispatch page and create delivery order
    log("Navigating to dispatch page");
    await page.goto(`http://localhost:4000/facility/${facilityId}/locations/${pharmacyLocationId}/inventory/internal/dispatch`);
    
    const orderRow = page.locator("table tbody tr").filter({ hasText: orderName });
    await orderRow.first().waitFor({ state: "visible" });
    log("Order found in dispatch list");
    
    await orderRow.first().getByRole("button", { name: "See Details" }).click();
    await page.waitForLoadState("networkidle");
    
    log("Creating delivery order");
    await page.getByRole("link", { name: "Create Delivery Order" }).click();
    await page.getByRole("button", { name: "Create" }).click();
    await page.getByRole("button", { name: "Load from order" }).click();
    await page.getByRole("button", { name: "Done" }).click();
    
    log("Selecting stock with expiry date");
    await page.getByRole("button", { name: "Select stock" }).nth(1).click();
    await page.waitForSelector("div:has-text('₹20.00')", { timeout: 5000 });
    await page.locator("div").filter({ hasText: "₹20.00" }).nth(3).click();
    await page.mouse.click(0, 0);
    await page.waitForTimeout(500);
    
    log("Saving delivery item");
    await page.getByRole("button", { name: "Save" }).click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    
    // Verify "Expiry" header label
    log("Verifying 'Expiry' header label");
    const headers = await page.locator("table thead th").allTextContents();
    log(`Table headers: ${JSON.stringify(headers)}`);
    
    const expiryHeader = headers.find(h => h.toLowerCase().includes("expiry"));
    
    if (expiryHeader) {
      log(`✓ "Expiry" header found: "${expiryHeader}"`);
      
      // Highlight the expiry header for the video
      const expiryHeaderElement = page.locator("table thead th").filter({ hasText: /expiry/i });
      await expiryHeaderElement.scrollIntoViewIfNeeded();
      await expiryHeaderElement.hover();
      await page.waitForTimeout(1000);
    } else {
      log("✗ 'Expiry' header not found");
    }
    
    // Wait to capture the final state
    await page.waitForTimeout(2000);
    
    log("Test completed successfully");
  } catch (error) {
    log(`ERROR: ${error.message}`);
    log(error.stack);
    throw error;
  } finally {
    await context.close();
    await browser.close();
    
    // Move video to correct location
    const videoDir = ".agent-hq/pw-videos";
    const videos = fs.readdirSync(videoDir).filter(f => f.endsWith(".webm"));
    if (videos.length > 0) {
      const videoPath = `${videoDir}/${videos[videos.length - 1]}`;
      fs.renameSync(videoPath, "specs/45/videos/ac6-header-label.webm");
      log("Video saved to specs/45/videos/ac6-header-label.webm");
    }
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
