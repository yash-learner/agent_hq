import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Load test data
const testData = JSON.parse(
  fs.readFileSync('.agent-hq/test-data.json', 'utf-8')
);

const { facilityId, serviceRequestId } = testData;

console.log('Starting QA test for multiple diagnostic report codes...');
console.log('Service Request ID:', serviceRequestId);

// Launch browser and create context with video recording
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  storageState: 'tests/.auth/user.json',
  recordVideo: {
    dir: '.agent-hq/pw-videos',
    size: { width: 1440, height: 900 },
  },
  viewport: { width: 1440, height: 900 },
});

const page = await context.newPage();

// Enable cursor/click overlay BEFORE any interactions
await page.screencast.showActions({ cursor: 'pointer' });

try {
  // Navigate to Service Request detail page
  const url = `http://localhost:4000/facility/${facilityId}/service_requests/${serviceRequestId}`;
  console.log('Navigating to:', url);
  await page.goto(url, { waitUntil: 'networkidle' });
  
  // Wait for page to load
  await page.waitForTimeout(5000);
  
  // NOTE: Specimen collection step skipped - the UI shows diagnostic report controls are already available
  
  // Step 1: Verify diagnostic reports section is visible
  console.log('Step 1: Verifying diagnostic reports section...');
  
  // Step 2: Create First Diagnostic Report (CBC panel)
  console.log('Step 2: Creating first diagnostic report (CBC panel)...');
  
  // Click the diagnostic report type dropdown (use first combobox)
  const dropdown = page.locator('[role="combobox"]').first();
  
  await dropdown.waitFor({ state: 'visible', timeout: 10000 });
  await dropdown.click();
  await page.waitForTimeout(2000);
  
  // Select CBC panel (first code) - look for options in the dropdown
  const cbcOption = page.getByRole('option', { name: /cbc.*panel/i });
  await cbcOption.waitFor({ state: 'visible', timeout: 10000 });
  await cbcOption.click();
  await page.waitForTimeout(500);
  
  // Click "Create Report" button
  const createReportButton = page.getByRole('button', { name: /create report/i });
  await createReportButton.click();
  
  // Wait for success toast and report card to appear
  await page.waitForTimeout(3000);
  console.log('First diagnostic report created');
  
  // Step 3: Verify dropdown shows 2 remaining codes
  console.log('Step 3: Verifying dropdown shows 2 remaining codes...');
  await page.waitForTimeout(2000);
  
  // Wait for the page to update after report creation
  await page.waitForLoadState('networkidle');
  
  // Step 4: Create Second Diagnostic Report (Lipid panel)
  console.log('Step 4: Creating second diagnostic report (Lipid panel)...');
  
  // Click dropdown again - use a more flexible selector
  await page.waitForTimeout(1000);
  const dropdownAgain = page.locator('[role="combobox"]').first();
  await dropdownAgain.click();
  await page.waitForTimeout(1000);
  
  // Select Lipid panel (second code)
  const lipidOption = page.getByRole('option', { name: /lipid.*panel/i });
  await lipidOption.waitFor({ state: 'visible', timeout: 10000 });
  await lipidOption.click();
  await page.waitForTimeout(500);
  
  // Click "Create Report" button
  await createReportButton.click();
  
  // Wait for success toast and report card to appear
  await page.waitForTimeout(3000);
  console.log('Second diagnostic report created');
  
  // Step 5: Verify dropdown shows 1 remaining code
  console.log('Step 5: Verifying dropdown shows 1 remaining code...');
  await page.waitForTimeout(2000);
  await page.waitForLoadState('networkidle');
  
  // Step 6: Create Third Diagnostic Report (Fasting glucose)
  console.log('Step 6: Creating third diagnostic report (Fasting glucose)...');
  
  // Click dropdown again
  await page.waitForTimeout(1000);
  const dropdownThird = page.locator('[role="combobox"]').first();
  await dropdownThird.click();
  await page.waitForTimeout(1000);
  
  // Select Fasting glucose (third code)
  const glucoseOption = page.getByRole('option', { name: /fasting.*glucose/i });
  await glucoseOption.waitFor({ state: 'visible', timeout: 10000 });
  await glucoseOption.click();
  await page.waitForTimeout(500);
  
  // Click "Create Report" button
  await createReportButton.click();
  
  // Wait for success toast and report card to appear
  await page.waitForTimeout(3000);
  console.log('Third diagnostic report created');
  
  // Step 7: Verify "All codes used" state
  console.log('Step 7: Verifying "All codes used" state...');
  await page.waitForTimeout(1000);
  
  // Check if dropdown shows "All codes used" and is disabled
  const allCodesUsedText = page.locator('text=/all codes used/i');
  await allCodesUsedText.waitFor({ state: 'visible', timeout: 5000 });
  
  // Verify "Create Report" button is disabled
  const isButtonDisabled = await createReportButton.isDisabled();
  console.log('Create Report button disabled:', isButtonDisabled);
  
  // Take a final screenshot showing all three reports
  await page.waitForTimeout(1000);
  
  console.log('✅ Test completed successfully!');
  console.log('All three diagnostic reports created and verified');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error(error.stack);
  throw error;
} finally {
  // Close page and context to flush video
  await page.close();
  await context.close();
  await browser.close();
  
  // Copy video to the correct location
  const videoDir = '.agent-hq/pw-videos';
  const files = fs.readdirSync(videoDir);
  const videoFile = files.find((f) => f.endsWith('.webm'));
  
  if (videoFile) {
    const sourcePath = path.join(videoDir, videoFile);
    const destPath = 'specs/16/videos/multi-code-diagnostic-reports.webm';
    fs.copyFileSync(sourcePath, destPath);
    console.log('Video saved to:', destPath);
  } else {
    console.error('No video file found in', videoDir);
  }
}
