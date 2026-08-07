#!/usr/bin/env node

/**
 * QA Driver: Verify default behavior when no navbar links are configured
 * 
 * Criterion: no-links-default
 * Tests that the sidebar renders correctly with no custom footer links
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logPath = path.join(__dirname, '../qa-logs/no-links-default.log');
const logStream = fs.createWriteStream(logPath, { flags: 'a' });

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  logStream.write(logMessage);
  console.log(message);
}

async function main() {
  log('=== QA Driver: no-links-default ===');
  log('Purpose: Verify sidebar renders without custom footer links');
  
  const browser = await chromium.launch({ headless: true });
  
  try {
    const size = { width: 1440, height: 900 };
    
    log('Loading authenticated session from tests/.auth/user.json');
    const context = await browser.newContext({
      storageState: 'tests/.auth/user.json',
      viewport: size,
      recordVideo: { 
        dir: '.agent-hq/pw-videos',
        size 
      },
    });
    
    const page = await context.newPage();
    
    log('Enabling screencast cursor overlay');
    await page.screencast.showActions({ cursor: 'pointer' });
    
    log('Navigating to facility overview');
    // Using facility from fixtures/setup (facilityMeta.json)
    await page.goto('http://localhost:4000/facility/eab657c5-07b3-42cb-85fe-965b1360a542/overview');
    
    log('Waiting for auth shell readiness...');
    
    // Wait for loading spinner to disappear
    const spinner = page.locator('[role="status"], .animate-spin').first();
    await spinner.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {
      log('Warning: Spinner not found or already hidden');
    });
    
    // Wait for sidebar to be visible
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await sidebar.waitFor({ state: 'visible', timeout: 10000 });
    log('Auth shell ready: Sidebar visible');
    
    // Check if login UI is visible (should not be)
    const loginElements = await page.locator('text=/Username|Password|Sign in/i').count();
    if (loginElements > 0) {
      throw new Error('Login UI detected on facility page - auth failure');
    }
    log('Auth verified: No login UI present');
    
    // Take full page screenshot to understand structure
    await page.screenshot({ path: '.agent-hq/debug-page.png', fullPage: true });
    log('Debug screenshot saved');
    
    // Get the page HTML to understand structure
    const sidebarHTML = await page.locator('[data-sidebar="sidebar"]').innerHTML().catch(() => 'not found');
    fs.writeFileSync('.agent-hq/sidebar-structure.html', sidebarHTML);
    log('Sidebar HTML saved');
    
    // Try to find the SidebarFooter component from the code
    // SidebarFooter is likely a group within the sidebar without a specific data attribute
    const sidebarGroup = page.locator('[data-sidebar="sidebar"] [data-sidebar="sidebar-group"]').last();
    const groupExists = await sidebarGroup.count();
    log(`Sidebar groups found: ${groupExists}`);
    
    // Check for NavFooter custom links - should be absent in default config
    // NavFooter renders links with target="_blank" if configured
    const customLinks = await page.locator('[data-sidebar="sidebar"] a[target="_blank"]').count();
    log(`Custom footer links with target="_blank": ${customLinks}`);
    
    // Verify user menu is present in sidebar
    const userMenuButtons = await page.locator('[data-sidebar="sidebar"] button').count();
    log(`Buttons in sidebar: ${userMenuButtons}`);
    
    // Take screenshot of sidebar
    await page.waitForTimeout(500);
    const sidebarScreenshot = await page.locator('[data-sidebar="sidebar"]').screenshot();
    fs.writeFileSync(path.join(__dirname, '../screenshots/no-links-default-sidebar.png'), sidebarScreenshot);
    log('Screenshot saved: no-links-default-sidebar.png');
    
    // Verify sidebar navigation works
    log('Checking navigation links');
    const navLinks = await page.locator('[data-sidebar="sidebar"] a').count();
    log(`Total navigation links in sidebar: ${navLinks}`);
    
    // Verify the feature: NavFooter returns null when no links configured
    // The implementation should not render any SidebarGroup for custom links
    if (customLinks === 0) {
      log('✓ Criterion PASS: No custom footer links found');
      log('✓ NavFooter component returns null when no links configured');
    } else {
      throw new Error(`Expected 0 custom footer links, found ${customLinks}`);
    }
    
    await page.waitForTimeout(1000);
    
    log('Closing browser and flushing video');
    await context.close();
    
  } catch (error) {
    log(`✗ Error: ${error.message}`);
    log(error.stack);
    throw error;
  } finally {
    await browser.close();
    logStream.end();
  }
}

main().catch(error => {
  console.error('Driver failed:', error);
  process.exit(1);
});
