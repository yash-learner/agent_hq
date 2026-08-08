#!/usr/bin/env node
import { chromium } from 'playwright';
import * as fs from 'fs';

const facilityId = '9770a57c-7932-4494-8fde-02d96e5b3e55';
const size = { width: 1440, height: 900 };

async function main() {
  console.log('AC3: Custom date range filter');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: 'tests/.auth/user.json',
    viewport: size,
    recordVideo: { dir: '.agent-hq/pw-videos', size }
  });
  const page = await context.newPage();
  await page.screencast.showActions({ cursor: 'pointer' });
  
  try {
    console.log(`Navigating to facility invoices...`);
    await page.goto(`http://localhost:4000/facility/${facilityId}/billing/invoices`);
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForTimeout(3000);
    
    console.log('Step 1: Click Filter button');
    await page.getByRole('button', { name: /^filter$/i }).click();
    await page.waitForTimeout(500);
    
    console.log('Step 2: Select Period filter');
    await page.getByRole('menuitem', { name: /period/i }).click();
    await page.waitForTimeout(500);
    
    console.log('Step 3: Click Custom date range');
    const customOption = page.getByRole('menuitem', { name: /custom/i });
    await customOption.click();
    console.log('Custom date range clicked');
    
    await page.waitForTimeout(1000);
    
    console.log('Step 4: Enter custom dates');
    const today = new Date();
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    
    const fromDate = tenDaysAgo.toISOString().split('T')[0];
    const toDate = today.toISOString().split('T')[0];
    
    console.log(`From date: ${fromDate}, To date: ${toDate}`);
    
    // Fill from date
    const fromInput = page.getByPlaceholder(/start date/i).or(page.locator('input[type="date"]').first());
    await fromInput.fill(fromDate);
    console.log('From date filled');
    
    await page.waitForTimeout(500);
    
    // Fill to date
    const toInput = page.getByPlaceholder(/end date/i);
    await toInput.fill(toDate);
    console.log('To date filled');
    
    await page.waitForTimeout(500);
    
    // Look for Confirm button
    console.log('Step 5: Click Confirm button');
    const confirmButton = page.getByRole('button', { name: /confirm/i });
    await confirmButton.click();
    console.log('Confirm button clicked');
    
    await page.waitForTimeout(1000);
    
    console.log('Step 6: Check URL params');
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    const urlObj = new URL(currentUrl);
    const createdAfter = urlObj.searchParams.get('created_date_after');
    const createdBefore = urlObj.searchParams.get('created_date_before');
    
    console.log('created_date_after:', createdAfter);
    console.log('created_date_before:', createdBefore);
    
    if (!createdAfter || !createdBefore) {
      throw new Error('URL does not contain created_date_after and created_date_before params');
    }
    
    console.log('SUCCESS: Custom date filter applied with correct URL params');
    
    await page.screenshot({ path: 'specs/29/screenshots/ac3-custom-applied.png' });
    
  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: 'specs/29/screenshots/ac3-error.png', fullPage: true });
    throw error;
  } finally {
    await page.close();
    await context.close();
    await browser.close();
    const videoPath = await page.video()?.path().catch(() => null);
    if (videoPath) {
      fs.renameSync(videoPath, 'specs/29/videos/ac3-custom-filter.webm');
    }
  }
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
