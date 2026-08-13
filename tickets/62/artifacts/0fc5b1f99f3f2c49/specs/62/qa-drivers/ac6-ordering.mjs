#!/usr/bin/env node
/**
 * AC6: Links maintain consistent ordering
 * 
 * Verifies that custom links appear in the order they are defined
 * in the configuration array.
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

    console.log('Extract link order...');
    const linkOrder = await page.evaluate(() => {
      const footer = document.querySelector('[data-sidebar="footer"]');
      const customLinksUL = footer.querySelector('ul[data-sidebar="menu"]');
      const buttons = Array.from(customLinksUL.querySelectorAll('button[data-sidebar="menu-button"]'));
      
      return buttons.map((btn, i) => ({
        position: i + 1,
        label: btn.textContent.trim()
      }));
    });

    const expectedOrder = [
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

    console.log('\nVerifying order...');
    let allCorrect = true;
    for (let i = 0; i < expectedOrder.length; i++) {
      if (linkOrder[i].label === expectedOrder[i]) {
        console.log(`✓ Position ${i + 1}: ${expectedOrder[i]}`);
      } else {
        console.log(`✗ Position ${i + 1}: Expected "${expectedOrder[i]}", got "${linkOrder[i].label}"`);
        allCorrect = false;
      }
    }

    if (allCorrect) {
      console.log('\nAC6 PASS: Links maintain correct ordering');
    } else {
      console.log('\nAC6 FAIL: Link order does not match configuration');
    }
    
    await context.close();
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
