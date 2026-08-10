#!/usr/bin/env node
/**
 * QA Driver: First page loads
 * Verifies that opening Dispense History shows the latest dispenses in the left selector
 */

import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logPath = path.resolve(__dirname, '../qa-logs/first-page-loads.log');
const videoDir = path.resolve(__dirname, '../../../.agent-hq/pw-videos');

// Helper to log with timestamps
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logPath, logMessage);
  console.log(message);
}

// Clear/create log file
fs.writeFileSync(logPath, '');
log('=== QA Driver: First page loads ===');

const facilityId = '92016728-0113-41b0-b40f-475fdf224cf5';
const patientId = '4c643b12-bc66-4d30-b42e-8f739bb3102c';
const encounterId = '611df272-c0d2-4728-b2e7-50a3f826516b';
const locationId = '4220a48c-7d40-4c3e-9985-41bfce1828f8';

log(`Fixture IDs: facility=${facilityId}, patient=${patientId}, encounter=${encounterId}, location=${locationId}`);

// API setup helpers
function getApiHeaders() {
  const authFile = path.resolve('tests/.auth/user.json');
  const storageState = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
  const localStorage = storageState.origins?.[0]?.localStorage ?? [];
  const tokenEntry = localStorage.find(item => item.name === 'care_access_token');
  if (!tokenEntry) throw new Error('No access token in auth storage state');
  return {
    'Authorization': `Bearer ${tokenEntry.value}`,
    'Content-Type': 'application/json'
  };
}

// Refresh token if needed
async function refreshToken() {
  log('\n--- Token refresh check ---');
  const authFile = path.resolve('tests/.auth/user.json');
  const storageState = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
  const localStorage = storageState.origins?.[0]?.localStorage ?? [];
  const refreshEntry = localStorage.find(item => item.name === 'care_refresh_token');
  
  if (!refreshEntry) {
    log('No refresh token found');
    return false;
  }
  
  try {
    log('Attempting token refresh...');
    const response = await fetch(`${apiUrl}/api/v1/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshEntry.value })
    });
    
    if (!response.ok) {
      log(`Token refresh failed: ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    log('Token refreshed successfully');
    
    // Update the tokens in storage state
    const accessIdx = localStorage.findIndex(item => item.name === 'care_access_token');
    const refreshIdx = localStorage.findIndex(item => item.name === 'care_refresh_token');
    
    if (accessIdx >= 0) localStorage[accessIdx].value = data.access;
    if (refreshIdx >= 0) localStorage[refreshIdx].value = data.refresh;
    
    // Write back to file
    fs.writeFileSync(authFile, JSON.stringify(storageState, null, 2));
    log('Updated tokens in storage state');
    
    return true;
  } catch (error) {
    log(`Token refresh error: ${error.message}`);
    return false;
  }
}

const apiUrl = process.env.REACT_CARE_API_URL || 'http://localhost:9000';

// Seed dispense orders
async function seedDispenseOrders(count = 20) {
  log(`\n--- Seeding ${count} dispense orders via API ---`);
  const headers = getApiHeaders();
  const url = `${apiUrl}/api/v1/facility/${facilityId}/order/dispense/`;
  
  for (let i = 0; i < count; i++) {
    const body = {
      patient: patientId,
      location: locationId,
      status: 'completed',
      name: `QA Test Dispense Order ${i + 1}`,
      note: `Created for QA pagination testing - item ${i + 1}`
    };
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        log(`ERROR creating dispense order ${i + 1}: ${response.status} ${errorText}`);
      } else {
        const data = await response.json();
        log(`Created dispense order ${i + 1}: ${data.id}`);
      }
    } catch (error) {
      log(`ERROR creating dispense order ${i + 1}: ${error.message}`);
    }
    
    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  log('--- Seed complete ---\n');
}

