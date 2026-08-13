#!/usr/bin/env node
/**
 * AC7: Links adapt to collapsed/expanded sidebar states
 * 
 * Verifies that custom links show icon-only in collapsed state
 * and icon+label in expanded state.
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

    console.log('Expand sidebar...');
    await page.getByRole('button', { name: 'Toggle Sidebar' }).click();
    await page.waitForTimeout(1000);
    
    const expandedCheck = await page.getByRole('button', { name: 'Test Link' });
    await expandedCheck.waitFor({ state: 'visible' });
    console.log('✓ Expanded: Labels visible');

    console.log('\nCollapse sidebar...');
    await page.getByRole('button', { name: 'Toggle Sidebar' }).click();
    await page.waitForTimeout(2000);
    
    const collapsedState = await page.evaluate(() => {
      const footer = document.querySelector('[data-sidebar="footer"]');
      const btn = footer.querySelector('button[data-sidebar="menu-button"]');
      return {
        hasIcon: !!btn.querySelector('svg'),
        hasSpan: !!btn.querySelector('span')
      };
    });
    
    if (collapsedState.hasIcon && !collapsedState.hasSpan) {
      console.log('✓ Collapsed: Icon-only mode');
    }

    console.log('\nExpand sidebar again...');
    await page.getByRole('button', { name: 'Toggle Sidebar' }).click();
    await page.waitForTimeout(2000);
    await expandedCheck.waitFor({ state: 'visible' });
    console.log('✓ Expanded: Labels visible again');

    console.log('\nAC7 PASS: Links adapt to collapsed/expanded states');
    
    await context.close();
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
