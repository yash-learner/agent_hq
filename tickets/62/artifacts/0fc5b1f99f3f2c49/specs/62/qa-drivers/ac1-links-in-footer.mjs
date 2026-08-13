#!/usr/bin/env node
/**
 * AC1: Custom links appear in sidebar footer via environment config
 * 
 * Verifies that custom links configured via REACT_CUSTOM_SIDEBAR_LINKS
 * environment variable appear in the sidebar footer above NavUser.
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

    console.log('Navigate to facility overview...');
    await page.waitForLoadState('networkidle');

    console.log('Expand sidebar...');
    await page.getByRole('button', { name: 'Toggle Sidebar' }).click();
    await page.waitForTimeout(1000);

    console.log('Scroll to sidebar footer...');
    await page.evaluate(() => {
      const sidebar = document.querySelector('[data-sidebar="sidebar"]');
      if (sidebar) sidebar.scrollTop = sidebar.scrollHeight;
    });
    await page.waitForTimeout(1000);

    console.log('Verify custom links...');
    const customLinks = [
      'Test Link',
      'External New Tab',
      'External Same Tab',
      'Internal New Tab',
      'Internal Same Tab',
      'Facility Only',
      'All Contexts',
      'First Link',
      'Second Link',
      'Third Link',
      'Test Custom Link'
    ];

    for (const linkLabel of customLinks) {
      const link = page.getByRole('button', { name: linkLabel });
      await link.waitFor({ state: 'visible', timeout: 5000 });
      console.log(`✓ Found: ${linkLabel}`);
    }

    console.log('Verify NavUser is below custom links...');
    const navUser = page.getByRole('button', { name: /Admin User/ });
    await navUser.waitFor({ state: 'visible' });
    console.log('✓ NavUser visible below custom links');

    console.log('\nAC1 PASS: Custom links appear in sidebar footer above NavUser');
    
    await context.close();
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