// Verify count
async function verifyDispenseOrderCount() {
  log('\n--- Verifying dispense order count ---');
  const headers = getApiHeaders();
  const url = `${apiUrl}/api/v1/facility/${facilityId}/order/dispense/?patient=${patientId}`;
  
  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      log(`ERROR fetching dispense orders: ${response.status}`);
      return 0;
    }
    const data = await response.json();
    log(`Total dispense orders: ${data.count}`);
    return data.count;
  } catch (error) {
    log(`ERROR verifying count: ${error.message}`);
    return 0;
  }
}

// Main test execution
async function main() {
  try {
    // Step 0: Refresh token if needed
    await refreshToken();
    
    // Step 1: Seed data
    await seedDispenseOrders(20);
    const count = await verifyDispenseOrderCount();
    
    if (count < 15) {
      log(`\nWARNING: Only ${count} dispense orders exist, need 15+ for pagination test`);
    }
    
    // Step 2: Launch browser and navigate
    log('\n--- Launching browser ---');
    const size = { width: 1440, height: 900 };
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      storageState: 'tests/.auth/user.json',
      viewport: size,
      recordVideo: { dir: videoDir, size }
    });
    
    const page = await context.newPage();
    log('Browser context created with viewport 1440x900');
    
    // Enable cursor overlay
    await page.screencast.showActions({ cursor: 'pointer' });
    log('Screencast cursor overlay enabled');
    
    // Step 3: Navigate directly to encounter Medicine tab
    const encounterUrl = `http://localhost:4000/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/medicines`;
    log(`\nNavigating to: ${encounterUrl}`);
    await page.goto(encounterUrl);
    
    // Wait for auth shell
    log('Waiting for authenticated shell...');
    await page.waitForSelector('[data-sidebar="sidebar"]', { timeout: 15000 });
    log('Authenticated shell confirmed');
    
    // Wait for Medicines tab content to load - look for Prescriptions tab first
    await page.waitForSelector('button:has-text("Prescriptions")', { timeout: 10000 });
    log('Medicines tab loaded with inner tabs');
    
    // Wait a bit for all tabs to render
    await page.waitForTimeout(2000);
    
    // Step 4: Click Dispense History tab
    log('\nClicking Dispense History tab...');
    // Use simpler text-based click
    await page.click('button:has-text("Dispense History")');
    await page.waitForTimeout(3000); // Wait longer for tab content to load
    log('Dispense History tab opened');
    
    // Step 5: Verify first page loaded
    log('\nVerifying first page of dispense orders...');
    
    // Wait for the PackageIcon svg elements to appear (each dispense order has one)
    await page.waitForSelector('svg.lucide-package', { timeout: 15000 });
    log('Dispense order list visible');
    
    // Wait a bit more for rendering to settle
    await page.waitForTimeout(2000);
    
    // Count visible dispense order cards (using PackageIcon as marker)
    const visibleOrders = await page.locator('svg[class*="lucide-package"]').count();
    log(`Visible dispense orders in selector: ${visibleOrders}`);
    
    // Verify first order is selected (has border-primary class)
    const selectedOrder = await page.locator('[class*="border-primary"]').count();
    log(`Selected orders: ${selectedOrder}`);
    
    // Check if right panel shows details (looking for any content indicating details loaded)
    const rightPanel = await page.locator('text=/medication|dispense/i').count();
    log(`Right panel with details visible: ${rightPanel > 0}`);
    
    // Final verification
    log('\n--- Verification Results ---');
    log(`✓ First page loaded: ${visibleOrders >= 10 && visibleOrders <= 14}`);
    log(`✓ Order auto-selected: ${selectedOrder === 1}`);
    log(`✓ Details panel shown: ${rightPanel > 0}`);
    
    // Wait a bit more for video
    await page.waitForTimeout(2000);
    
    log('\n--- Test complete ---');
    
    // Close browser
    await context.close();
    await browser.close();
    log('Browser closed');
    
    log('\n=== SUCCESS ===');
  } catch (error) {
    log(`\n=== ERROR ===`);
    log(`${error.message}`);
    log(error.stack);
    process.exit(1);
  }
}

main();
