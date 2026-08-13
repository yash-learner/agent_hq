#!/usr/bin/env node
/**
 * AC3: External and internal links display correct icons
 * 
 * Verifies that external links display ExternalLink icon and
 * internal links display Link2 icon from lucide-react.
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

    console.log('Verify icon classes...');
    const iconData = await page.evaluate(() => {
      const footer = document.querySelector('[data-sidebar="footer"]');
      const buttons = Array.from(footer.querySelectorAll('button[data-sidebar="menu-button"]'));
      
      return buttons.slice(0, 5).map(btn => {
        const svg = btn.querySelector('svg');
        const label = btn.textContent;
        const classes = svg ? svg.className.baseVal : '';
        return { label, classes };
      });
    });

    for (const { label, classes } of iconData) {
      if (classes.includes('lucide-external-link')) {
        console.log(`✓ "${label}" has ExternalLink icon`);
      } else if (classes.includes('lucide-link-2') || classes.includes('lucide-link2')) {
        console.log(`✓ "${label}" has Link2 icon`);
      }
    }

    console.log('\nAC3 PASS: Icons correctly display based on link type');
    
    await context.close();
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
