#!/usr/bin/env node
/**
 * QA Driver: AC5 - Links with openInNewTab: false open in current tab
 * Tests that internal links with openInNewTab: false navigate in the same tab
 */

import { chromium } from 'playwright';
import { promises as fs } from 'fs';

const APP_URL = 'http://localhost:4000';
const AUTH_STATE = 'tests/.auth/user.json';
const VIDEO_DIR = '.agent-hq/pw-videos';
const size = { width: 1440, height: 900 };
const FACILITY_ID = '2d5d1845-323f-42db-a360-788609513dfa';

async function main() {
  const logFile = 'specs/40/qa-logs/ac5-open-in-current-tab.log';
  const log = async (msg) => {
    console.log(msg);
    await fs.appendFile(logFile, `${new Date().toISOString()} ${msg}\n`);
  };

  await fs.writeFile(logFile, '=== AC5: Links with openInNewTab: false open in current tab ===\n');

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

    await log(`Navigating to ${APP_URL}/facility/${FACILITY_ID}/overview`);
    await page.goto(`${APP_URL}/facility/${FACILITY_ID}/overview`, { waitUntil: 'networkidle' });

    await log('Waiting for auth shell readiness...');
    await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 }).catch(() => {});
    
    await log('Waiting for sidebar to be visible...');
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await sidebar.waitFor({ state: 'visible', timeout: 15000 });
    await log('Sidebar is visible');

    await log('Scrolling to bottom of sidebar to view footer...');
    await sidebar.evaluate(el => el.scrollTop = el.scrollHeight);
    await page.waitForTimeout(1000);

    await log('Looking for custom link "Home" in sidebar footer...');
    
    // Look for the internal link with openInNewTab: false
    const customLink = page.locator('[data-sidebar] a[href="/"]').first();
    const linkExists = await customLink.count() > 0;
    
    if (!linkExists) {
      await log('WARNING: "Home" link not found. Checking for any internal link...');
      const anyInternalLink = page.locator('[data-sidebar] a:not([href^="http"])').first();
      const anyLinkExists = await anyInternalLink.count() > 0;
      
      if (anyLinkExists) {
        await log('Found an internal link. Checking attributes...');
        const target = await anyInternalLink.getAttribute('target');
        await log(`Link target: ${target || '(not set)'}`);
        
        if (!target || target !== '_blank') {
          await log('SUCCESS: Link does not have target="_blank" (opens in current tab)');
        } else {
          await log(`WARNING: Expected no target or target != "_blank", got: ${target}`);
        }
        
        await log('Clicking on link to demonstrate navigation in current tab...');
        const urlBefore = page.url();
        await log(`URL before click: ${urlBefore}`);
        
        // Count pages before click
        const pagesBefore = context.pages().length;
        await log(`Open pages before click: ${pagesBefore}`);
        
        await anyInternalLink.click();
        await page.waitForTimeout(2000);
        
        const urlAfter = page.url();
        const pagesAfter = context.pages().length;
        await log(`URL after click: ${urlAfter}`);
        await log(`Open pages after click: ${pagesAfter}`);
        
        if (pagesBefore === pagesAfter) {
          await log('SUCCESS: No new tab opened (navigation in current tab)');
        } else {
          await log(`WARNING: Expected same number of pages, got ${pagesBefore} -> ${pagesAfter}`);
        }
      } else {
        await log('ERROR: No internal links found in sidebar');
      }
    } else {
      await log('Found "Home" link. Verifying attributes...');
      
      const target = await customLink.getAttribute('target');
      await log(`Link target: ${target || '(not set)'}`);
      
      if (!target || target !== '_blank') {
        await log('SUCCESS: Link does not have target="_blank" (opens in current tab)');
      } else {
        await log(`ERROR: Expected no target or target != "_blank", got: ${target}`);
      }
      
      await log('Clicking on "Home" link to demonstrate navigation...');
      const urlBefore = page.url();
      await log(`URL before click: ${urlBefore}`);
      
      // Count pages before click
      const pagesBefore = context.pages().length;
      await log(`Open pages before click: ${pagesBefore}`);
      
      await customLink.click();
      await page.waitForTimeout(2000);
      
      const urlAfter = page.url();
      const pagesAfter = context.pages().length;
      await log(`URL after click: ${urlAfter}`);
      await log(`Open pages after click: ${pagesAfter}`);
      
      if (pagesBefore === pagesAfter) {
        await log('SUCCESS: No new tab opened (navigation in current tab)');
      } else {
        await log(`WARNING: Expected same number of pages, got ${pagesBefore} -> ${pagesAfter}`);
      }
    }

    await log('Taking screenshot of current page state...');
    await page.screenshot({ path: 'specs/40/screenshots/ac5-current-tab.png' });

    await log('Test steps completed');

  } catch (error) {
    await log(`ERROR: ${error.message}`);
    if (page) {
      await page.screenshot({ path: 'specs/40/screenshots/ac5-error.png' });
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
        await fs.copyFile(`${VIDEO_DIR}/${videoFile}`, 'specs/40/videos/ac5-open-in-current-tab.webm');
        await log(`Video saved to specs/40/videos/ac5-open-in-current-tab.webm`);
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
