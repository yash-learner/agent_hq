import { chromium } from 'playwright';
import fs from 'fs';

const testData = JSON.parse(fs.readFileSync('specs/18/qa-drivers/test-data.json', 'utf-8'));

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  storageState: 'tests/.auth/user.json',
  recordVideo: {
    dir: '.agent-hq/pw-videos',
    size: { width: 1440, height: 900 },
  },
});

const page = await context.newPage();

// Enable native cursor overlay
await page.screencast.showActions({ cursor: 'pointer' });

console.log('Navigating to service request show page...');
await page.goto(
  `http://localhost:4000/facility/${testData.facilityId}/service_requests/${testData.multiCodesSR.srId}`,
);

await page.waitForLoadState('networkidle');
await page.waitForTimeout(2000);

console.log('Finding the dropdown...');
const dropdown = page.getByRole('combobox', {
  name: /select diagnostic report type/i,
});

await dropdown.waitFor({ state: 'visible', timeout: 10000 });

console.log('Clicking dropdown to open it...');
await dropdown.click();

await page.waitForTimeout(1000);

console.log('Verifying all 3 codes are visible...');
const code1 = page.getByRole('option', { name: /Complete blood count \(58410-2\)/ });
const code2 = page.getByRole('option', { name: /CBC W Auto Differential panel \(57021-8\)/ });
const code3 = page.getByRole('option', { name: /Auto Differential panel \(57023-4\)/ });

await code1.waitFor({ state: 'visible', timeout: 5000 });
await code2.waitFor({ state: 'visible', timeout: 5000 });
await code3.waitFor({ state: 'visible', timeout: 5000 });

console.log('All 3 diagnostic report codes are visible in the dropdown.');

// Wait a bit to capture the final state
await page.waitForTimeout(2000);

await context.close();
await browser.close();

// Move the video to the correct location
const videoPath = await page.video().path();
fs.renameSync(videoPath, 'specs/18/videos/ac1-all-codes-visible.webm');

console.log('✅ AC #1 passed: All diagnostic report codes are shown in dropdown when no reports exist');
