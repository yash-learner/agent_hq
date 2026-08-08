#!/usr/bin/env node
import { chromium } from 'playwright';
import * as fs from 'fs';

const facilityId = '9770a57c-7932-4494-8fde-02d96e5b3e55';
const size = { width: 1440, height: 900 };

async function main() {
  console.log('AC5: Combine date filter with status filter');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: 'tests/.auth/user.json',
    viewport: size,
    recordVideo: { dir: '.agent-hq/pw-videos', size }
  });
  const page = await context.newPage();
  await page.screencast.showActions({ cursor: 'pointer' });
  
  try {
    console.log('Navigate to invoices');
    await page.goto(`http://localhost:4000/facility/${facilityId}/billing/invoices`);
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForTimeout(3000);
    
    console.log('Step 1: Apply Last 7 Days date filter');
    await page.getByRole('button', { name: /^filter$/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('menuitem', { name: /period/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('menuitem', { name: /last 7 days/i }).click();
    await page.waitForTimeout(1000);
    console.log('Date filter applied, URL:', page.url());
    
    console.log('Step 2: Apply Status=Draft filter');
    // Wait for Filter button to be ready
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    await page.getByRole('button', { name: /^filter$/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('menuitem', { name: /status/i }).or(page.getByRole('menuitem', { name: /invoice status/i })).click();
    await page.waitForTimeout(500);
    
    // Look for Draft checkbox or option
    const draftOption = page.getByLabel(/draft/i).or(page.getByText(/draft/i, { exact: false })).filter({ hasNot: page.locator('h1, h2, h3') });
    await draftOption.first().click();
    console.log('Draft status clicked');
    
    // Press Escape to close filter menu
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    
    console.log('Step 3: Check URL has both filters');
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    const urlObj = new URL(currentUrl);
    const createdAfter = urlObj.searchParams.get('created_date_after');
    const createdBefore = urlObj.searchParams.get('created_date_before');
    const status = urlObj.searchParams.get('status');
    
    console.log('created_date_after:', createdAfter);
    console.log('created_date_before:', createdBefore);
    console.log('status:', status);
    
    if (!createdAfter || !createdBefore) {
      throw new Error('URL missing date params');
    }
    if (!status || !status.toLowerCase().includes('draft')) {
      throw new Error('URL missing status=draft param');
    }
    
    console.log('SUCCESS: Both date and status filters applied');
    
    await page.screenshot({ path: 'specs/29/screenshots/ac5-combined-filters.png' });
    
  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: 'specs/29/screenshots/ac5-error.png', fullPage: true });
    throw error;
  } finally {
    await page.close();
    await context.close();
    await browser.close();
    const videoPath = await page.video()?.path().catch(() => null);
    if (videoPath) {
      fs.renameSync(videoPath, 'specs/29/videos/ac5-combined-filters.webm');
    }
  }
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
