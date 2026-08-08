#!/usr/bin/env node
/**
 * AC2: NABH Certification link appears when REACT_NAV_NABH_LINK is set
 * Tests that when REACT_NAV_NABH_LINK is configured, a "NABH Certification" link
 * appears in facility sidebar, admin sidebar, and user dropdown.
 */

import { chromium } from 'playwright';

const facilityId = '6b3b3230-518f-45b1-82d4-484d9ecd62ce';
const size = { width: 1440, height: 900 };

async function main() {
  console.log('=== AC2: NABH Certification link appears when REACT_NAV_NABH_LINK is set ===\n');
  
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
    
    // Step 2: Check facility sidebar for NABH Certification link
    console.log('\nStep 2: Checking facility sidebar for NABH Certification link');
    const sidebar = await page.locator('[data-sidebar="sidebar"]');
    await sidebar.scrollIntoViewIfNeeded();
    
    const nabhLink = await page.locator('a:has-text("NABH Certification")').first();
    const nabhLinkVisible = await nabhLink.isVisible();
    if (!nabhLinkVisible) {
      throw new Error('❌ NABH Certification link not found in facility sidebar');
    }
    console.log('✓ NABH Certification link visible in facility sidebar');
    
    // Check the icon
    const hasIcon = await nabhLink.locator('svg').count() > 0;
    console.log(`✓ NABH Certification link has icon: ${hasIcon}`);
    
    // Hover to show the link clearly
    await nabhLink.hover();
    await page.waitForTimeout(1500);
    
    // Step 3: Navigate to admin page
    console.log('\nStep 3: Navigating to admin page');
    await page.goto('http://localhost:4000/admin/questionnaire', { waitUntil: 'networkidle' });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Step 4: Check admin sidebar for NABH Certification link
    console.log('\nStep 4: Checking admin sidebar for NABH Certification link');
    const adminNabhLink = await page.locator('a:has-text("NABH Certification")').first();
    const adminNabhLinkVisible = await adminNabhLink.isVisible();
    if (!adminNabhLinkVisible) {
      throw new Error('❌ NABH Certification link not found in admin sidebar');
    }
    console.log('✓ NABH Certification link visible in admin sidebar');
    
    // Hover to show the link clearly
    await adminNabhLink.hover();
    await page.waitForTimeout(1500);
    
    // Step 5: Open user dropdown
    console.log('\nStep 5: Opening user dropdown menu');
    const userMenuButton = page.locator('[data-sidebar="footer"] button[data-sidebar="menu-button"]').first();
    await userMenuButton.waitFor({ state: 'visible', timeout: 10000 });
    await userMenuButton.click();
    await page.waitForTimeout(1000);
    
    // Step 6: Check user dropdown for NABH Certification link
    console.log('\nStep 6: Checking user dropdown for NABH Certification link');
    const dropdownNabhLink = await page.locator('[role="menuitem"]:has-text("NABH Certification")').count();
    if (dropdownNabhLink === 0) {
      throw new Error('❌ NABH Certification link not found in user dropdown');
    }
    console.log('✓ NABH Certification link visible in user dropdown');
    
    // Hover over the NABH Certification link in dropdown
    await page.locator('[role="menuitem"]:has-text("NABH Certification")').first().hover();
    await page.waitForTimeout(2000);
    
    console.log('\n=== AC2 PASSED ===');
    console.log('NABH Certification link appears in facility sidebar, admin sidebar, and user dropdown');
    
    await page.close();
    await context.close();
  } catch (error) {
    console.error('\n❌ AC2 FAILED:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error('Driver failed:', error);
  process.exit(1);
});
