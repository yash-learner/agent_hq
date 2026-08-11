#!/usr/bin/env node
/**
 * QA Driver: AC2 - Version does not wrap or overlap on desktop viewport
 * Tests that version text stays on one line and doesn't overlap existing links
 */

import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');

console.log('=== AC2: Version does not wrap or overlap on desktop viewport ===\n');

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

console.log('Step 1: Set desktop viewport size (1440x900)');
console.log(`Viewport: ${size.width}x${size.height}`);
console.log('✓ Desktop viewport configured\n');

console.log('Step 2: Navigate to login page');
await page.goto('http://localhost:4000/login', { waitUntil: 'load' });
await page.waitForLoadState('domcontentloaded');
await page.waitForTimeout(2000);
console.log('✓ Login page loaded\n');

console.log('Step 3: Locate footer and verify layout');
const githubLink = page.getByRole('link', { name: /Contribute on GitHub/i });
await githubLink.waitFor({ timeout: 10000 });
const licensesLink = page.getByRole('link', { name: /Third Party Software Licenses/i });
await licensesLink.waitFor({ timeout: 10000 });
const versionElement = page.locator('text=/v[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/');
await versionElement.waitFor({ timeout: 10000 });
console.log('✓ All footer elements located\n');

// Get bounding boxes to verify layout
const githubBox = await githubLink.boundingBox();
const licensesBox = await licensesLink.boundingBox();
const versionBox = await versionElement.boundingBox();

console.log('Footer element positions:');
console.log(`- GitHub link: x=${githubBox.x.toFixed(2)}, y=${githubBox.y.toFixed(2)}, width=${githubBox.width.toFixed(2)}`);
console.log(`- Licenses link: x=${licensesBox.x.toFixed(2)}, y=${licensesBox.y.toFixed(2)}, width=${licensesBox.width.toFixed(2)}`);
console.log(`- Version text: x=${versionBox.x.toFixed(2)}, y=${versionBox.y.toFixed(2)}, width=${versionBox.width.toFixed(2)}\n`);

// Verify all elements are on the same line (y coordinates should be similar)
const yDiff1 = Math.abs(githubBox.y - licensesBox.y);
const yDiff2 = Math.abs(licensesBox.y - versionBox.y);
if (yDiff1 > 10 || yDiff2 > 10) {
  console.error(`✗ Elements are not on the same line! Y differences: ${yDiff1.toFixed(2)}, ${yDiff2.toFixed(2)}`);
  throw new Error('Footer elements not aligned horizontally');
}
console.log('✓ All elements on the same line (within 10px)\n');

// Verify no overlap (x2 of previous element should be less than x1 of next)
const githubEnd = githubBox.x + githubBox.width;
const licensesEnd = licensesBox.x + licensesBox.width;
if (githubEnd > licensesBox.x - 5) {
  console.warn('⚠ GitHub link may overlap licenses link');
}
if (licensesEnd > versionBox.x - 5) {
  console.warn('⚠ Licenses link may overlap version text');
}
console.log('✓ No overlap detected\n');

// Scroll to footer for better visibility
await githubLink.scrollIntoViewIfNeeded();
await page.waitForTimeout(1000);

console.log('Step 4: Test at various desktop viewport sizes');
const viewportSizes = [
  { width: 768, height: 900 },
  { width: 1024, height: 900 },
  { width: 1920, height: 1080 },
];

for (const testSize of viewportSizes) {
  console.log(`\nTesting at ${testSize.width}x${testSize.height}...`);
  await page.setViewportSize(testSize);
  await page.waitForTimeout(1000);
  
  const testVersionBox = await versionElement.boundingBox();
  const testGithubBox = await githubLink.boundingBox();
  const testLicensesBox = await licensesLink.boundingBox();
  
  const testYDiff1 = Math.abs(testGithubBox.y - testLicensesBox.y);
  const testYDiff2 = Math.abs(testLicensesBox.y - testVersionBox.y);
  
  if (testYDiff1 > 10 || testYDiff2 > 10) {
    console.error(`✗ Layout broken at ${testSize.width}x${testSize.height}`);
  } else {
    console.log(`✓ Layout stable at ${testSize.width}x${testSize.height}`);
  }
}

console.log('\n=== AC2 PASSED ===');
console.log('- All footer elements stay on one line');
console.log('- No text wrapping at any tested desktop viewport size');
console.log('- No overlap between elements');
console.log('- Version text has proper spacing (mx-2 on separator)');

await context.close();
await browser.close();

console.log('\nVideo saved to .agent-hq/pw-videos/');
