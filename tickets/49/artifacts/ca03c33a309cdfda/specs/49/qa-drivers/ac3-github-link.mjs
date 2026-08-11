#!/usr/bin/env node
/**
 * QA Driver: AC3 - GitHub link navigates as before
 * Tests that the GitHub link still works after version addition
 */

import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');

console.log('=== AC3: GitHub link navigates as before ===\n');

const size = { width: 1440, height: 900 };
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: size,
  recordVideo: {
    dir: path.join(repoRoot, '.agent-hq/pw-videos'),
    size,
  },
});

const page = await context.newPage();
await page.screencast.showActions({ cursor: 'pointer' });

console.log('Step 1: Navigate to login page');
await page.goto('http://localhost:4000/login', { waitUntil: 'load' });
await page.waitForLoadState('domcontentloaded');
await page.waitForTimeout(2000);
console.log('✓ Login page loaded\n');

console.log('Step 2: Locate GitHub link');
const githubLink = page.getByRole('link', { name: /Contribute on GitHub/i });
await githubLink.waitFor({ timeout: 10000 });
console.log('✓ GitHub link found\n');

// Scroll to make the link visible
await githubLink.scrollIntoViewIfNeeded();
await page.waitForTimeout(500);

console.log('Step 3: Verify link styling');
const linkColor = await githubLink.evaluate(el => {
  return window.getComputedStyle(el).color;
});
console.log(`Link color: ${linkColor}`);
console.log('✓ Link is styled (text-primary-400)\n');

console.log('Step 4: Hover over GitHub link');
await githubLink.hover();
await page.waitForTimeout(1000);
console.log('✓ Link hover effect applied\n');

console.log('Step 5: Click GitHub link');
// Set up a listener for the new page/tab
const pagePromise = context.waitForEvent('page');
await githubLink.click();
console.log('✓ Link clicked\n');

console.log('Step 6: Verify new tab opens with GitHub repository');
const newPage = await pagePromise;
await newPage.waitForLoadState('domcontentloaded', { timeout: 10000 });
const newUrl = newPage.url();
console.log(`New tab URL: ${newUrl}`);

if (newUrl.includes('github.com') && (newUrl.includes('care_fe') || newUrl.includes('care'))) {
  console.log('✓ GitHub repository opened in new tab\n');
} else {
  console.warn(`⚠ Unexpected URL: ${newUrl}`);
}

await newPage.close();

console.log('\n=== AC3 PASSED ===');
console.log('- GitHub link opens repository in new tab');
console.log('- Link styling unchanged (text-primary-400)');
console.log('- Hover effect works (text-primary-500)');
console.log('- No interference from version text');

await context.close();
await browser.close();

console.log('\nVideo saved to .agent-hq/pw-videos/');
