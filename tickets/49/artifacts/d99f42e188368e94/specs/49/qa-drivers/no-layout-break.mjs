#!/usr/bin/env node
/**
 * QA Driver: no-layout-break
 * AC2: Version doesn't wrap/overlap GitHub and licenses links on desktop
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const log = (msg) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${msg}`);
  };

  log('Starting browser...');
  const browser = await chromium.launch({ headless: true });
  
  const size = { width: 1440, height: 900 };
  const context = await browser.newContext({
    viewport: size,
    recordVideo: {
      dir: join(__dirname, '../videos'),
      size,
    },
  });

  const page = await context.newPage();
  await page.screencast.showActions({ cursor: 'pointer' });
  
  log('Navigating to http://localhost:4000/login');
  await page.goto('http://localhost:4000/login', { waitUntil: 'networkidle' });
  
  log('Waiting for page to load...');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);
  
  log('Checking footer layout...');
  
  // Find elements directly from page
  const githubLink = page.locator('text="Contribute on Github"').first();
  const licensesLink = page.locator('text="Third Party Software Licenses"').first();
  const versionSpan = page.locator('span.text-xs.text-secondary-500').first();
  
  // Debug: check what we're selecting
  const versionText = await versionSpan.textContent();
  log(`Version text: "${versionText}"`);
  
  // Get bounding boxes using DOM API directly
  const githubBox = await githubLink.evaluate(el => {
    const rect = el.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });
  const licensesBox = await licensesLink.evaluate(el => {
    const rect = el.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });
  const versionBox = await versionSpan.evaluate(el => {
    const rect = el.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });
  
  if (githubBox && licensesBox && versionBox) {
    log(`GitHub link at: x=${githubBox.x}, y=${githubBox.y}, width=${githubBox.width}, height=${githubBox.height}`);
    log(`Licenses link at: x=${licensesBox.x}, y=${licensesBox.y}, width=${licensesBox.width}, height=${licensesBox.height}`);
    log(`Version text at: x=${versionBox.x}, y=${versionBox.y}, width=${versionBox.width}, height=${versionBox.height}`);
    
    // Check if they're on the same line (y coordinates close)
    const sameLine = Math.abs(githubBox.y - licensesBox.y) < 5 && Math.abs(licensesBox.y - versionBox.y) < 5;
    
    // Check if version is after licenses (x coordinate)
    const versionAfterLicenses = versionBox.x > licensesBox.x + licensesBox.width;
    
    // Check for overlaps
    const noOverlap = versionBox.x >= licensesBox.x + licensesBox.width - 5;
    
    if (sameLine && versionAfterLicenses && noOverlap) {
      log('✓ Layout is correct: all links on same line, no overlap');
    } else {
      log(`✗ Layout issue detected: sameLine=${sameLine}, versionAfterLicenses=${versionAfterLicenses}, noOverlap=${noOverlap}`);
    }
  } else {
    log('✗ Could not find all footer elements');
  }
  
  // Take a screenshot
  await page.screenshot({ path: join(__dirname, '../screenshots/no-layout-break.png'), fullPage: true });
  
  log('Closing browser...');
  await context.close();
  await browser.close();
  
  log('Done!');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
