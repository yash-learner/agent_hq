import { chromium } from 'playwright';
import fs from 'fs';

const testData = JSON.parse(fs.readFileSync('specs/18/qa-drivers/test-data.json', 'utf-8'));

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  storageState: 'tests/.auth/user.json',
});

const page = await context.newPage();

console.log('Navigating to encounter updates page...');
await page.goto(
  `http://localhost:4000/facility/${testData.facilityId}/patient/${testData.patientId}/encounter/${testData.encounterId}/updates`,
);

await page.waitForLoadState('networkidle');

console.log('Clicking Service Requests tab...');
const serviceRequestsTab = page.getByRole('tab', { name: /service requests/i });
await serviceRequestsTab.click();

await page.waitForTimeout(2000);

console.log('Looking for the service request row...');
const srRow = page
  .locator('[data-slot="table-body"] [data-slot="table-row"]')
  .filter({ hasText: 'Multi-Code SR' });

await srRow.waitFor({ state: 'visible', timeout: 10000 });

console.log('Clicking See Details button...');
await srRow.getByRole('button', { name: 'See Details' }).click();

await page.waitForTimeout(3000);
await page.screenshot({ path: '.agent-hq/debug-sr-details.png', fullPage: true });

// Check what's visible
console.log('\\nChecking page content...');
const textContent = await page.textContent('body');
console.log('Page includes "Test Results Entry":', textContent.includes('Test Results Entry'));
console.log('Page includes "diagnostic report":', textContent.includes('diagnostic report'));
console.log('Page includes "Select":', textContent.includes('Select'));

// Look for any comboboxes
const comboboxes = await page.getByRole('combobox').count();
console.log('Number of comboboxes:', comboboxes);

// Look for buttons
const buttons = await page.getByRole('button').allTextContents();
console.log('Buttons on page:', buttons.slice(0, 10));

await context.close();
await browser.close();
