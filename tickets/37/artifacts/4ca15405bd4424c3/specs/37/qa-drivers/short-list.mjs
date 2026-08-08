// Criterion 5: Short list — Encounter with few dispenses: no extra page fetches in a loop
import { chromium } from '@playwright/test';
import { size, facilityId, patientId, enableCursor, waitForAuthShell, closeAndSave } from '../../../.agent-hq/qa-driver-utils.mjs';
import fs from 'fs';
import path from 'path';

const criterionId = 'short-list';
const videoDir = '.agent-hq/pw-videos';

console.log('=== Criterion 5: Short list ===');

try {
  // First, create a new patient with only a few dispense orders (< 14)
  console.log('Creating test patient with minimal dispense orders...');
  
  const authFile = path.resolve('tests/.auth/user.json');
  const storageState = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
  const localStorage = storageState.origins?.[0]?.localStorage ?? [];
  const tokenEntry = localStorage.find(item => item.name === 'care_access_token');
  
  if (!tokenEntry) {
    throw new Error('No access token found');
  }
  
  const apiUrl = 'http://localhost:9000';
  
  // Create a minimal test patient
  const patientResponse = await fetch(`${apiUrl}/api/v1/facility/${facilityId}/patient/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tokenEntry.value}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'QA Test Patient Short List',
      date_of_birth: '1990-01-01',
      gender: 'male'
    })
  });
  
  if (!patientResponse.ok) {
    throw new Error(`Failed to create patient: ${patientResponse.status}`);
  }
  
  const testPatient = await patientResponse.json();
  console.log(`Created test patient: ${testPatient.id}`);
  
  // Create only 5 dispense orders
  const locationId = 'bd9c3953-3380-42d8-bdcd-e9ab97700c68';
  for (let i = 0; i < 5; i++) {
    await fetch(`${apiUrl}/api/v1/facility/${facilityId}/order/dispense/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenEntry.value}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        patient: testPatient.id,
        location: locationId,
        status: 'completed',
        name: `Short List Test ${i + 1}`
      })
    });
  }
  console.log('Created 5 dispense orders');
  
  // Now test with browser
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: 'tests/.auth/user.json',
    viewport: size,
    recordVideo: { dir: videoDir, size },
    javaScriptEnabled: true
  });
  
  const page = await context.newPage();
  
  // Track requests
  const dispenseRequests = [];
  page.on('request', request => {
    if (request.url().includes('/order/dispense/') && request.url().includes(testPatient.id)) {
      dispenseRequests.push({ url: request.url(), time: Date.now() });
      console.log(`Request ${dispenseRequests.length}: ${request.url()}`);
    }
  });
  
  await enableCursor(page);
  
  console.log('Navigating to encounters with short list patient...');
  await page.goto(`http://localhost:4000/facility/${facilityId}/encounters/patients/all?status=in_progress`, {
    waitUntil: 'networkidle',
    timeout: 60000
  });
  await waitForAuthShell(page);
  
  // Search for the test patient
  await page.getByRole('searchbox').fill('QA Test Patient Short List');
  await page.waitForTimeout(2000);
  
  await page.getByText('View Encounter').first().click();
  await page.waitForTimeout(3000);
  
  await page.getByRole('tab', { name: 'Medicines' }).click();
  await page.waitForTimeout(2000);
  
  await page.getByRole('tab', { name: 'Dispense History' }).click();
  await page.waitForTimeout(3000);
  
  const initialRequests = dispenseRequests.length;
  console.log(`Initial requests: ${initialRequests}`);
  
  // Try scrolling
  const scrollContainer = page.locator('.lg\\:block.overflow-y-auto').first();
  await scrollContainer.evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await page.waitForTimeout(2000);
  
  // Scroll again
  await scrollContainer.evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await page.waitForTimeout(2000);
  
  const finalRequests = dispenseRequests.length;
  console.log(`Final requests: ${finalRequests}`);
  
  // Should have exactly 1 request (initial load only)
  if (finalRequests > initialRequests) {
    throw new Error(`Extra requests with short list: initial=${initialRequests}, final=${finalRequests}`);
  }
  
  console.log('✓ Criterion 5 passed: No infinite loop with short list');
  
  await closeAndSave(context, browser, `${videoDir}/temp.webm`, criterionId);
  
} catch (error) {
  console.error('✗ Criterion 5 failed:', error.message);
  process.exit(1);
}
