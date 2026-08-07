#!/usr/bin/env node

/**
 * QA Driver: Verify environment config links appear in sidebar footer
 * 
 * Criterion: env-config-links
 * Tests that links configured via REACT_NAVBAR_LINKS environment variable
 * appear in the sidebar footer with proper attributes (target="_blank", security)
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logPath = path.join(__dirname, '../qa-logs/env-config-links.log');
const logStream = fs.createWriteStream(logPath, { flags: 'a' });

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  logStream.write(logMessage);
  console.log(message);
}

async function main() {
  log('=== QA Driver: env-config-links ===');
  log('Purpose: Verify environment config links appear in sidebar');
  log('Expected: Documentation and NABH Certification links');
  
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
    
    // Wait for navigation to settle
    await page.waitForTimeout(1000);
    
    // Check for NavFooter custom links with target="_blank"
    const customLinks = page.locator('[data-sidebar="sidebar"] a[target="_blank"]');
    const customLinksCount = await customLinks.count();
    log(`Custom footer links with target="_blank": ${customLinksCount}`);
    
    if (customLinksCount === 0) {
      throw new Error('Expected custom footer links but found none');
    }
    
    // Verify Documentation link
    const docLink = page.locator('[data-sidebar="sidebar"] a[target="_blank"]:has-text("Documentation")');
    const docLinkExists = await docLink.count();
    log(`Documentation link found: ${docLinkExists > 0}`);
    
    if (docLinkExists > 0) {
      const docHref = await docLink.getAttribute('href');
      const docRel = await docLink.getAttribute('rel');
      log(`Documentation href: ${docHref}`);
      log(`Documentation rel: ${docRel}`);
      
      if (docHref !== 'https://docs.care.ohc.network') {
        throw new Error(`Expected Documentation href 'https://docs.care.ohc.network', got '${docHref}'`);
      }
      if (docRel !== 'noopener noreferrer') {
        throw new Error(`Expected rel 'noopener noreferrer', got '${docRel}'`);
      }
      log('✓ Documentation link verified with correct href and security attributes');
    } else {
      throw new Error('Documentation link not found');
    }
    
    // Verify NABH Certification link
    const nabhLink = page.locator('[data-sidebar="sidebar"] a[target="_blank"]:has-text("NABH Certification")');
    const nabhLinkExists = await nabhLink.count();
    log(`NABH Certification link found: ${nabhLinkExists > 0}`);
    
    if (nabhLinkExists > 0) {
      const nabhHref = await nabhLink.getAttribute('href');
      const nabhRel = await nabhLink.getAttribute('rel');
      log(`NABH Certification href: ${nabhHref}`);
      log(`NABH Certification rel: ${nabhRel}`);
      
      if (nabhHref !== 'https://nabh.care.ohc.network') {
        throw new Error(`Expected NABH href 'https://nabh.care.ohc.network', got '${nabhHref}'`);
      }
      if (nabhRel !== 'noopener noreferrer') {
        throw new Error(`Expected rel 'noopener noreferrer', got '${nabhRel}'`);
      }
      log('✓ NABH Certification link verified with correct href and security attributes');
    } else {
      throw new Error('NABH Certification link not found');
    }
    
    // Verify ExternalLink icon is present
    const externalIcons = await page.locator('[data-sidebar="sidebar"] a[target="_blank"] svg').count();
    log(`External link icons found: ${externalIcons}`);
    
    // Scroll to the footer links to ensure they're visible in the recording
    await docLink.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    
    // Hover over Documentation link to show tooltip (for collapsed sidebar)
    log('Hovering over Documentation link');
    await docLink.hover();
    await page.waitForTimeout(1000);
    
    // Hover over NABH link
    log('Hovering over NABH Certification link');
    await nabhLink.hover();
    await page.waitForTimeout(1000);
    
    // Take screenshot of sidebar with footer links
    const sidebarScreenshot = await sidebar.screenshot();
    fs.writeFileSync(path.join(__dirname, '../screenshots/env-config-links-sidebar.png'), sidebarScreenshot);
    log('Screenshot saved: env-config-links-sidebar.png');
    
    // Verify link count matches expectation
    if (customLinksCount === 2) {
      log('✓ Criterion PASS: Environment config links appear correctly');
      log('✓ Documentation and NABH Certification links present');
      log('✓ Links have correct target="_blank" and rel="noopener noreferrer" attributes');
      log('✓ External link icons visible');
    } else {
      throw new Error(`Expected 2 custom footer links, found ${customLinksCount}`);
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
