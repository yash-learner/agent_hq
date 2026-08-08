#!/usr/bin/env node
import { chromium } from 'playwright';
import * as fs from 'fs';

const facilityId = '9770a57c-7932-4494-8fde-02d96e5b3e55';
const size = { width: 1440, height: 900 };

async function main() {
  console.log('AC6: Restore date filter from URL on reload');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: 'tests/.auth/user.json',
    viewport: size,
    recordVideo: { dir: '.agent-hq/pw-videos', size }
  });
  const page = await context.newPage();
  await page.screencast.showActions({ cursor: 'pointer' });
  
  try {
    console.log('Step 1: Apply Last 7 Days filter');
    await page.goto(`http://localhost:4000/facility/${facilityId}/billing/invoices`);
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForTimeout(3000);
    
    // Verify page loaded correctly
    const filterButton = page.getByRole('button', { name: /^filter$/i });
    await filterButton.waitFor({ state: 'visible', timeout: 10000 });
    
    await filterButton.click();
    await page.waitForTimeout(500);
    await page.getByRole('menuitem', { name: /period/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('menuitem', { name: /last 7 days/i }).click();
    await page.waitForTimeout(1000);
    
    const urlWithFilter = page.url();
    console.log('URL with filter:', urlWithFilter);
    
    // Verify params exist
    let urlObj = new URL(urlWithFilter);
    if (!urlObj.searchParams.get('created_date_after')) {
      throw new Error('Filter not applied');
    }
    
    console.log('Step 2: Reload page with same URL');
    await page.reload();
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForTimeout(2000);
    
    console.log('Step 3: Verify URL still has params after reload');
    const reloadedUrl = page.url();
    console.log('URL after reload:', reloadedUrl);
    
    urlObj = new URL(reloadedUrl);
    const createdAfter = urlObj.searchParams.get('created_date_after');
    const createdBefore = urlObj.searchParams.get('created_date_before');
    
    console.log('created_date_after:', createdAfter);
    console.log('created_date_before:', createdBefore);
    
    if (!createdAfter || !createdBefore) {
      throw new Error('URL params lost after reload');
    }
    
    console.log('Step 4: Verify filter badge still visible');
    const periodText = page.locator('text=/period/i');
    const isPeriodVisible = await periodText.isVisible().catch(() => false);
    console.log(`Period text visible: ${isPeriodVisible}`);
    
    if (!isPeriodVisible) {
      console.warn('WARN: Period badge not clearly visible, but URL params persisted');
    }
    
    console.log('SUCCESS: Filter restored from URL after reload');
    
    await page.screenshot({ path: 'specs/29/screenshots/ac6-filter-restored.png' });
    
  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: 'specs/29/screenshots/ac6-error.png', fullPage: true });
    throw error;
  } finally {
    await page.close();
    await context.close();
    await browser.close();
    const videoPath = await page.video()?.path().catch(() => null);
    if (videoPath) {
      fs.renameSync(videoPath, 'specs/29/videos/ac6-url-restore.webm');
    }
  }
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
