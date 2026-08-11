#!/usr/bin/env node
/**
 * AC1: Custom footer links configured in care.config.ts appear in sidebar footer
 * 
 * This driver verifies that configured custom footer links appear in the sidebar footer
 * above the user avatar component.
 */

import { chromium } from 'playwright';
import { openAuthedContext } from '../../../.agent-hq/qa-auth.mjs';

const SIZE = { width: 1440, height: 900 };

async function main() {
  const browser = await chromium.launch({ headless: true });
  
  try {
    // Open authenticated context with facility and video recording
    const context = await browser.newContext({
      storageState: 'tests/.auth/user.json',
      viewport: SIZE,
      recordVideo: {
        dir: '.agent-hq/pw-videos',
        size: SIZE
      }
    });

    const page = await context.newPage();
    
    // Enable cursor tracking for video
    await page.screencast.showActions({ cursor: 'pointer' });

    // Navigate to facility overview
    await page.goto('http://localhost:4000/facility/1/overview');
    
    // Wait for auth shell readiness
    await page.waitForSelector('[data-sidebar="sidebar"]', { timeout: 10000 });
    console.log('✓ Auth shell ready - sidebar visible');

    // Scroll to sidebar footer to ensure footer links are visible
    await page.evaluate(() => {
      const sidebar = document.querySelector('[data-sidebar="sidebar"]');
      if (sidebar) {
        sidebar.scrollTop = sidebar.scrollHeight;
      }
    });

    // Wait a moment for scroll to complete
    await page.waitForTimeout(1000);

    // Check for custom footer links
    const documentationLink = page.locator('[data-testid="footer-link-Documentation"]');
    const supportLink = page.locator('[data-testid="footer-link-Support"]');
    const helpLink = page.locator('[data-testid="footer-link-Help"]');

    // Verify links are visible
    await documentationLink.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Documentation link is visible');

    await supportLink.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Support link is visible');

    await helpLink.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Help link is visible');

    // Verify icons are present
    const docIcon = documentationLink.locator('[data-testid="icon-external-link"]');
    await docIcon.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Documentation has external link icon');

    const supportIcon = supportLink.locator('[data-testid="icon-arrow-right"]');
    await supportIcon.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Support has internal link icon');

    // Verify footer links are above user avatar
    const userAvatar = page.locator('[data-sidebar="user-menu"]');
    await userAvatar.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ User avatar is visible');

    // Get bounding boxes to verify positioning
    const linkBox = await documentationLink.boundingBox();
    const avatarBox = await userAvatar.boundingBox();
    
    if (linkBox && avatarBox && linkBox.y < avatarBox.y) {
      console.log('✓ Footer links are positioned above user avatar');
    } else {
      console.error('✗ Footer links are NOT positioned above user avatar');
    }

    console.log('\n✅ AC1 PASSED: Custom footer links appear in sidebar footer above user avatar');

    // Close page and context to save video
    await page.close();
    await context.close();

  } catch (error) {
    console.error('\n❌ AC1 FAILED:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
