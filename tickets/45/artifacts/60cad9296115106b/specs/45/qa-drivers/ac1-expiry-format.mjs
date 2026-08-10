#!/usr/bin/env node

/**
 * QA Driver: AC1 - Display expiry date in dd/MM/yyyy format for saved items with expiry date
 * 
 * This driver creates an internal delivery order with a product that has an expiry date,
 * then verifies that the expiry date is displayed in the table in dd/MM/yyyy format.
 */

import { chromium } from "@playwright/test";
import fs from "fs";

const facilityId = "7508e00b-837f-47b2-a359-b693b8f85273";
const size = { width: 1440, height: 900 };

async function runTest() {
  console.log("=== AC1: Display expiry date in dd/MM/yyyy format ===");
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Facility ID: ${facilityId}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: "tests/.auth/user.json",
    viewport: size,
    recordVideo: { dir: ".agent-hq/pw-videos", size },
  });

  const page = await context.newPage();

  try {
    // Enable cursor overlay for video
    await page.screencast.showActions({ cursor: "pointer" });
    console.log("✓ Cursor overlay enabled");

    // Navigate to services page
    console.log("\nStep: Navigate to facility services");
    await page.goto(`http://localhost:4000/facility/${facilityId}/services/`);
    await page.waitForLoadState("networkidle");
    
    // Wait for auth shell readiness
    console.log("Step: Verify auth shell");
    await page.waitForSelector('[data-sidebar="sidebar"]', { timeout: 10000 });
    console.log("✓ Authenticated shell verified");

    // Navigate to Main Pharmacy service
    console.log("\nStep: Click Main Pharmacy");
    await page.getByRole("link", { name: "Main Pharmacy" }).click();
    await page.waitForLoadState("networkidle");

    // Click on Pharmacy location link
    console.log("Step: Click Pharmacy location");
    await page.getByRole("link", { name: "Pharmacy" }).first().click();
    await page.waitForLoadState("networkidle");

    // Extract pharmacy location ID from URL
    const pharmacyUrl = page.url();
    const pharmacyMatch = pharmacyUrl.match(/\/locations\/([a-f0-9-]+)/);
    if (!pharmacyMatch) {
      throw new Error("Could not extract pharmacy location ID from URL");
    }
    const pharmacyLocationId = pharmacyMatch[1];
    console.log(`✓ Pharmacy Location ID: ${pharmacyLocationId}`);

    // Navigate back to services
    console.log("\nStep: Navigate back to services");
    await page.goto(`http://localhost:4000/facility/${facilityId}/services/`);
    await page.waitForLoadState("networkidle");

    // Navigate to Pathology Lab service
    console.log("Step: Click Pathology Lab");
    await page.getByRole("link", { name: "Pathology Lab" }).click();
    await page.waitForLoadState("networkidle");

    // Click on Bio-Chemistry location link
    console.log("Step: Click Bio-Chemistry location");
    await page.getByRole("link", { name: "Bio-Chemistry" }).first().click();
    await page.waitForLoadState("networkidle");

    // Extract bio-chemistry location ID from URL
    const bioChemUrl = page.url();
    const bioChemMatch = bioChemUrl.match(/\/locations\/([a-f0-9-]+)/);
    if (!bioChemMatch) {
      throw new Error("Could not extract bio-chemistry location ID from URL");
    }
    const bioChemLabLocationId = bioChemMatch[1];
    console.log(`✓ Bio-Chemistry Location ID: ${bioChemLabLocationId}`);

    // Navigate to internal receive page
    console.log("\nStep: Navigate to internal receive page");
    await page.goto(
      `http://localhost:4000/facility/${facilityId}/locations/${bioChemLabLocationId}/inventory/internal/receive`
    );
    await page.waitForLoadState("networkidle");

    // Click "Raise Stock Request"
    console.log("Step: Click Raise Stock Request");
    await page.getByRole("button", { name: "Raise Stock Request" }).click();
    await page.waitForLoadState("networkidle");

    // Fill in request name
    const requestName = `qa-expiry-test-${Date.now()}`;
    console.log(`Step: Fill Name: ${requestName}`);
    await page.getByRole("textbox", { name: "Name" }).fill(requestName);

    // Select location (Pharmacy)
    console.log("Step: Select Location: Pharmacy");
    await page
      .getByRole("combobox")
      .filter({ hasText: "Select Location" })
      .click();
    await page.getByRole("option", { name: "Pharmacy" }).click();

    // Select priority (Urgent)
    console.log("Step: Select Priority: Urgent");
    await page.getByRole("radio", { name: "Urgent" }).check();

    // Click Create
    console.log("Step: Click Create button");
    await page.getByRole("button", { name: "Create" }).click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Click "Add Item" dropdown
    console.log("\nStep: Click Add Item dropdown");
    await page.getByRole("combobox").filter({ hasText: "Add Item" }).click();
    await page.waitForTimeout(500);

    // Click "Medication"
    console.log("Step: Click Medication");
    await page.getByRole("option", { name: "Medication" }).click();
    await page.waitForTimeout(500);

    // Click "Paracetamol"
    console.log("Step: Select Paracetamol");
    await page.getByRole("option", { name: "Paracetamol" }).click();
    await page.waitForTimeout(500);

    // Enter quantity
    console.log("Step: Enter quantity: 5");
    await page.getByRole("spinbutton").fill("5");
    await page.waitForTimeout(500);

    // Click "Save List"
    console.log("Step: Click Save List");
    await page.getByRole("button", { name: "Save List" }).click();
    await page.waitForTimeout(2000);

    // Verify item in table
    console.log("Step: Verify Paracetamol in table");
    await page.getByText("Paracetamol").waitFor({ timeout: 5000 });
    console.log("✓ Paracetamol visible in table");

    // Click "Mark as Approved"
    console.log("Step: Click Mark as Approved");
    await page.getByRole("button", { name: "Mark as Approved" }).click();
    await page.waitForTimeout(2000);

    // Navigate to dispatch page
    console.log("\nStep: Navigate to dispatch page");
    await page.goto(
      `http://localhost:4000/facility/${facilityId}/locations/${pharmacyLocationId}/inventory/internal/dispatch`
    );
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Find the order and click "See Details"
    console.log("Step: Click See Details for the created order");
    // The order name should be visible in the dispatch list
    const orderRow = page.locator(`tr:has-text("${requestName}")`).first();
    await orderRow.waitFor({ timeout: 5000 });
    await orderRow.getByRole("button", { name: "See Details" }).click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Click "Create Delivery Order"
    console.log("Step: Click Create Delivery Order");
    await page.getByRole("link", { name: "Create Delivery Order" }).click();
    await page.waitForLoadState("networkidle");

    // Click "Create" button to create the delivery order
    console.log("Step: Click Create button");
    await page.getByRole("button", { name: "Create" }).click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Click "Load from order"
    console.log("Step: Click Load from order");
    await page.getByRole("button", { name: "Load from order" }).click();
    await page.waitForTimeout(1000);

    // Click "Done"
    console.log("Step: Click Done");
    await page.getByRole("button", { name: "Done" }).click();
    await page.waitForTimeout(1000);

    // Click "Select stock" button
    console.log("Step: Click Select stock button");
    const selectStockBtn = page.getByRole("button", { name: "Select stock" }).nth(1);
    await selectStockBtn.waitFor({ timeout: 5000 });
    await selectStockBtn.click();
    await page.waitForTimeout(1000);

    // In stock picker modal, click on stock item showing "₹20.00"
    console.log('Step: Select stock item with price "₹20.00"');
    const stockItem = page.locator("div").filter({ hasText: "₹20.00" }).nth(3);
    await stockItem.waitFor({ timeout: 5000 });
    await stockItem.click();
    await page.waitForTimeout(1000);

    // Close modal by clicking away
    console.log("Step: Close stock picker modal");
    await page.mouse.click(0, 0);
    await page.waitForTimeout(1000);

    // Click "Save" button
    console.log("Step: Click Save button");
    await page.getByRole("button", { name: "Save" }).click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Verify the table displays the expiry date column
    console.log("\n=== Verification Phase ===");
    
    // Check for "Expiry" column header
    console.log("Verify: Checking for 'Expiry' column header");
    const expiryHeader = page.getByRole("columnheader", { name: "Expiry" });
    await expiryHeader.waitFor({ timeout: 5000 });
    console.log("✓ 'Expiry' column header found");

    // Check for expiry date in the table (should be in dd/MM/yyyy format)
    console.log("Verify: Checking for expiry date in dd/MM/yyyy format");
    // Look for a date pattern in the table cells
    const tableCells = page.locator('table tbody tr td');
    const cellCount = await tableCells.count();
    console.log(`Found ${cellCount} table cells to scan`);
    
    let expiryDateFound = false;
    let expiryDateValue = null;
    
    for (let i = 0; i < cellCount; i++) {
      const cellText = await tableCells.nth(i).textContent();
      // Check if the cell contains a date in dd/MM/yyyy format
      if (cellText && /^\d{2}\/\d{2}\/\d{4}$/.test(cellText.trim())) {
        expiryDateFound = true;
        expiryDateValue = cellText.trim();
        console.log(`✓ Found expiry date in dd/MM/yyyy format: ${expiryDateValue}`);
        break;
      }
    }

    if (!expiryDateFound) {
      console.log("⚠ No expiry date found in dd/MM/yyyy format in the table");
      console.log("Table content:");
      const tableText = await page.locator('table').textContent();
      console.log(tableText);
    }

    // Scroll the expiry column into view and wait a bit for the final recording
    await expiryHeader.scrollIntoViewIfNeeded();
    await page.waitForTimeout(3000);

    console.log("\n=== Test Complete ===");
    console.log(`Result: ${expiryDateFound ? "PASS" : "FAIL"}`);
    if (expiryDateFound) {
      console.log(`Expiry date displayed: ${expiryDateValue}`);
    }

  } catch (error) {
    console.error("\n=== Test Failed ===");
    console.error(`Error: ${error.message}`);
    console.error(error.stack);
    throw error;
  } finally {
    await context.close();
    await browser.close();
    console.log("\n✓ Browser closed");
  }
}

runTest().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
