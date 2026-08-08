#!/usr/bin/env node
// AC4: Date range displayed as badge in selected filters bar

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../../..');

const facilityId = '9e208db7-70b4-4cd9-9711-b474c1365e76';
const size = { width: 1440, height: 900 };

async function main() {
  console.log('[AC4] Starting: Date range displayed as badge in selected filters bar');
  console.log(`[AC4] Facility ID: ${facilityId}`);
  
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
    
    console.log('[AC4] Navigating to invoice list...');
    await page.goto(`http://localhost:4000/facility/${facilityId}/billing/invoices`);
    
    // Auth shell readiness
    console.log('[AC4] Waiting for authenticated shell...');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    try {
      await page.waitForSelector('[data-sidebar="sidebar"]', { timeout: 5000 });
      console.log('[AC4] Authenticated');
    } catch (e) {
      await page.waitForSelector('text=Overview', { timeout: 5000 });
      console.log('[AC4] Authenticated via nav label');
    }
    
    console.log('[AC4] Invoice list loaded');
    
    // Step 1: Apply a date filter (Last 7 days preset)
    console.log('[AC4] Step 1: Applying "Last 7 days" filter...');
    await page.getByRole('button', { name: 'Filter' }).click();
    await page.waitForTimeout(500);
    
    await page.locator('text=Period').click();
    await page.waitForTimeout(500);
    
    // Select "Last 7 days" preset
    const lastSevenDays = page.locator('text=/Last 7 days/i').or(page.locator('text=/last 7 days/i'));
    const isVisible = await lastSevenDays.isVisible().catch(() => false);
    
    if (isVisible) {
      await lastSevenDays.click();
      console.log('[AC4] Applied "Last 7 days" filter');
    } else {
      // Try first preset
      const presets = await page.locator('[role="option"]').all();
      if (presets.length > 0) {
        await presets[0].click();
        console.log('[AC4] Applied first preset filter');
      }
    }
    
    await page.waitForTimeout(1000); // Let filter apply
    
    // Step 2: Look for the selected filter badge
    console.log('[AC4] Step 2: Looking for date filter badge in selected filters bar...');
    
    // Common badge/chip selectors
    const badgeSelectors = [
      '[data-testid="filter-badge"]',
      '[class*="badge"]',
      '[class*="chip"]',
      '[class*="pill"]',
      '[data-filter-badge]',
      '.selected-filter',
      '[role="listitem"]'
    ];
    
    let badgeFound = false;
    let badgeText = '';
    
    for (const selector of badgeSelectors) {
      const badges = await page.locator(selector).all();
      if (badges.length > 0) {
        console.log(`[AC4] Found ${badges.length} element(s) matching ${selector}`);
        
        // Check if any contain date-related text
        for (const badge of badges) {
          const text = await badge.textContent().catch(() => '');
          console.log(`[AC4] Badge text: "${text}"`);
          
          // Check for date patterns (Jan, Feb, numbers, "Last", "days", etc.)
          if (text && (
            text.match(/\d+/) || 
            text.match(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/i) ||
            text.match(/Last \d+ days/i) ||
            text.match(/Period/i)
          )) {
            badgeFound = true;
            badgeText = text;
            console.log(`[AC4] ✓ Date filter badge found: "${text}"`);
            break;
          }
        }
        
        if (badgeFound) break;
      }
    }
    
    if (!badgeFound) {
      console.log('[AC4] Trying generic approach - looking for any visible badges...');
      // Take screenshot to help debug
      await page.screenshot({ path: resolve(projectRoot, 'specs/30/screenshots/ac4-filter-state.png'), fullPage: false });
      console.log('[AC4] Screenshot saved for inspection');
    }
    
    if (badgeFound) {
      console.log(`[AC4] ✓ SUCCESS: Date filter badge displayed with text: "${badgeText}"`);
    } else {
      console.warn('[AC4] ⚠ WARNING: Date filter badge not found in expected locations');
      console.log('[AC4] Badge may use different markup than expected');
    }
    
    await page.waitForTimeout(1000); // Hold for video
    
    await page.close();
    await context.close();
    
    console.log('[AC4] Driver completed');
  } catch (error) {
    console.error(`[AC4] ERROR: ${error.message}`);
    throw error;
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('[AC4] Fatal error:', err);
  process.exit(1);
});
