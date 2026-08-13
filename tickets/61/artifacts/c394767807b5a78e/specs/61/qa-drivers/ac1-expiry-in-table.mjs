#!/usr/bin/env node
/**
 * AC1: Display expiry date in saved delivery table
 * Drives the live app to verify expiry date column appears after saving items.
 */

import { chromium } from "playwright";
import { openAuthedContext } from "../../../.agent-hq/qa-auth.mjs";
import fs from "node:fs";

const LOG_FILE = "specs/61/qa-logs/ac1-expiry-in-table.log";

function log(message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, line);
  console.log(message);
}

async function main() {
  log("=== AC1: Display expiry date in saved delivery table ===");
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  try {
    log("Opening authenticated context...");
    const { context, page, size } = await openAuthedContext(browser, {
      videoDir: ".agent-hq/pw-videos",
      baseUrl: "http://127.0.0.1:4000",
      apiBase: "http://127.0.0.1:9000",
    });
    
    await page.screencast.showActions({ cursor: "pointer" });
    log("Screencast actions enabled");
    
    // Step 1: Navigate to services page
    const facilityId = JSON.parse(
      fs.readFileSync("tests/.auth/facilityMeta.json", "utf-8")
    ).id;
    log(`Using facilityId: ${facilityId}`);
    
    const servicesUrl = `http://127.0.0.1:4000/facility/${facilityId}/services/`;
    log(`Step 1: Navigate to ${servicesUrl}`);
    await page.goto(servicesUrl);
    await page.waitForLoadState("networkidle");
    log("Services page loaded");
    
    // Step 2: Click Main Pharmacy link
    log("Step 2: Click Main Pharmacy link");
    await page.getByRole("link", { name: /Main Pharmacy/i }).click();
    await page.waitForLoadState("networkidle");
    log("Main Pharmacy page loaded");
    
    // Step 3: Click Pharmacy sublocation link
    log("Step 3: Click Pharmacy sublocation link");
    await page.getByRole("link", { name: /^Pharmacy$/i }).click();
    await page.waitForLoadState("networkidle");
    log("Pharmacy location dashboard loaded");
    
    // Step 4: Navigate to External Supply tab
    log("Step 4: Click External Supply tab");
    const externalSupplyTab = page.getByRole("tab", { name: /External Supply/i });
    if (await externalSupplyTab.isVisible()) {
      await externalSupplyTab.click();
    } else {
      // Try direct navigation
      const locationId = page.url().match(/locations\/([^/]+)/)?.[1];
      await page.goto(`http://127.0.0.1:4000/facility/${facilityId}/locations/${locationId}/inventory/external`);
    }
    await page.waitForLoadState("networkidle");
    log("External Supply page loaded");
    
    // Step 5: Click Raise Purchase Order button
    log("Step 5: Click Raise Purchase Order button");
    await page.getByRole("button", { name: /Raise Purchase Order/i }).click();
    await page.waitForSelector('[role="dialog"]', { state: "visible" });
    log("Purchase order dialog opened");
    
    // Step 6: Fill in order details
    log("Step 6: Fill in order name and select supplier");
    const timestamp = Date.now();
    const orderName = `QA-PO-61-${timestamp}`;
    await page.getByLabel(/Order Name/i).fill(orderName);
    log(`Order name: ${orderName}`);
    
    // Select supplier (assuming first option)
    await page.getByLabel(/Supplier/i).click();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    log("Supplier selected");
    
    await page.getByRole("button", { name: /^Create$/i }).click();
    await page.waitForLoadState("networkidle");
    log("Purchase order created");
    
    // Step 7: Click Create Delivery Order button
    log("Step 7: Click Create Delivery Order button");
    await page.getByRole("button", { name: /Create Delivery Order/i }).click();
    await page.waitForLoadState("networkidle");
    log("Delivery order form opened");
    
    // Step 8: Select product type and product
    log("Step 8: Select Medication and Paracetamol");
    // Find the first row in the form
    const productTypeSelect = page.locator('select, [role="combobox"]').first();
    await productTypeSelect.click();
    await page.getByText(/^Medication$/i).click();
    log("Product type: Medication selected");
    
    // Wait a moment for product knowledge dropdown to become available
    await page.waitForTimeout(1000);
    
    const productSelect = page.locator('input[placeholder*="Select"]').first();
    await productSelect.fill("Paracetamol");
    await page.waitForTimeout(500);
    await page.getByText(/^Paracetamol/i).click();
    log("Product: Paracetamol selected");
    
    // Step 9: Fill in batch, expiry date, and quantities
    log("Step 9: Fill in batch number, expiry date, and quantities");
    const batchNumber = `BATCH-QA-61`;
    await page.getByLabel(/Batch/i).fill(batchNumber);
    log(`Batch number: ${batchNumber}`);
    
    // Fill expiry date (2027-01-01 for January 1, 2027)
    const expiryDate = "2027-01-01";
    await page.getByLabel(/Expiry Date/i).fill(expiryDate);
    log(`Expiry date: ${expiryDate}`);
    
    await page.getByLabel(/^Quantity$/i).fill("10");
    await page.getByLabel(/Pack Size/i).fill("10");
    await page.getByLabel(/Pack Quantity/i).fill("1");
    log("Quantities filled: quantity=10, pack_size=10, pack_quantity=1");
    
    // Step 10: Click Save List button
    log("Step 10: Click Save List button");
    await page.getByRole("button", { name: /Save List/i }).click();
    await page.waitForTimeout(2000); // Wait for save to complete
    log("Item saved to delivery table");
    
    // Step 11: Inspect the delivery table for expiry date column
    log("Step 11: Inspect delivery table for expiry date column");
    
    // Look for expiry date column header
    const expiryHeader = page.getByRole("columnheader", { name: /Expiry Date/i });
    const headerExists = await expiryHeader.isVisible();
    log(`Expiry Date column header visible: ${headerExists}`);
    
    // Look for the expiry date value in the table
    // The date should be formatted as dd/MM/yyyy (01/01/2027)
    const expiryCell = page.getByText(/01\/01\/2027/);
    const cellExists = await expiryCell.isVisible();
    log(`Expiry date cell with "01/01/2027" visible: ${cellExists}`);
    
    if (headerExists && cellExists) {
      log("✓ AC1 PASSED: Expiry date column is visible with correct date format");
    } else {
      log("✗ AC1 FAILED: Expiry date column or date value not found");
      log(`  - Header visible: ${headerExists}`);
      log(`  - Cell visible: ${cellExists}`);
    }
    
    // Take a screenshot for evidence
    await page.screenshot({ path: "specs/61/screenshots/ac1-table-view.png" });
    log("Screenshot saved");
    
    await context.close();
    log("Context closed");
    
  } catch (error) {
    log(`ERROR: ${error.message}`);
    log(error.stack);
    throw error;
  } finally {
    await browser.close();
    log("Browser closed");
  }
}

main().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
