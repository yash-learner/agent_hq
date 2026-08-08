#!/usr/bin/env node
import { chromium } from 'playwright';
import * as fs from 'fs';

const facilityId = '9770a57c-7932-4494-8fde-02d96e5b3e55';
const size = { width: 1440, height: 900 };

async function main() {
  console.log('AC4: Clear date filter');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: 'tests/.auth/user.json',
    viewport: size,
    recordVideo: { dir: '.agent-hq/pw-videos', size }
  });
  const page = await context.newPage();
  await page.screencast.showActions({ cursor: 'pointer' });
  
  try {
    console.log('Navigate and apply Last 7 Days filter first');
    await page.goto(`http://localhost:4000/facility/${facilityId}/billing/invoices`);
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForTimeout(3000);
    
    // Apply filter first
    await page.getByRole('button', { name: /^filter$/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('menuitem', { name: /period/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('menuitem', { name: /last 7 days/i }).click();
    await page.waitForTimeout(1000);
    
    console.log('Filter applied, URL:', page.url());
    
    // Verify filter is applied
    let urlObj = new URL(page.url());
    if (!urlObj.searchParams.get('created_date_after')) {
      throw new Error('Filter was not applied - URL missing date params');
    }
    console.log('Filter confirmed applied');
    
    console.log('Step 1: Find and click clear button on filter badge');
    
    // Look for a clear/X button within the filter badge area
    // Filter badges typically have a close/X button
    const clearButton = page.locator('[data-slot="filter-badge"]').locator('button').first()
      .or(page.locator('button[aria-label*="Clear"]').first())
      .or(page.locator('button[aria-label*="Remove"]').first());
    
    const clearCount = await clearButton.count();
    console.log(`Found ${clearCount} potential clear buttons`);
    
    await clearButton.click();
    console.log('Clear button clicked');
    
    await page.waitForTimeout(1000);
    
    console.log('Step 2: Check URL params removed');
    const currentUrl = page.url();
    console.log('Current URL after clear:', currentUrl);
    
    urlObj = new URL(currentUrl);
    const createdAfter = urlObj.searchParams.get('created_date_after');
    const createdBefore = urlObj.searchParams.get('created_date_before');
    
    console.log('created_date_after:', createdAfter);
    console.log('created_date_before:', createdBefore);
    
    if (createdAfter || createdBefore) {
      throw new Error('URL still contains date params after clear');
    }
    
    console.log('SUCCESS: Date filter cleared, params removed from URL');
    
    await page.screenshot({ path: 'specs/29/screenshots/ac4-filter-cleared.png' });
    
  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: 'specs/29/screenshots/ac4-error.png', fullPage: true });
    throw error;
  } finally {
    await page.close();
    await context.close();
    await browser.close();
    const videoPath = await page.video()?.path().catch(() => null);
    if (videoPath) {
      fs.renameSync(videoPath, 'specs/29/videos/ac4-clear-filter.webm');
    }
  }
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
