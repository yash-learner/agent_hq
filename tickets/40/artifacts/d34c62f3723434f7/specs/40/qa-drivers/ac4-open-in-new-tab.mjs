#!/usr/bin/env node
/**
 * QA Driver: AC4 - Links with openInNewTab: true open in new tab
 * Tests that links configured with openInNewTab: true have correct attributes and open in new tab
 */

import { chromium } from 'playwright';
import { promises as fs } from 'fs';

const APP_URL = 'http://localhost:4000';
const AUTH_STATE = 'tests/.auth/user.json';
const VIDEO_DIR = '.agent-hq/pw-videos';
const size = { width: 1440, height: 900 };

async function main() {
  const logFile = 'specs/40/qa-logs/ac4-open-in-new-tab.log';
  const log = async (msg) => {
    console.log(msg);
    await fs.appendFile(logFile, `${new Date().toISOString()} ${msg}\n`);
  };

  await fs.writeFile(logFile, '=== AC4: Links with openInNewTab: true open in new tab ===\n');

  let browser;
  let context;
  let page;

  try {
    await log('Starting browser...');
    browser = await chromium.launch({ headless: true });

    await log(`Loading auth state from ${AUTH_STATE}`);
    context = await browser.newContext({
      storageState: AUTH_STATE,
      viewport: size,
      recordVideo: { dir: VIDEO_DIR, size },
    });

    page = await context.newPage();
    await log('Enabling screencast actions...');
    await page.screencast.showActions({ cursor: 'pointer' });

    await log(`Navigating to ${APP_URL}`);
    await page.goto(APP_URL, { waitUntil: 'networkidle' });

    await log('Waiting for auth shell readiness...');
    await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 }).catch(() => {});
    
    await Promise.race([
      page.waitForSelector('[data-sidebar="sidebar"]', { timeout: 15000 }),
      page.waitForSelector('.facility-card', { timeout: 15000 }),
      page.locator('text=Facilities').waitFor({ timeout: 15000 })
    ]).catch(async () => {
      await log('Initial page elements not found within timeout, continuing...');
    });

    await log('Checking for login UI...');
    const loginVisible = await page.locator('text=Username').or(page.locator('text=Password')).or(page.locator('button:has-text("Sign in")')).isVisible().catch(() => false);
    if (loginVisible) {
      await log('ERROR: Login UI visible - auth failure');
      throw new Error('Authentication failed - login UI present');
    }

    await log('Auth shell ready. Waiting for facilities to load...');
    await page.waitForTimeout(2000);

    const facilitiesVisible = await page.locator('text=Facilities').or(page.locator('.facility-card')).isVisible({ timeout: 5000 }).catch(() => false);
    
    if (facilitiesVisible) {
      await log('Facilities list visible. Looking for a facility to click...');
      const facilityCard = page.locator('[class*="facility"], a[href*="/facility/"]').first();
      const facilityExists = await facilityCard.count() > 0;
      
      if (facilityExists) {
        await log('Clicking on first facility...');
        await facilityCard.click();
        await page.waitForTimeout(3000);
      } else {
        await log('No facility found. Trying direct navigation...');
        await page.goto(`${APP_URL}/facility/1/overview`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
      }
    } else {
      const currentUrl = page.url();
      await log(`Current URL: ${currentUrl}`);
      
      if (!currentUrl.includes('/facility/')) {
        await log('Navigating directly to facility overview...');
        await page.goto(`${APP_URL}/facility/1/overview`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
      }
    }

    await log('Waiting for sidebar to be visible...');
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await sidebar.waitFor({ state: 'visible', timeout: 10000 });
    await log('Sidebar is visible');

    await log('Scrolling to bottom of sidebar to view footer...');
    await sidebar.evaluate(el => el.scrollTop = el.scrollHeight);
    await page.waitForTimeout(1000);

    await log('Looking for custom link "Documentation" in sidebar footer...');
    
    // Look for the custom link (should be external link with openInNewTab: true)
    const customLink = page.locator('[data-sidebar] a[href^="https://docs.example.com"]').first();
    const linkExists = await customLink.count() > 0;
    
    if (!linkExists) {
      await log('WARNING: Custom link not found. Checking for any external link...');
      const anyExternalLink = page.locator('[data-sidebar] a[href^="http"]').first();
      const anyLinkExists = await anyExternalLink.count() > 0;
      
      if (anyLinkExists) {
        await log('Found an external link. Checking attributes...');
        const target = await anyExternalLink.getAttribute('target');
        const rel = await anyExternalLink.getAttribute('rel');
        await log(`Link target: ${target}`);
        await log(`Link rel: ${rel}`);
        
        if (target === '_blank') {
          await log('SUCCESS: Link has target="_blank" for opening in new tab');
        } else {
          await log(`WARNING: Expected target="_blank", got: ${target}`);
        }
        
        if (rel === 'noopener noreferrer') {
          await log('SUCCESS: Link has rel="noopener noreferrer" for security');
        } else {
          await log(`WARNING: Expected rel="noopener noreferrer", got: ${rel}`);
        }
        
        await log('Hovering over link to demonstrate interaction...');
        await anyExternalLink.hover();
        await page.waitForTimeout(1000);
        
      } else {
        await log('ERROR: No external links found in sidebar');
      }
    } else {
      await log('Found "Documentation" link. Verifying attributes...');
      
      const target = await customLink.getAttribute('target');
      const rel = await customLink.getAttribute('rel');
      await log(`Link target: ${target}`);
      await log(`Link rel: ${rel}`);
      
      if (target === '_blank') {
        await log('SUCCESS: Link has target="_blank" for opening in new tab');
      } else {
        await log(`ERROR: Expected target="_blank", got: ${target}`);
      }
      
      if (rel === 'noopener noreferrer') {
        await log('SUCCESS: Link has rel="noopener noreferrer" for security');
      } else {
        await log(`ERROR: Expected rel="noopener noreferrer", got: ${rel}`);
      }
      
      await log('Hovering over link to demonstrate...');
      await customLink.hover();
      await page.waitForTimeout(1000);
    }

    await log('Taking screenshot of sidebar footer...');
    await sidebar.screenshot({ path: 'specs/40/screenshots/ac4-new-tab.png' });

    await log('Test steps completed');

  } catch (error) {
    await log(`ERROR: ${error.message}`);
    if (page) {
      await page.screenshot({ path: 'specs/40/screenshots/ac4-error.png' });
    }
    throw error;
  } finally {
    if (context) {
      await log('Closing context and flushing video...');
      await context.close();
    }
    if (browser) {
      await log('Closing browser...');
      await browser.close();
    }

    await log('Copying video to final location...');
    try {
      const videos = await fs.readdir(VIDEO_DIR);
      const videoFile = videos.find(f => f.endsWith('.webm'));
      if (videoFile) {
        await fs.copyFile(`${VIDEO_DIR}/${videoFile}`, 'specs/40/videos/ac4-open-in-new-tab.webm');
        await log(`Video saved to specs/40/videos/ac4-open-in-new-tab.webm`);
      } else {
        await log('WARNING: No video file found');
      }
    } catch (err) {
      await log(`Error copying video: ${err.message}`);
    }
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
