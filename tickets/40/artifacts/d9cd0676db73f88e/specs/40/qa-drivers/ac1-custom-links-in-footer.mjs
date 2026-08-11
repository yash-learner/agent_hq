#!/usr/bin/env node
import { chromium } from 'playwright';

console.log('=== AC1: Custom links from care.config.ts appear in SidebarFooter ===');
console.log('Starting browser...');

const browser = await chromium.launch({ headless: true });

try {
  const size = { width: 1440, height: 900 };
  
  console.log('Creating browser context with auth storage state...');
  const context = await browser.newContext({
    storageState: 'tests/.auth/user.json',
    viewport: size,
    recordVideo: { dir: '.agent-hq/pw-videos', size }
  });
  
  const page = await context.newPage();
  
  console.log('Enabling screencast actions...');
  await page.screencast.showActions({ cursor: 'pointer' });
  
  console.log('Navigating to root page...');
  await page.goto('http://localhost:4000/', { waitUntil: 'networkidle', timeout: 30000 });
  
  console.log('Current URL:', page.url());
  
  // Wait a bit for the page to fully render
  await page.waitForTimeout(3000);
  
  // Check if we're on the login page or facilities page
  const isLoginPage = await page.locator('text=Log in as Staff, text=Log in as Patient').first().isVisible().catch(() => false);
  console.log('Is login page?', isLoginPage);
  
  if (isLoginPage) {
    console.log('On login page, logging in with admin/admin...');
    await page.getByRole('textbox', { name: /username/i }).fill('admin');
    await page.getByRole('textbox', { name: /password/i }).fill('admin');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(2000);
    console.log('After login URL:', page.url());
  }
  
  // Wait for facilities to load
  console.log('Looking for facilities list or facility context...');
  const facilitiesText = await page.locator('text=Facilities').first().isVisible({ timeout: 5000 }).catch(() => false);
  
  if (facilitiesText) {
    console.log('Found facilities list, clicking on first facility...');
    const facilityLink = await page.locator('a[href*="/facility/"]').first();
    await facilityLink.waitFor({ state: 'visible', timeout: 15000 });
    await facilityLink.click();
    
    console.log('Waiting for facility page to load...');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(2000);
  }
  
  console.log('Current URL:', page.url());
  
  // Verify authenticated shell - wait for sidebar
  console.log('Verifying authenticated shell and sidebar...');
  const sidebar = await page.locator('[data-sidebar="sidebar"]').first();
  await sidebar.waitFor({ state: 'visible', timeout: 15000 });
  console.log('Sidebar found');
  
  // Scroll to bottom of sidebar to see footer
  console.log('Scrolling to bottom of sidebar to view footer...');
  await page.evaluate(() => {
    const sidebar = document.querySelector('[data-sidebar="sidebar"]');
    if (sidebar) {
      sidebar.scrollTop = sidebar.scrollHeight;
    }
  });
  
  await page.waitForTimeout(1000);
  
  // Look for custom link in sidebar footer
  console.log('Looking for "Support Portal" custom link in sidebar footer...');
  
  // Try different selectors
  let customLink = await page.locator('text="Support Portal"').first();
  let isVisible = await customLink.isVisible().catch(() => false);
  
  if (!isVisible) {
    // Try as a link
    customLink = await page.locator('a:has-text("Support Portal")').first();
    isVisible = await customLink.isVisible().catch(() => false);
  }
  
  if (!isVisible) {
    // Try in sidebar footer specifically
    customLink = await page.locator('[data-sidebar="footer"] >> text="Support Portal"').first();
    isVisible = await customLink.isVisible().catch(() => false);
  }
  
  if (isVisible) {
    console.log('SUCCESS: "Support Portal" link found in sidebar footer');
    
    // Verify it has external link icon
    const parent = await customLink.locator('..').first();
    const svgCount = await parent.locator('svg').count();
    console.log(`Icon SVG elements found: ${svgCount}`);
    
    // Highlight the link for video
    await customLink.scrollIntoViewIfNeeded();
    await customLink.hover();
    await page.waitForTimeout(2000);
    
    // Try to inspect the link attributes
    const href = await customLink.getAttribute('href').catch(() => null);
    const target = await customLink.getAttribute('target').catch(() => null);
    const rel = await customLink.getAttribute('rel').catch(() => null);
    console.log(`Link attributes: href="${href}", target="${target}", rel="${rel}"`);
  } else {
    console.log('FAIL: "Support Portal" link not found as visible element');
    
    // Debug: Take a screenshot
    await page.screenshot({ path: '.agent-hq/debug-sidebar.png', fullPage: false });
    console.log('Screenshot saved to .agent-hq/debug-sidebar.png');
    
    // Debug: list all links in sidebar footer
    const footerLinks = await page.evaluate(() => {
      const sidebar = document.querySelector('[data-sidebar="sidebar"]');
      if (sidebar) {
        const footer = sidebar.querySelector('[data-sidebar="footer"]');
        if (footer) {
          const links = footer.querySelectorAll('a');
          return Array.from(links).map(a => ({
            text: a.textContent?.trim(),
            href: a.getAttribute('href'),
            target: a.getAttribute('target')
          }));
        }
      }
      return [];
    });
    console.log('Footer links found:', JSON.stringify(footerLinks, null, 2));
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
