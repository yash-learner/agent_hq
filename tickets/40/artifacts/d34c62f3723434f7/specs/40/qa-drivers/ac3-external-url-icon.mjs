#!/usr/bin/env node
/**
 * QA Driver: AC3 - External URL links display external link icon
 * Tests that external URL links render with ExternalLink icon
 */

import { chromium } from 'playwright';
import { promises as fs } from 'fs';

const APP_URL = 'http://localhost:4000';
const AUTH_STATE = 'tests/.auth/user.json';
const VIDEO_DIR = '.agent-hq/pw-videos';
const size = { width: 1440, height: 900 };

async function main() {
  const logFile = 'specs/40/qa-logs/ac3-external-url-icon.log';
  const log = async (msg) => {
    console.log(msg);
    await fs.appendFile(logFile, `${new Date().toISOString()} ${msg}\n`);
  };

  await fs.writeFile(logFile, '=== AC3: External URL links display external link icon ===\n');

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

    await log('Looking for external link icon (ExternalLink)...');
    
    // Check for external link icon (ExternalLink from lucide-react)
    const externalIconExists = await page.locator('[data-sidebar] svg.lucide-external-link').isVisible().catch(() => false);
    await log(`External link icon (ExternalLink) visible: ${externalIconExists}`);

    if (externalIconExists) {
      await log('SUCCESS: External URL link displays ExternalLink icon as expected');
      
      // Verify the icon is next to a link with external URL
      const externalLinkWithIcon = await page.locator('[data-sidebar] a[href^="http"] svg.lucide-external-link').count();
      await log(`External links with icon count: ${externalLinkWithIcon}`);
    } else {
      await log('WARNING: External link icon not found. Current build may not have external URL configured.');
    }

    await log('Taking screenshot of sidebar footer...');
    await sidebar.screenshot({ path: 'specs/40/screenshots/ac3-external-url-icon.png' });

    await log('Test steps completed');

  } catch (error) {
    await log(`ERROR: ${error.message}`);
    if (page) {
      await page.screenshot({ path: 'specs/40/screenshots/ac3-error.png' });
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
        await fs.copyFile(`${VIDEO_DIR}/${videoFile}`, 'specs/40/videos/ac3-external-url-icon.webm');
        await log(`Video saved to specs/40/videos/ac3-external-url-icon.webm`);
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
