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
await page.screenshot({ path: '.agent-hq/debug-main-page.png', fullPage: true });

console.log('Clicking Service Requests tab...');
const serviceRequestsTab = page.getByRole('tab', { name: /service requests/i });
await serviceRequestsTab.click();

await page.waitForTimeout(3000);
await page.screenshot({ path: '.agent-hq/debug-service-requests.png', fullPage: true });

console.log('Page content:');
const body = await page.content();
console.log(body.substring(0, 2000));

await context.close();
await browser.close();
