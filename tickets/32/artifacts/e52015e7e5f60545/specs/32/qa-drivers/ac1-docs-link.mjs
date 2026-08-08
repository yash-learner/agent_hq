#!/usr/bin/env node
/**
 * AC1: Documentation link appears when REACT_NAV_DOCS_LINK is set
 * Tests that when REACT_NAV_DOCS_LINK is configured, a "Documentation" link
 * appears in facility sidebar, admin sidebar, and user dropdown.
 */

import { chromium } from 'playwright';

const facilityId = '6b3b3230-518f-45b1-82d4-484d9ecd62ce';
const size = { width: 1440, height: 900 };

async function main() {
  console.log('=== AC1: Documentation link appears when REACT_NAV_DOCS_LINK is set ===\n');
  
  const browser = await chromium.launch({ headless: true });
  
  try {
    console.log('Loading authenticated session from tests/.auth/user.json');
    const context = await browser.newContext({
      storageState: 'tests/.auth/user.json',
      viewport: size,
      recordVideo: { dir: '.agent-hq/pw-videos', size },
    });
    
    const page = await context.newPage();
    await page.screencast.showActions({ cursor: 'pointer' });
    console.log('Cursor overlay enabled for screencast');
    
    // Step 1: Navigate to facility page
    const facilityUrl = `http://localhost:4000/facility/${facilityId}/overview`;
    console.log(`\nStep 1: Navigating to ${facilityUrl}`);
    await page.goto(facilityUrl, { waitUntil: 'networkidle' });
    
    // Auth shell readiness check
    console.log('Checking auth shell readiness...');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-sidebar="sidebar"]', { timeout: 15000 });
    console.log('✓ Sidebar visible');
    
    const loginButton = await page.locator('text="Sign in"').count();
    if (loginButton > 0) {
      throw new Error('Login UI present on facility page - auth failure');
    }
    console.log('✓ No login UI present');
    
    // Step 2: Check facility sidebar for Documentation link
    console.log('\nStep 2: Checking facility sidebar for Documentation link');
    const sidebar = await page.locator('[data-sidebar="sidebar"]');
    await sidebar.scrollIntoViewIfNeeded();
    
    const docsLink = await page.locator('a:has-text("Documentation")').first();
    const docsLinkVisible = await docsLink.isVisible();
    if (!docsLinkVisible) {
      throw new Error('❌ Documentation link not found in facility sidebar');
    }
    console.log('✓ Documentation link visible in facility sidebar');
    
    // Check the icon
    const hasBookIcon = await docsLink.locator('svg').count() > 0;
    console.log(`✓ Documentation link has icon: ${hasBookIcon}`);
    
    // Hover to show the link clearly
    await docsLink.hover();
    await page.waitForTimeout(1500);
    
    // Step 3: Navigate to admin page
    console.log('\nStep 3: Navigating to admin page');
    await page.goto('http://localhost:4000/admin/questionnaire', { waitUntil: 'networkidle' });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Step 4: Check admin sidebar for Documentation link
    console.log('\nStep 4: Checking admin sidebar for Documentation link');
    const adminDocsLink = await page.locator('a:has-text("Documentation")').first();
    const adminDocsLinkVisible = await adminDocsLink.isVisible();
    if (!adminDocsLinkVisible) {
      throw new Error('❌ Documentation link not found in admin sidebar');
    }
    console.log('✓ Documentation link visible in admin sidebar');
    
    // Hover to show the link clearly
    await adminDocsLink.hover();
    await page.waitForTimeout(1500);
    
    // Step 5: Open user dropdown
    console.log('\nStep 5: Opening user dropdown menu');
    const userMenuButton = page.locator('[data-sidebar="footer"] button[data-sidebar="menu-button"]').first();
    await userMenuButton.waitFor({ state: 'visible', timeout: 10000 });
    await userMenuButton.click();
    await page.waitForTimeout(1000);
    
    // Step 6: Check user dropdown for Documentation link
    console.log('\nStep 6: Checking user dropdown for Documentation link');
    const dropdownDocsLink = await page.locator('[role="menuitem"]:has-text("Documentation")').count();
    if (dropdownDocsLink === 0) {
      throw new Error('❌ Documentation link not found in user dropdown');
    }
    console.log('✓ Documentation link visible in user dropdown');
    
    // Hover over the documentation link in dropdown
    await page.locator('[role="menuitem"]:has-text("Documentation")').first().hover();
    await page.waitForTimeout(2000);
    
    console.log('\n=== AC1 PASSED ===');
    console.log('Documentation link appears in facility sidebar, admin sidebar, and user dropdown');
    
    await page.close();
    await context.close();
  } catch (error) {
    console.error('\n❌ AC1 FAILED:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error('Driver failed:', error);
  process.exit(1);
});
