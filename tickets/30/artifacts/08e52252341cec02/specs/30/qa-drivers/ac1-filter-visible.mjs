#!/usr/bin/env node
// AC1: Period filter option visible in filter menu

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../../..');

const facilityId = '9e208db7-70b4-4cd9-9711-b474c1365e76';
const size = { width: 1440, height: 900 };

async function main() {
  console.log('[AC1] Starting: Period filter option visible in filter menu');
  console.log(`[AC1] Facility ID: ${facilityId}`);
  
  const browser = await chromium.launch({ headless: true });
  
  try {
    const context = await browser.newContext({
      storageState: resolve(projectRoot, 'tests/.auth/user.json'),
      viewport: size,
      recordVideo: { 
        dir: resolve(projectRoot, '.agent-hq/pw-videos'),
        size 
      },
    });
    
    const page = await context.newPage();
    await page.screencast.showActions({ cursor: 'pointer' });
    
    console.log('[AC1] Navigating to invoice list...');
    await page.goto(`http://localhost:4000/facility/${facilityId}/billing/invoices`);
    
    // Auth shell readiness: wait for spinner gone and sidebar visible
    console.log('[AC1] Waiting for authenticated shell...');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Wait for sidebar or facility nav to be visible
    try {
      await page.waitForSelector('[data-sidebar="sidebar"]', { timeout: 5000 });
      console.log('[AC1] Sidebar visible - authenticated');
    } catch (e) {
      console.log('[AC1] Checking for facility nav labels...');
      await page.waitForSelector('text=Overview', { timeout: 5000 });
      console.log('[AC1] Facility nav visible - authenticated');
    }
    
    // Check for login UI (should not be present)
    const loginPresent = await page.locator('text=Username').count() > 0;
    if (loginPresent) {
      console.error('[AC1] ERROR: Login UI present on facility route - auth failure');
      throw new Error('Authentication failed - login UI present');
    }
    
    console.log('[AC1] Step 1: Invoice list page loaded');
    
    // Wait for invoices table or content to load
    await page.waitForSelector('text=Invoices', { timeout: 5000 });
    console.log('[AC1] Invoice list content visible');
    
    // Step 2: Click the Filter button
    console.log('[AC1] Step 2: Clicking Filter button...');
    await page.getByRole('button', { name: 'Filter' }).click();
    await page.waitForTimeout(500); // Let dropdown animate
    
    console.log('[AC1] Filter menu opened');
    
    // Verify Period filter is visible
    const periodFilter = page.locator('text=Period');
    const isPeriodVisible = await periodFilter.isVisible();
    
    if (isPeriodVisible) {
      console.log('[AC1] ✓ SUCCESS: Period filter option is visible in filter menu');
      
      // Also verify other filters are present (Status, Created By)
      const statusVisible = await page.locator('text=Status').first().isVisible().catch(() => false);
      const createdByVisible = await page.locator('text=Created By').first().isVisible().catch(() => false);
      
      console.log(`[AC1] Status filter visible: ${statusVisible}`);
      console.log(`[AC1] Created By filter visible: ${createdByVisible}`);
    } else {
      console.error('[AC1] ✗ FAIL: Period filter option NOT visible');
      throw new Error('Period filter not found in filter menu');
    }
    
    await page.waitForTimeout(1000); // Hold for video capture
    
    await page.close();
    await context.close();
    
    console.log('[AC1] Driver completed successfully');
  } catch (error) {
    console.error(`[AC1] ERROR: ${error.message}`);
    throw error;
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('[AC1] Fatal error:', err);
  process.exit(1);
});
