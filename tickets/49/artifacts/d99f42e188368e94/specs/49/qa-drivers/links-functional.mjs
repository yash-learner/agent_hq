#!/usr/bin/env node
/**
 * QA Driver: links-functional
 * AC3: GitHub and licenses links still navigate as before
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
  
  log('Testing GitHub link...');
  const githubLink = page.locator('text="Contribute on Github"').first();
  const githubHref = await githubLink.getAttribute('href');
  const githubTarget = await githubLink.getAttribute('target');
  log(`GitHub link href: ${githubHref}, target: ${githubTarget}`);
  
  if (githubHref && githubHref.includes('github.com')) {
    log('✓ GitHub link has correct href');
  } else {
    log('✗ GitHub link href is incorrect');
  }
  
  log('Testing Licenses link...');
  const licensesLink = page.locator('text="Third Party Software Licenses"').first();
  const licensesHref = await licensesLink.getAttribute('href');
  const licensesTarget = await licensesLink.getAttribute('target');
  log(`Licenses link href: ${licensesHref}, target: ${licensesTarget}`);
  
  if (licensesHref && licensesHref.includes('/licenses')) {
    log('✓ Licenses link has correct href');
  } else {
    log('✗ Licenses link href is incorrect');
  }
  
  // Test clicking the licenses link (it opens in new tab due to target="_blank")
  log('Testing licenses link navigation (opens in new tab)...');
  
  // Create a promise that resolves when a new page is opened
  const newPagePromise = context.waitForEvent('page');
  
  await licensesLink.click();
  
  // Wait for new page
  const newPage = await newPagePromise;
  await newPage.waitForLoadState('domcontentloaded');
  await newPage.waitForTimeout(2000);
  
  const newUrl = newPage.url();
  log(`New tab URL: ${newUrl}`);
  
  if (newUrl.includes('/licenses')) {
    log('✓ Licenses link opened new tab correctly');
  } else {
    log('✗ Licenses link did not navigate to correct page');
  }
  
  await newPage.close();
  
  // Take a screenshot
  await page.screenshot({ path: join(__dirname, '../screenshots/links-functional.png'), fullPage: true });
  
  log('Closing browser...');
  await context.close();
  await browser.close();
  
  log('Done!');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
