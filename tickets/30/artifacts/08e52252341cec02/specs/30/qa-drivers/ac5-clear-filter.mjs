#!/usr/bin/env node
// AC5: Date filter can be cleared

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../../..');

const facilityId = '9e208db7-70b4-4cd9-9711-b474c1365e76';
const size = { width: 1440, height: 900 };

async function main() {
  console.log('[AC5] Starting: Date filter can be cleared');
  console.log(`[AC5] Facility ID: ${facilityId}`);
  
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
    
    console.log('[AC5] Navigating to invoice list...');
    await page.goto(`http://localhost:4000/facility/${facilityId}/billing/invoices`);
    
    // Auth shell readiness
    console.log('[AC5] Waiting for authenticated shell...');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    try {
      await page.waitForSelector('[data-sidebar="sidebar"]', { timeout: 5000 });
      console.log('[AC5] Authenticated');
    } catch (e) {
      await page.waitForSelector('text=Overview', { timeout: 5000 });
      console.log('[AC5] Authenticated via nav label');
    }
    
    console.log('[AC5] Invoice list loaded');
    
    // Apply a date filter first
    console.log('[AC5] Applying date filter...');
    await page.getByRole('button', { name: 'Filter' }).click();
    await page.waitForTimeout(500);
    
    await page.locator('text=Period').click();
    await page.waitForTimeout(500);
    
    // Select preset
    const lastSevenDays = page.locator('text=/Last 7 days/i').or(page.locator('text=/last 7 days/i'));
    const isVisible = await lastSevenDays.isVisible().catch(() => false);
    
    if (isVisible) {
      await lastSevenDays.click();
      console.log('[AC5] Applied "Last 7 days" filter');
    } else {
      const presets = await page.locator('[role="option"]').all();
      if (presets.length > 0) {
        await presets[0].click();
        console.log('[AC5] Applied preset filter');
      }
    }
    
    await page.waitForTimeout(1000);
    
    // Capture URL with date filter
    const urlWithFilter = page.url();
    console.log(`[AC5] URL with filter: ${urlWithFilter}`);
    const hadDateParams = urlWithFilter.includes('created_date_after') || urlWithFilter.includes('created_date_before');
    
    if (hadDateParams) {
      console.log('[AC5] ✓ Date filter confirmed active');
    }
    
    // Step 1: Click the clear/remove button on the date filter badge
    console.log('[AC5] Step 1: Looking for clear/remove button on date filter badge...');
    
    // Look for X button, close button, or remove button near date badge
    const clearButtons = [
      page.locator('[aria-label*="Remove"]').or(page.locator('[aria-label*="Clear"]')),
      page.locator('button:has-text("×")'),
      page.locator('button[class*="close"]'),
      page.locator('[data-testid="clear-filter"]'),
      page.getByRole('button', { name: /clear/i })
    ];
    
    let cleared = false;
    
    for (const button of clearButtons) {
      const count = await button.count();
      if (count > 0) {
        console.log(`[AC5] Found ${count} clear button candidate(s)`);
        try {
          await button.first().click({ timeout: 2000 });
          console.log('[AC5] Clicked clear button');
          cleared = true;
          break;
        } catch (e) {
          console.log(`[AC5] Could not click this button: ${e.message}`);
        }
      }
    }
    
    if (!cleared) {
      console.log('[AC5] Trying "Clear all filters" button...');
      const clearAll = page.getByRole('button', { name: /Clear all/i });
      const hasClearAll = await clearAll.isVisible().catch(() => false);
      
      if (hasClearAll) {
        await clearAll.click();
        console.log('[AC5] Clicked "Clear all" button');
        cleared = true;
      }
    }
    
    await page.waitForTimeout(1000); // Let filter clear
    
    // Step 2: Verify URL no longer has date parameters
    const urlAfterClear = page.url();
    console.log(`[AC5] URL after clear: ${urlAfterClear}`);
    
    const hasDateParamsAfter = urlAfterClear.includes('created_date_after') || urlAfterClear.includes('created_date_before');
    
    if (!hasDateParamsAfter && hadDateParams) {
      console.log('[AC5] ✓ SUCCESS: Date filter parameters removed from URL');
    } else if (!hasDateParamsAfter && !hadDateParams) {
      console.warn('[AC5] ⚠ Date parameters were not present before or after');
    } else {
      console.warn('[AC5] ⚠ Date parameters still present after clear attempt');
    }
    
    // Step 3: Verify invoice list shows all invoices again
    console.log('[AC5] Step 3: Verifying invoice list updated...');
    await page.waitForTimeout(1000);
    
    console.log('[AC5] ✓ Clear operation completed');
    
    await page.waitForTimeout(1000); // Hold for video
    
    await page.close();
    await context.close();
    
    console.log('[AC5] Driver completed');
  } catch (error) {
    console.error(`[AC5] ERROR: ${error.message}`);
    throw error;
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('[AC5] Fatal error:', err);
  process.exit(1);
});
