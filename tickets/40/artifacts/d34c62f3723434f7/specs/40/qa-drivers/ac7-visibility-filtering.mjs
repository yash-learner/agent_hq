#!/usr/bin/env node
/**
 * QA Driver: AC7 - Links filtered by showIn visibility config
 * Tests that links with showIn property only appear in matching sidebar contexts
 */

import { chromium } from 'playwright';
import { promises as fs } from 'fs';

const APP_URL = 'http://localhost:4000';
const AUTH_STATE = 'tests/.auth/user.json';
const VIDEO_DIR = '.agent-hq/pw-videos';
const size = { width: 1440, height: 900 };
const FACILITY_ID = '2d5d1845-323f-42db-a360-788609513dfa';

async function main() {
  const logFile = 'specs/40/qa-logs/ac7-visibility-filtering.log';
  const log = async (msg) => {
    console.log(msg);
    await fs.appendFile(logFile, `${new Date().toISOString()} ${msg}\n`);
  };

  await fs.writeFile(logFile, '=== AC7: Links filtered by showIn visibility config ===\n');

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
    
    await page.waitForTimeout(2000);

    // Navigate to facility context
    await log('Looking for a facility to enter facility context...');
    const facilityCard = page.locator('[class*="facility"], a[href*="/facility/"]').first();
    const facilityExists = await facilityCard.count() > 0;
    
    if (facilityExists) {
      await log('Clicking on first facility...');
      await facilityCard.click();
      await page.waitForTimeout(3000);
    }

    await log('Waiting for facility sidebar...');
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await sidebar.waitFor({ state: 'visible', timeout: 15000 });
    await log('Facility sidebar is visible');

    await log('Scrolling to bottom of sidebar to view footer...');
    await sidebar.evaluate(el => el.scrollTop = el.scrollHeight);
    await page.waitForTimeout(1000);

    await log('Checking custom links in FACILITY context...');
    // Config has 3 links:
    // 1. "Facility Link" with showIn:["facility"]
    // 2. "Admin Link" with showIn:["admin"]
    // 3. "Global Link" with no showIn (should appear everywhere)
    
    const facilityLinkVisible = await page.locator('[data-sidebar] a:has-text("Facility Link")').isVisible().catch(() => false);
    const adminLinkVisible = await page.locator('[data-sidebar] a:has-text("Admin Link")').isVisible().catch(() => false);
    const globalLinkVisible = await page.locator('[data-sidebar] a:has-text("Global Link")').isVisible().catch(() => false);
    
    await log(`In FACILITY context:`);
    await log(`  - "Facility Link" visible: ${facilityLinkVisible} (expected: true)`);
    await log(`  - "Admin Link" visible: ${adminLinkVisible} (expected: false)`);
    await log(`  - "Global Link" visible: ${globalLinkVisible} (expected: true)`);
    
    if (facilityLinkVisible && !adminLinkVisible && globalLinkVisible) {
      await log('SUCCESS: Facility context shows correct links (Facility + Global, not Admin)');
    } else {
      await log('WARNING: Unexpected link visibility in facility context');
    }

    await page.screenshot({ path: 'specs/40/screenshots/ac7-facility-context.png' });

    // Navigate to admin context
    await log('Navigating to admin context...');
    
    // Try clicking on user menu or navigating to /admin
    const userMenu = page.locator('[data-sidebar] button:has-text("admin"), button[aria-label*="admin"]').first();
    const userMenuExists = await userMenu.count() > 0;
    
    if (userMenuExists) {
      await log('Found user menu, clicking...');
      await userMenu.click();
      await page.waitForTimeout(1000);
      
      const adminLink = page.locator('a:has-text("Admin"), a[href*="/admin"]').first();
      const adminLinkExists = await adminLink.count() > 0;
      if (adminLinkExists) {
        await log('Clicking Admin link...');
        await adminLink.click();
        await page.waitForTimeout(3000);
      }
    } else {
      await log('User menu not found, navigating directly to /admin...');
      await page.goto(`${APP_URL}/admin`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
    }

    await log('Waiting for admin sidebar...');
    const adminSidebar = page.locator('[data-sidebar="sidebar"]');
    await adminSidebar.waitFor({ state: 'visible', timeout: 15000 });
    await log('Admin sidebar is visible');

    await log('Scrolling to bottom of admin sidebar...');
    await adminSidebar.evaluate(el => el.scrollTop = el.scrollHeight);
    await page.waitForTimeout(1000);

    await log('Checking custom links in ADMIN context...');
    const facilityLinkVisibleAdmin = await page.locator('[data-sidebar] a:has-text("Facility Link")').isVisible().catch(() => false);
    const adminLinkVisibleAdmin = await page.locator('[data-sidebar] a:has-text("Admin Link")').isVisible().catch(() => false);
    const globalLinkVisibleAdmin = await page.locator('[data-sidebar] a:has-text("Global Link")').isVisible().catch(() => false);
    
    await log(`In ADMIN context:`);
    await log(`  - "Facility Link" visible: ${facilityLinkVisibleAdmin} (expected: false)`);
    await log(`  - "Admin Link" visible: ${adminLinkVisibleAdmin} (expected: true)`);
    await log(`  - "Global Link" visible: ${globalLinkVisibleAdmin} (expected: true)`);
    
    if (!facilityLinkVisibleAdmin && adminLinkVisibleAdmin && globalLinkVisibleAdmin) {
      await log('SUCCESS: Admin context shows correct links (Admin + Global, not Facility)');
    } else {
      await log('WARNING: Unexpected link visibility in admin context');
    }

    await page.screenshot({ path: 'specs/40/screenshots/ac7-admin-context.png' });

    await log('Test steps completed');

  } catch (error) {
    await log(`ERROR: ${error.message}`);
    if (page) {
      await page.screenshot({ path: 'specs/40/screenshots/ac7-error.png' });
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
        await fs.copyFile(`${VIDEO_DIR}/${videoFile}`, 'specs/40/videos/ac7-visibility-filtering.webm');
        await log(`Video saved to specs/40/videos/ac7-visibility-filtering.webm`);
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
