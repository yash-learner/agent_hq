#!/usr/bin/env node
import { chromium } from 'playwright';

console.log('=== AC7: Links filtered by showIn visibility config ===');
console.log('Starting browser...');

const browser = await chromium.launch({ headless: true });

try {
  const size = { width: 1440, height: 900 };
  
  console.log('Creating browser context with auth storage state...');
  const context = await browser.newContext({
    storageState: 'tests/.auth/user.json',
    viewport: size,
    recordVideo: { dir: '.agent-hq/pw-videos-ac7', size }
  });
  
  const page = await context.newPage();
  
  console.log('Enabling screencast actions...');
  await page.screencast.showActions({ cursor: 'pointer' });
  
  console.log('Navigating to root page...');
  await page.goto('http://localhost:4000/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // Navigate to facility context
  console.log('Navigating to facility context...');
  const facilityLink = await page.locator('a[href*="/facility/"]').first();
  await facilityLink.click();
  await page.waitForLoadState('networkidle', { timeout: 30000 });
  await page.waitForTimeout(2000);
  
  console.log('In facility context, URL:', page.url());
  
  // Scroll to sidebar footer
  await page.evaluate(() => {
    const sidebar = document.querySelector('[data-sidebar="sidebar"]');
    if (sidebar) {
      sidebar.scrollTop = sidebar.scrollHeight;
    }
  });
  await page.waitForTimeout(1000);
  
  // Check which links are visible in facility context
  console.log('Checking custom links visibility in FACILITY context...');
  const facilityLinkVisible = await page.locator('a:has-text("Facility Link")').isVisible().catch(() => false);
  const adminLinkVisible = await page.locator('a:has-text("Admin Link")').isVisible().catch(() => false);
  const globalLinkVisible = await page.locator('a:has-text("Global Link")').isVisible().catch(() => false);
  
  console.log(`  Facility Link: ${facilityLinkVisible ? 'VISIBLE ✓' : 'HIDDEN ✗'}`);
  console.log(`  Admin Link: ${adminLinkVisible ? 'VISIBLE ✗' : 'HIDDEN ✓'}`);
  console.log(`  Global Link: ${globalLinkVisible ? 'VISIBLE ✓' : 'HIDDEN ✗'}`);
  
  // Verify expected visibility
  if (facilityLinkVisible && !adminLinkVisible && globalLinkVisible) {
    console.log('SUCCESS: Facility context shows correct links (Facility + Global, not Admin)');
  } else {
    console.log('FAIL: Facility context visibility incorrect');
  }
  
  // Highlight visible links
  if (facilityLinkVisible) {
    const facilityLinkEl = await page.locator('a:has-text("Facility Link")').first();
    await facilityLinkEl.scrollIntoViewIfNeeded();
    await facilityLinkEl.hover();
    await page.waitForTimeout(1500);
  }
  
  if (globalLinkVisible) {
    const globalLinkEl = await page.locator('a:has-text("Global Link")').first();
    await globalLinkEl.scrollIntoViewIfNeeded();
    await globalLinkEl.hover();
    await page.waitForTimeout(1500);
  }
  
  // Navigate to admin context
  console.log('Navigating to admin context...');
  await page.goto('http://localhost:4000/admin', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  console.log('In admin context, URL:', page.url());
  
  // Scroll to sidebar footer
  await page.evaluate(() => {
    const sidebar = document.querySelector('[data-sidebar="sidebar"]');
    if (sidebar) {
      sidebar.scrollTop = sidebar.scrollHeight;
    }
  });
  await page.waitForTimeout(1000);
  
  // Check which links are visible in admin context
  console.log('Checking custom links visibility in ADMIN context...');
  const facilityLinkVisibleAdmin = await page.locator('a:has-text("Facility Link")').isVisible().catch(() => false);
  const adminLinkVisibleAdmin = await page.locator('a:has-text("Admin Link")').isVisible().catch(() => false);
  const globalLinkVisibleAdmin = await page.locator('a:has-text("Global Link")').isVisible().catch(() => false);
  
  console.log(`  Facility Link: ${facilityLinkVisibleAdmin ? 'VISIBLE ✗' : 'HIDDEN ✓'}`);
  console.log(`  Admin Link: ${adminLinkVisibleAdmin ? 'VISIBLE ✓' : 'HIDDEN ✗'}`);
  console.log(`  Global Link: ${globalLinkVisibleAdmin ? 'VISIBLE ✓' : 'HIDDEN ✗'}`);
  
  // Verify expected visibility
  if (!facilityLinkVisibleAdmin && adminLinkVisibleAdmin && globalLinkVisibleAdmin) {
    console.log('SUCCESS: Admin context shows correct links (Admin + Global, not Facility)');
  } else {
    console.log('FAIL: Admin context visibility incorrect');
  }
  
  // Highlight visible links
  if (adminLinkVisibleAdmin) {
    const adminLinkEl = await page.locator('a:has-text("Admin Link")').first();
    await adminLinkEl.scrollIntoViewIfNeeded();
    await adminLinkEl.hover();
    await page.waitForTimeout(1500);
  }
  
  if (globalLinkVisibleAdmin) {
    const globalLinkEl = await page.locator('a:has-text("Global Link")').first();
    await globalLinkEl.scrollIntoViewIfNeeded();
    await globalLinkEl.hover();
    await page.waitForTimeout(1500);
  }
  
  console.log('Closing browser...');
  await context.close();
  
} catch (error) {
  console.error('ERROR:', error.message);
  console.error(error.stack);
  throw error;
} finally {
  await browser.close();
  console.log('Browser closed');
}
