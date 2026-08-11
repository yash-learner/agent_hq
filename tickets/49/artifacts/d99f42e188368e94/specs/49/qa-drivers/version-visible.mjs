#!/usr/bin/env node
/**
 * QA Driver: version-visible
 * AC1: Version shows on /login without authentication
 */

import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '../../..');

async function main() {
  const logPath = join(__dirname, '../qa-logs/version-visible.log');
  const videoPath = join(__dirname, '../videos/version-visible.webm');
  
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
  
  // Enable cursor/click overlay
  await page.screencast.showActions({ cursor: 'pointer' });
  
  log('Navigating to http://localhost:4000/login');
  await page.goto('http://localhost:4000/login', { waitUntil: 'networkidle' });
  
  log('Waiting for page to load...');
  await page.waitForLoadState('domcontentloaded');
  
  // Wait for version to appear (it's loaded via useAppVersion hook)
  log('Waiting for version to appear...');
  await page.waitForTimeout(3000);
  
  log('Looking for version text in footer...');
  
  // Try multiple selectors for version
  let versionElement = page.locator('span:has-text("v")').last();
  let isVisible = await versionElement.isVisible({ timeout: 5000 }).catch(() => false);
  
  if (!isVisible) {
    // Try looking for any text that looks like a version
    versionElement = page.locator('text=/v[a-f0-9]{8}/i');
    isVisible = await versionElement.isVisible({ timeout: 5000 }).catch(() => false);
  }
  
  if (isVisible) {
    const versionText = await versionElement.textContent();
    log(`✓ Version found: ${versionText}`);
  } else {
    log('✗ Version text not found - checking page content...');
    const bodyText = await page.locator('body').textContent();
    log(`Page text sample: ${bodyText.substring(0, 500)}...`);
  }
  
  // Take a screenshot for documentation
  await page.screenshot({ path: join(__dirname, '../screenshots/version-visible.png'), fullPage: true });
  
  log('Closing browser...');
  await context.close();
  await browser.close();
  
  log('Done!');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
