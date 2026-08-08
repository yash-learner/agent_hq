#!/usr/bin/env node
/**
 * AC7: No env vars configured means no extra links
 * Tests that when REACT_NAV_DOCS_LINK and REACT_NAV_NABH_LINK are not set,
 * no extra navigation links appear in facility sidebar, admin sidebar, or user dropdown.
 */

import { chromium } from 'playwright';
import { readFileSync } from 'fs';

const facilityId = '6b3b3230-518f-45b1-82d4-484d9ecd62ce';
const size = { width: 1440, height: 900 };

async function main() {
  console.log('=== AC7: No env vars configured means no extra links ===\n');
  
  const browser = await chromium.launch({ headless: true });
  
  try {
    // Load authenticated session
    console.log('Loading authenticated session from tests/.auth/user.json');
    const context = await browser.newContext({
      storageState: 'tests/.auth/user.json',
      viewport: size,
      recordVideo: { dir: '.agent-hq/pw-videos', size },
    });
    
    const page = await context.newPage();
    
    // Enable cursor/click overlay
    await page.screencast.showActions({ cursor: 'pointer' });
    console.log('Cursor overlay enabled for screencast');
    
    // Step 1: Navigate to facility page
    const facilityUrl = `http://localhost:4000/facility/${facilityId}/overview`;
    console.log(`\nStep 1: Navigating to ${facilityUrl}`);
    await page.goto(facilityUrl, { waitUntil: 'networkidle' });
    
    // Auth shell readiness check
    console.log('Checking auth shell readiness...');
    await page.waitForLoadState('networkidle');
    
    // Wait for sidebar to be visible
    await page.waitForSelector('[data-sidebar="sidebar"]', { timeout: 15000 });
    console.log('✓ Sidebar visible');
    
    // Check for login UI (should not be present)
    const loginButton = await page.locator('text="Sign in"').count();
    if (loginButton > 0) {
      throw new Error('Login UI present on facility page - auth failure');
    }
    console.log('✓ No login UI present');
    
    // Step 2: Scroll through facility sidebar and check for extra links
    console.log('\nStep 2: Checking facility sidebar for extra links');
    const sidebar = await page.locator('[data-sidebar="sidebar"]');
    await sidebar.scrollIntoViewIfNeeded();
    
    // Check for Documentation link
    const docsLink = await page.locator('text="Documentation"').count();
    console.log(`Documentation link count in facility sidebar: ${docsLink}`);
    if (docsLink > 0) {
      throw new Error('❌ Documentation link found but should not be present');
    }
    console.log('✓ No Documentation link in facility sidebar');
    
    // Check for NABH Certification link
    const nabhLink = await page.locator('text="NABH Certification"').count();
    console.log(`NABH Certification link count in facility sidebar: ${nabhLink}`);
    if (nabhLink > 0) {
      throw new Error('❌ NABH Certification link found but should not be present');
    }
    console.log('✓ No NABH Certification link in facility sidebar');
    
    // Take a moment to show the facility sidebar
    await page.waitForTimeout(1000);
    
    // Step 3: Navigate to admin page
    console.log('\nStep 3: Navigating to admin page');
    await page.goto('http://localhost:4000/admin/questionnaire', { waitUntil: 'networkidle' });
    await page.waitForLoadState('networkidle');
    
    // Step 4: Check admin sidebar
    console.log('\nStep 4: Checking admin sidebar for extra links');
    const adminDocsLink = await page.locator('text="Documentation"').count();
    console.log(`Documentation link count in admin sidebar: ${adminDocsLink}`);
    if (adminDocsLink > 0) {
      throw new Error('❌ Documentation link found in admin sidebar but should not be present');
    }
    console.log('✓ No Documentation link in admin sidebar');
    
    const adminNabhLink = await page.locator('text="NABH Certification"').count();
    console.log(`NABH Certification link count in admin sidebar: ${adminNabhLink}`);
    if (adminNabhLink > 0) {
      throw new Error('❌ NABH Certification link found in admin sidebar but should not be present');
    }
    console.log('✓ No NABH Certification link in admin sidebar');
    
    await page.waitForTimeout(1000);
    
    // Step 5: Open user dropdown
    console.log('\nStep 5: Opening user dropdown menu');
    // The user dropdown is in the sidebar footer with data-state attribute
    // Look for button with avatar (has "AU" or similar initials)
    const userMenuButton = page.locator('[data-sidebar="footer"] button[data-sidebar="menu-button"]').first();
    await userMenuButton.waitFor({ state: 'visible', timeout: 10000 });
    await userMenuButton.click();
    await page.waitForTimeout(1000);
    
    // Step 6: Check user dropdown for extra links
    console.log('\nStep 6: Checking user dropdown for extra links');
    const dropdownDocsLink = await page.locator('text="Documentation"').count();
    console.log(`Documentation link count in user dropdown: ${dropdownDocsLink}`);
    if (dropdownDocsLink > 0) {
      throw new Error('❌ Documentation link found in user dropdown but should not be present');
    }
    console.log('✓ No Documentation link in user dropdown');
    
    const dropdownNabhLink = await page.locator('text="NABH Certification"').count();
    console.log(`NABH Certification link count in user dropdown: ${dropdownNabhLink}`);
    if (dropdownNabhLink > 0) {
      throw new Error('❌ NABH Certification link found in user dropdown but should not be present');
    }
    console.log('✓ No NABH Certification link in user dropdown');
    
    await page.waitForTimeout(2000);
    
    console.log('\n=== AC7 PASSED ===');
    console.log('No extra navigation links appear when environment variables are not configured');
    
    await page.close();
    await context.close();
  } catch (error) {
    console.error('\n❌ AC7 FAILED:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error('Driver failed:', error);
  process.exit(1);
});
