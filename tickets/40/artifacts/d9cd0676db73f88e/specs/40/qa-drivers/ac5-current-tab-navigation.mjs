#!/usr/bin/env node
import { chromium } from 'playwright';

console.log('=== AC5: Links with openInNewTab: false navigate in current tab ===');
console.log('Starting browser...');

const browser = await chromium.launch({ headless: true });

try {
  const size = { width: 1440, height: 900 };
  
  console.log('Creating browser context with auth storage state...');
  const context = await browser.newContext({
    storageState: 'tests/.auth/user.json',
    viewport: size,
    recordVideo: { dir: '.agent-hq/pw-videos-ac5', size }
  });
  
  const page = await context.newPage();
  
  console.log('Enabling screencast actions...');
  await page.screencast.showActions({ cursor: 'pointer' });
  
  console.log('Navigating to root page...');
  await page.goto('http://localhost:4000/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // Navigate to facility context
  const facilitiesText = await page.locator('text=Facilities').first().isVisible({ timeout: 5000 }).catch(() => false);
  
  if (facilitiesText) {
    console.log('Found facilities list, clicking on first facility...');
    const facilityLink = await page.locator('a[href*="/facility/"]').first();
    await facilityLink.click();
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(2000);
  }
  
  const initialUrl = page.url();
  console.log('Initial URL (facility page):', initialUrl);
  
  // Count open pages before clicking
  const pagesBefore = context.pages().length;
  console.log('Number of pages before clicking:', pagesBefore);
  
  // Scroll to bottom of sidebar
  await page.evaluate(() => {
    const sidebar = document.querySelector('[data-sidebar="sidebar"]');
    if (sidebar) {
      sidebar.scrollTop = sidebar.scrollHeight;
    }
  });
  
  await page.waitForTimeout(1000);
  
  // Find and click the Dashboard link
  console.log('Looking for "Dashboard" link...');
  const customLink = await page.locator('a:has-text("Dashboard")').first();
  const isVisible = await customLink.isVisible().catch(() => false);
  
  if (isVisible) {
    console.log('Found "Dashboard" link, scrolling into view...');
    await customLink.scrollIntoViewIfNeeded();
    await customLink.hover();
    await page.waitForTimeout(1000);
    
    // Verify link attributes before clicking
    const href = await customLink.getAttribute('href');
    const target = await customLink.getAttribute('target');
    console.log(`Link attributes before click: href="${href}", target="${target}"`);
    
    console.log('Clicking "Dashboard" link...');
    await customLink.click();
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForTimeout(2000);
    
    // Check URL after navigation
    const newUrl = page.url();
    console.log('URL after click:', newUrl);
    
    // Count pages after clicking
    const pagesAfter = context.pages().length;
    console.log('Number of pages after clicking:', pagesAfter);
    
    // Verify navigation happened in current tab
    if (pagesAfter === pagesBefore) {
      console.log('SUCCESS: No new tab opened - navigation occurred in current tab');
    } else {
      console.log('FAIL: New tab was opened');
    }
    
    // Verify URL changed to root
    if (newUrl === 'http://localhost:4000/' || newUrl.endsWith('/')) {
      console.log('SUCCESS: Navigated to root path (/)');
    } else {
      console.log('WARNING: Expected root path, got:', newUrl);
    }
    
    // Wait to capture the new page in the video
    await page.waitForTimeout(2000);
    
  } else {
    console.log('FAIL: "Dashboard" link not found');
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
