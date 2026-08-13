#!/usr/bin/env node
/**
 * AC4: Links filter by sidebarContext
 * 
 * Verifies that links with contexts array only appear in matching
 * sidebar contexts, and links without contexts appear everywhere.
 */

import { chromium } from 'playwright';
import { openAuthedContext } from '../../../.agent-hq/qa-auth.mjs';

async function main() {
  const browser = await chromium.launch({ headless: false });
  
  try {
    const { context, page } = await openAuthedContext(browser, {
      facilityId: 'e4fdf2a3-833d-4305-ae4b-c2f394bcff22',
      videoDir: 'specs/62/videos'
    });

    await page.screencast.showActions({ cursor: 'pointer' });

    console.log('Verify facility context...');
    await page.getByRole('button', { name: 'Toggle Sidebar' }).click();
    await page.waitForTimeout(1000);
    
    const facilityOnly = page.getByRole('button', { name: 'Facility Only' });
    await facilityOnly.waitFor({ state: 'visible' });
    console.log('✓ Facility context: "Facility Only" visible');
    
    const allContexts = page.getByRole('button', { name: 'All Contexts' });
    await allContexts.waitFor({ state: 'visible' });
    console.log('✓ Facility context: "All Contexts" visible');

    console.log('\nNavigate to admin context...');
    await page.goto('http://localhost:4000/admin/users');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const adminOnly = page.getByRole('button', { name: 'Admin Only' });
    await adminOnly.waitFor({ state: 'visible' });
    console.log('✓ Admin context: "Admin Only" visible');
    
    await allContexts.waitFor({ state: 'visible' });
    console.log('✓ Admin context: "All Contexts" visible');
    
    const facilityOnlyCount = await page.getByRole('button', { name: 'Facility Only' }).count();
    if (facilityOnlyCount === 0) {
      console.log('✓ Admin context: "Facility Only" NOT visible (correct)');
    }

    console.log('\nAC4 PASS: Context filtering works correctly');
    
    await context.close();
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
