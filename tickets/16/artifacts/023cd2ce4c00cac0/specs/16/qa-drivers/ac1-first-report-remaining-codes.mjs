#!/usr/bin/env node
/**
 * AC1: Create first report with remaining codes available
 * 
 * Test that after creating the first diagnostic report, the dropdown
 * shows the remaining unused codes (not all codes).
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../../..');

async function main() {
  console.log('=== AC1: Create first report with remaining codes available ===');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: join(projectRoot, 'tests/.auth/user.json'),
    recordVideo: {
      dir: join(projectRoot, '.agent-hq/pw-videos'),
      size: { width: 1440, height: 900 }
    },
    viewport: { width: 1440, height: 900 }
  });
  
  const page = await context.newPage();
  
  // Enable native cursor/click overlay
  await page.screencast.showActions({ cursor: 'pointer' });
  
  try {
    console.log('Step 1: Navigate to home page and find a facility');
    await page.goto('http://localhost:4000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    // Look for a facility link or navigate to facilities
    console.log('Step 2: Navigate to patients page to find service requests');
    
    // Try to find a way to get to service requests
    // Usually: Home -> Facility -> Patient -> Encounter -> Service Requests
    
    // Click on a facility (look for facility cards or links)
    const facilityLink = page.locator('a[href*="/facility/"]').first();
    if (await facilityLink.count() > 0) {
      await facilityLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    } else {
      console.log('No facility link found, trying to navigate via URL');
      // Try to find facility ID from fixtures
      await page.goto('http://localhost:4000/facility', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
    }
    
    console.log('Step 3: Navigate to a patient with service requests');
    
    // Look for patients tab or link
    const patientsLink = page.locator('a:has-text("Patients"), button:has-text("Patients")').first();
    if (await patientsLink.count() > 0) {
      await patientsLink.click();
      await page.waitForTimeout(1000);
    }
    
    // Click on a patient
    const patientLink = page.locator('a[href*="/patient/"]').first();
    if (await patientLink.count() > 0) {
      await patientLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }
    
    console.log('Step 4: Find service requests tab or link');
    
    // Look for service requests or encounter section
    const serviceRequestsLink = page.locator('a:has-text("Service Request"), a[href*="service_request"]').first();
    if (await serviceRequestsLink.count() > 0) {
      await serviceRequestsLink.click();
      await page.waitForTimeout(2000);
    } else {
      console.log('Trying to find service requests in current page');
      // Service requests might be in a tab or section
      const tabLink = page.locator('[role="tab"]:has-text("Service"), [role="tab"]:has-text("Lab")').first();
      if (await tabLink.count() > 0) {
        await tabLink.click();
        await page.waitForTimeout(1000);
      }
    }
    
    console.log('Step 5: Click on a service request with multiple diagnostic codes');
    
    // Find a service request link
    const srLink = page.locator('a[href*="/service_request"]').first();
    if (await srLink.count() > 0) {
      await srLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }
    
    console.log('Step 6: Locate the diagnostic report type dropdown in Test Results Entry section');
    
    // Scroll to find the dropdown
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(500);
    
    // Find the diagnostic report type dropdown
    const dropdown = page.locator('[role="combobox"]').filter({ hasText: /diagnostic|report|type/i }).or(
      page.locator('button').filter({ hasText: /select.*diagnostic/i })
    ).or(
      page.locator('[data-testid*="diagnostic"]').locator('button')
    ).first();
    
    console.log('Step 7: Click the dropdown to see all codes');
    await dropdown.click();
    await page.waitForTimeout(1000);
    
    // Take a screenshot of all codes
    await page.screenshot({ path: join(projectRoot, 'specs/16/screenshots/ac1-all-codes-before.png') });
    
    // Count the number of options
    const optionsBefore = await page.locator('[role="option"]').count();
    console.log(`Found ${optionsBefore} diagnostic report codes before creating first report`);
    
    // Select the first option
    console.log('Step 8: Select the first diagnostic report code');
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(1000);
    
    console.log('Step 9: Click Create Report button');
    const createButton = page.locator('button:has-text("Create Report")').first();
    await createButton.click();
    await page.waitForTimeout(2000);
    
    // Wait for success toast
    const toast = page.locator('[data-sonner-toast]').filter({ hasText: /created|success/i });
    if (await toast.count() > 0) {
      console.log('✓ Success toast appeared');
    }
    
    console.log('Step 10: Scroll to Test Results Entry section and check remaining codes');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    
    // Click the dropdown again to see remaining codes
    const dropdownAfter = page.locator('[role="combobox"]').filter({ hasText: /diagnostic|report|type|select/i }).or(
      page.locator('button').filter({ hasText: /select/i })
    ).last();
    
    await dropdownAfter.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await dropdownAfter.click();
    await page.waitForTimeout(1000);
    
    // Count options after creating first report
    const optionsAfter = await page.locator('[role="option"]').count();
    console.log(`Found ${optionsAfter} diagnostic report codes after creating first report`);
    
    // Take a screenshot of remaining codes
    await page.screenshot({ path: join(projectRoot, 'specs/16/screenshots/ac1-remaining-codes-after.png') });
    
    if (optionsAfter === optionsBefore - 1) {
      console.log('✓ PASS: Dropdown shows remaining codes (reduced by 1)');
    } else {
      console.log(`✗ FAIL: Expected ${optionsBefore - 1} codes, found ${optionsAfter}`);
    }
    
    await page.waitForTimeout(2000);
    
  } catch (error) {
    console.error('Error during test:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
  
  console.log('=== AC1 Complete ===');
}

main().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
