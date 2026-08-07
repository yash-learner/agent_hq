import { chromium } from 'playwright';
import fs from 'fs';

const testData = JSON.parse(fs.readFileSync('specs/18/qa-drivers/test-data.json', 'utf-8'));

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  storageState: 'tests/.auth/user.json',
});

const page = await context.newPage();

console.log('Navigating to service request show page...');
await page.goto(
  `http://localhost:4000/facility/${testData.facilityId}/service_requests/${testData.multiCodesSR.srId}`,
);

await page.waitForLoadState('networkidle');
await page.waitForTimeout(3000);

await page.screenshot({ path: '.agent-hq/debug-sr-show.png', fullPage: true });

// Check what's visible
console.log('\\nChecking page content...');
const textContent = await page.textContent('body');
console.log('Page includes "diagnostic report":', textContent.includes('diagnostic report'));
console.log('Page includes "Test Results":', textContent.includes('Test Results'));
console.log('Page includes "Select":', textContent.includes('Select'));

// Look for any comboboxes
const comboboxes = await page.getByRole('combobox').allTextContents();
console.log('Comboboxes on page:', comboboxes);

// Look for any selects
const selects = await page.locator('select, [role="combobox"]').count();
console.log('Number of selects/comboboxes:', selects);

// Get all visible text for diagnostic report section
const headers = await page.locator('h1, h2, h3, h4').allTextContents();
console.log('\\nHeaders on page:', headers);

await context.close();
await browser.close();
