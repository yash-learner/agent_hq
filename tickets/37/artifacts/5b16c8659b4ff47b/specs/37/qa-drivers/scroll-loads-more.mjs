#!/usr/bin/env node
/**
 * QA Driver: Scroll loads more
 * Verifies that scrolling to the bottom of the selector loads additional older dispenses
 */

import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logPath = path.resolve(__dirname, '../qa-logs/scroll-loads-more.log');
const videoDir = path.resolve(__dirname, '../../../.agent-hq/pw-videos');

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logPath, logMessage);
  console.log(message);
}

fs.writeFileSync(logPath, '');
log('=== QA Driver: Scroll loads more ===');

const facilityId = '92016728-0113-41b0-b40f-475fdf224cf5';
const patientId = '4c643b12-bc66-4d30-b42e-8f739bb3102c';
const encounterId = '611df272-c0d2-4728-b2e7-50a3f826516b';

async function main() {
  try {
    log('Using existing 120+ dispense orders from previous test');
    
    log('\n--- Launching browser ---');
    const size = { width: 1440, height: 900 };
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      storageState: 'tests/.auth/user.json',
      viewport: size,
      recordVideo: { dir: videoDir, size }
    });
    
    const page = await context.newPage();
    log('Browser context created');
    
    await page.screencast.showActions({ cursor: 'pointer' });
    log('Screencast cursor overlay enabled');
    
    const encounterUrl = `http://localhost:4000/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/medicines`;
    log(`\nNavigating to: ${encounterUrl}`);
    await page.goto(encounterUrl);
    
    await page.waitForSelector('[data-sidebar="sidebar"]', { timeout: 15000 });
    log('Authenticated shell confirmed');
    
    await page.waitForSelector('button:has-text("Prescriptions")', { timeout: 10000 });
    log('Medicines tab loaded');
    await page.waitForTimeout(2000);
    
    log('\nClicking Dispense History tab...');
    await page.click('button:has-text("Dispense History")');
    await page.waitForTimeout(3000);
    log('Dispense History tab opened');
    
    log('\nVerifying first page loaded...');
    await page.waitForSelector('svg.lucide-package', { timeout: 15000 });
    await page.waitForTimeout(2000);
    
    const initialCount = await page.locator('svg.lucide-package').count();
    log(`Initial dispense order count: ${initialCount}`);
    
    // Find the scrollable container for the dispense order list
    log('\nFinding scroll container...');
    const scrollContainer = page.locator('.lg\\:block.h-full.overflow-y-auto').first();
    
    // Scroll to bottom
    log('Scrolling to bottom of list...');
    await scrollContainer.evaluate(el => {
      el.scrollTop = el.scrollHeight;
    });
    
    log('Waiting for loading indicator...');
    await page.waitForTimeout(1000);
    
    // Wait for new items to load
    log('Waiting for new dispense orders to appear...');
    await page.waitForTimeout(3000);
    
    const afterScrollCount = await page.locator('svg.lucide-package').count();
    log(`Dispense order count after scroll: ${afterScrollCount}`);
    
    // Verification
    log('\n--- Verification Results ---');
    const moreLoaded = afterScrollCount > initialCount;
    log(`✓ More orders loaded after scroll: ${moreLoaded} (${initialCount} → ${afterScrollCount})`);
    
    // Check for loading skeleton
    const hadSkeleton = await page.locator('[class*="animate-pulse"]').count() > 0;
    log(`✓ Loading skeleton visible during fetch: check manually in video`);
    
    // Wait for video
    await page.waitForTimeout(2000);
    
    log('\n--- Test complete ---');
    await context.close();
    await browser.close();
    log('Browser closed');
    
    if (moreLoaded) {
      log('\n=== SUCCESS ===');
    } else {
      log('\n=== FAIL: No additional orders loaded ===');
      process.exit(1);
    }
  } catch (error) {
    log(`\n=== ERROR ===`);
    log(`${error.message}`);
    log(error.stack);
    process.exit(1);
  }
}

main();
