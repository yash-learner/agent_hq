#!/usr/bin/env node
import { chromium } from 'playwright';

console.log('=== AC2: Internal route links display internal link icon ===');
console.log('Starting browser...');

const browser = await chromium.launch({ headless: true });

try {
  const size = { width: 1440, height: 900 };
  
  console.log('Creating browser context with auth storage state...');
  const context = await browser.newContext({
    storageState: 'tests/.auth/user.json',
    viewport: size,
    recordVideo: { dir: '.agent-hq/pw-videos-ac2', size }
  });
  
  const page = await context.newPage();
  
  console.log('Enabling screencast actions...');
  await page.screencast.showActions({ cursor: 'pointer' });
  
  console.log('Navigating to root page...');
  await page.goto('http://localhost:4000/', { waitUntil: 'networkidle', timeout: 30000 });
  
  console.log('Current URL:', page.url());
  await page.waitForTimeout(3000);
  
  // Navigate to facility context
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
  
  // Verify sidebar is present
  console.log('Verifying sidebar...');
  const sidebar = await page.locator('[data-sidebar="sidebar"]').first();
  await sidebar.waitFor({ state: 'visible', timeout: 15000 });
  console.log('Sidebar found');
  
  // Scroll to bottom of sidebar
  console.log('Scrolling to bottom of sidebar...');
  await page.evaluate(() => {
    const sidebar = document.querySelector('[data-sidebar="sidebar"]');
    if (sidebar) {
      sidebar.scrollTop = sidebar.scrollHeight;
    }
  });
  
  await page.waitForTimeout(1000);
  
  // Look for internal route custom link
  console.log('Looking for "Dashboard" internal route link in sidebar footer...');
  
  const customLink = await page.locator('a:has-text("Dashboard")').first();
  const isVisible = await customLink.isVisible().catch(() => false);
  
  if (isVisible) {
    console.log('SUCCESS: "Dashboard" link found in sidebar footer');
    
    // Verify link attributes
    const href = await customLink.getAttribute('href').catch(() => null);
    const target = await customLink.getAttribute('target').catch(() => null);
    console.log(`Link attributes: href="${href}", target="${target}"`);
    
    // Verify it has internal link icon (Link2, not ExternalLink)
    // Check the SVG data-lucide attribute or class
    const iconInfo = await page.evaluate(() => {
      // Find all links in the footer
      const sidebar = document.querySelector('[data-sidebar="sidebar"]');
      if (!sidebar) return null;
      
      const footer = sidebar.querySelector('[data-sidebar="footer"]');
      if (!footer) return null;
      
      // Find the Dashboard link by text content
      const links = Array.from(footer.querySelectorAll('a'));
      const dashboardLink = links.find(a => a.textContent && a.textContent.includes('Dashboard'));
      
      if (!dashboardLink) return { found: false, reason: 'Link not found' };
      
      const svg = dashboardLink.querySelector('svg');
      if (!svg) return { found: false, reason: 'No SVG icon' };
      
      // Lucide icons typically have data-lucide attribute
      const lucideType = svg.getAttribute('data-lucide');
      const svgHTML = svg.outerHTML;
      
      return {
        found: true,
        lucideType,
        hasExternalClass: svgHTML.includes('external') || svgHTML.includes('ExternalLink'),
        hasInternalClass: svgHTML.includes('Link2') || svgHTML.includes('link-2'),
        innerHTML: svgHTML.substring(0, 300)
      };
    });
    
    console.log('Icon info:', JSON.stringify(iconInfo, null, 2));
    
    if (iconInfo && iconInfo.found) {
      console.log('Icon SVG found');
      // Link2 icon should NOT have 'external' in it
      if (!iconInfo.hasExternalClass) {
        console.log('SUCCESS: Link uses internal icon (not external link icon)');
      } else {
        console.log('WARNING: Link might be using external icon instead of internal');
      }
      
      if (iconInfo.hasInternalClass) {
        console.log('SUCCESS: Link2 internal icon class detected');
      }
    } else {
      console.log('WARNING: Could not verify icon type:', iconInfo?.reason);
    }
    
    // Highlight the link for video
    await customLink.scrollIntoViewIfNeeded();
    await customLink.hover();
    await page.waitForTimeout(2000);
    
  } else {
    console.log('FAIL: "Dashboard" link not found in sidebar footer');
    
    // Debug
    const footerLinks = await page.evaluate(() => {
      const sidebar = document.querySelector('[data-sidebar="sidebar"]');
      if (sidebar) {
        const footer = sidebar.querySelector('[data-sidebar="footer"]');
        if (footer) {
          const links = footer.querySelectorAll('a');
          return Array.from(links).map(a => ({
            text: a.textContent?.trim(),
            href: a.getAttribute('href')
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
