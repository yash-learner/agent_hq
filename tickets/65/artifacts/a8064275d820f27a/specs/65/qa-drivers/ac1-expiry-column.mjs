import { chromium } from "playwright";
import fs from "fs";

const facilityId = "cc3a0e34-412c-4ac4-9009-756cceec6cca";
const SIZE = { width: 1440, height: 900 };

async function main() {
  const browser = await chromium.launch({ headless: true });
  
  try {
    const context = await browser.newContext({
      storageState: "tests/.auth/user.json",
      viewport: SIZE,
      recordVideo: { dir: ".agent-hq/pw-videos", size: SIZE },
    });
    
    const page = await context.newPage();
    await page.screencast.showActions({ cursor: "pointer" });
    
    console.log("[AC1] Starting - expiry date displays in dedicated column after batch");
    
    // Navigate to services page
    await page.goto(`http://localhost:4000/facility/${facilityId}/services/`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    console.log("[AC1] Loaded services page");
    
    // Navigate to Main Pharmacy → Pharmacy location
    await page.getByRole("link", { name: /Main Pharmacy/ }).click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    console.log("[AC1] Clicked Main Pharmacy service");
    
    // Now click on Pharmacy location link
    await page.getByRole("link", { name: /^Pharmacy/ }).click();
    await page.waitForURL(/\/locations\/([a-f0-9-]+)/);
    const pharmacyLocationId = page.url().match(/\/locations\/([a-f0-9-]+)/)?.[1];
    console.log(`[AC1] Pharmacy locationId: ${pharmacyLocationId}`);
    
    // Navigate to Pathology Lab → Bio-Chemistry location
    await page.goto(`http://localhost:4000/facility/${facilityId}/services/`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await page.getByRole("link", { name: /Pathology Lab/ }).click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    console.log("[AC1] Clicked Pathology Lab service");
    
    await page.getByRole("link", { name: /^Bio-Chemistry/ }).click();
    await page.waitForURL(/\/locations\/([a-f0-9-]+)/);
    const bioChemLocationId = page.url().match(/\/locations\/([a-f0-9-]+)/)?.[1];
    console.log(`[AC1] Bio-Chemistry locationId: ${bioChemLocationId}`);
    
    // Navigate to Internal Receive
    await page.goto(`http://localhost:4000/facility/${facilityId}/locations/${bioChemLocationId}/inventory/internal/receive`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    console.log("[AC1] On Internal Receive page");
    
    // Create Stock Request
    await page.getByRole("button", { name: /Raise Stock Request/i }).click();
    await page.waitForTimeout(2000);
    
    const requestName = `QA Stock ${Date.now()}`;
    await page.getByPlaceholder(/Name of the request/i).fill(requestName);
    console.log(`[AC1] Request name: ${requestName}`);
    
    // Select Pharmacy location
    await page.getByRole("combobox").filter({ hasText: /Select Location/i }).click();
    await page.waitForTimeout(1000);
    await page.getByRole("option", { name: /Pharmacy/i }).first().click();
    await page.waitForTimeout(500);
    
    // Select Priority
    await page.getByRole("combobox").filter({ hasText: /Priority/i }).click();
    await page.waitForTimeout(1000);
    await page.getByRole("option", { name: /Urgent/i }).first().click();
    await page.waitForTimeout(500);
    
    // Create request
    await page.getByRole("button", { name: /^Create$/i }).click();
    await page.waitForURL(/\/stock_request\//);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    console.log("[AC1] Stock request created");
    
    // Add Paracetamol
    await page.getByRole("combobox").filter({ hasText: /Add Item/i }).click();
    await page.waitForTimeout(1000);
    await page.getByRole("option", { name: /^Medication$/i }).first().click();
    await page.waitForTimeout(1000);
    await page.getByRole("option", { name: /Paracetamol/i }).first().click();
    await page.waitForTimeout(1000);
    await page.getByPlaceholder(/Quantity/i).fill("5");
    await page.getByRole("button", { name: /Save List/i }).click();
    await page.waitForTimeout(3000);
    console.log("[AC1] Added Paracetamol");
    
    // Approve request
    await page.getByRole("button", { name: /Mark as Approved/i }).click();
    await page.waitForTimeout(3000);
    console.log("[AC1] Request approved");
    
    // Go to Pharmacy Dispatch
    await page.goto(`http://localhost:4000/facility/${facilityId}/locations/${pharmacyLocationId}/inventory/internal/dispatch`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    
    // Find and open the request
    await page.locator(`tr:has-text("${requestName}")`).getByRole("link", { name: /See Details/i }).click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    
    // Create Delivery Order
    await page.getByRole("link", { name: /Create Delivery Order/i }).click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await page.getByRole("button", { name: /^Create$/i }).click();
    await page.waitForTimeout(3000);
    console.log("[AC1] Delivery order created");
    
    // Load from order
    await page.getByRole("button", { name: /Load from order/i }).click();
    await page.waitForTimeout(2000);
    await page.getByRole("button", { name: /Done/i }).click();
    await page.waitForTimeout(3000);
    
    // Select stock
    await page.getByRole("button", { name: /Select stock/i }).first().click();
    await page.waitForTimeout(2000);
    await page.getByRole("option", { name: /₹/ }).first().click();
    await page.waitForTimeout(1000);
    
    // Enter expiry date
    await page.getByLabel(/Expiry Date/i).first().fill("2026-12-31");
    console.log("[AC1] Entered expiry: 2026-12-31");
    await page.waitForTimeout(1000);
    
    // Save delivery items
    await page.getByRole("button", { name: /^Save$/i }).click();
    await page.waitForTimeout(4000);
    console.log("[AC1] Saved delivery items");
    
    // Verify table
    const headerVisible = await page.getByRole("columnheader", { name: /Expiry Date/i }).isVisible();
    const cellVisible = await page.getByText("31/12/2026").isVisible();
    const batchVisible = await page.getByRole("columnheader", { name: /Batch/i }).isVisible();
    
    console.log(`[AC1] Expiry Date header: ${headerVisible}`);
    console.log(`[AC1] Date cell (31/12/2026): ${cellVisible}`);
    console.log(`[AC1] Batch header: ${batchVisible}`);
    
    // Screenshot
    await page.screenshot({ path: "specs/65/screenshots/ac1-expiry-column.png", fullPage: true });
    console.log("[AC1] Screenshot saved");
    
    if (headerVisible && cellVisible && batchVisible) {
      console.log("[AC1] PASS - Expiry date column visible with correct format");
    } else {
      console.log("[AC1] FAIL - Missing expected elements");
    }
    
    await page.waitForTimeout(2000);
    const videoPath = await page.video().path();
    await context.close();
    await new Promise(r => setTimeout(r, 2000));
    
    if (fs.existsSync(videoPath)) {
      fs.copyFileSync(videoPath, "specs/65/videos/ac1-expiry-column.webm");
      console.log("[AC1] Video saved");
    }
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
