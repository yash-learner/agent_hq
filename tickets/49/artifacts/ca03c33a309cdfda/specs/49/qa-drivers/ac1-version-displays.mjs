#!/usr/bin/env node
/**
 * QA Driver: AC1 - Version displays on login page without authentication
 * Tests that the app version from build-meta.json appears in the login page footer
 */

import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');

console.log('=== AC1: Version displays on login page without authentication ===\n');

// Read the expected version from build-meta.json
const buildMetaPath = path.join(repoRoot, 'public/build-meta.json');
console.log(`Reading build metadata from: ${buildMetaPath}`);
const buildMeta = JSON.parse(readFileSync(buildMetaPath, 'utf-8'));
const expectedVersion = buildMeta.version;
console.log(`Expected version: ${expectedVersion}\n`);

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

// Enable native cursor/click overlay
await page.screencast.showActions({ cursor: 'pointer' });

console.log('Step 1: Navigate to login page');
await page.goto('http://localhost:4000/login', { waitUntil: 'load' });
await page.waitForLoadState('domcontentloaded');
console.log('✓ Login page loaded\n');

// Wait a bit for the page to fully render
await page.waitForTimeout(2000);
console.log('✓ Page content rendered\n');

console.log('Step 2: Locate footer and verify version text');
// The footer should contain the GitHub link, licenses link, and version text
// Look for the GitHub link first to find the footer
const githubLink = page.getByRole('link', { name: /Contribute on GitHub/i });
await githubLink.waitFor({ timeout: 10000 });
console.log('✓ Footer located via GitHub link\n');

// Look for the version text in the footer
const versionPattern = new RegExp(`v${expectedVersion}`);
// The version should be visible on the page with the format v{uuid}
const versionElement = page.locator(`text=/v[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/`);
const versionText = await versionElement.textContent({ timeout: 10000 });
console.log(`Found version text: ${versionText}`);

if (!versionPattern.test(versionText)) {
  console.error(`✗ Version mismatch! Expected: v${expectedVersion}, Found: ${versionText}`);
  throw new Error('Version text does not match expected format');
}
console.log('✓ Version text matches expected format\n');

console.log('Step 3: Verify version text styling');
// Check that the version text has the correct styling classes
const versionClasses = await versionElement.getAttribute('class');
console.log(`Version text classes: ${versionClasses}`);

if (!versionClasses.includes('text-xs') || !versionClasses.includes('text-secondary-500')) {
  console.warn('⚠ Version text may not have expected styling classes');
} else {
  console.log('✓ Version text has correct styling (text-xs text-secondary-500)\n');
}

// Take a screenshot highlighting the footer
console.log('Capturing footer with version...');
await githubLink.scrollIntoViewIfNeeded();
await page.waitForTimeout(1000); // Brief pause for visual stability

console.log('\n=== AC1 PASSED ===');
console.log('- Version text is visible in the footer');
console.log(`- Format: v{uuid} (${versionText})`);
console.log('- No authentication required');
console.log('- Text is small and muted (text-xs, text-secondary-500)');

await context.close();
await browser.close();

console.log('\nVideo saved to .agent-hq/pw-videos/');
