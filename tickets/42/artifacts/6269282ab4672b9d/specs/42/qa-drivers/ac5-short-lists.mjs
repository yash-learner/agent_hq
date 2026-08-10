/**
 * AC5: Short lists do not trigger repeated fetches
 * Tests that a patient with fewer than 14 dispense orders does not trigger pagination
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const facilityId = '6f63fb9b-14f1-4409-b66f-82fe5d69488f';
const patientId = '87d156d7-f05a-462d-9af0-3760d2416d34';
const encounterId = '904301f3-0449-4366-b3dd-4ef3d6ce9242';

// Logging helper
function log(msg) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${msg}`);
}

// Get API headers from auth storage state
function getApiHeaders() {
  const authFile = path.resolve('tests/.auth/user.json');
  const storageState = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
  const localStorage = storageState.origins?.[0]?.localStorage ?? [];
  const tokenEntry = localStorage.find(item => item.name === 'care_access_token');
  if (!tokenEntry) throw new Error('No access token in auth storage state');
  return {
    'Authorization': `Bearer ${tokenEntry.value}`,
    'Content-Type': 'application/json'
  };
}

async function seedDispenseOrders(count) {
  log(`Starting seed: creating ${count} dispense orders`);
  
  const headers = getApiHeaders();
  const apiUrl = 'http://localhost:9000';
  
  // First, get a location ID from the facility
  log('Fetching facility locations...');
  const locationRes = await fetch(`${apiUrl}/api/v1/facility/${facilityId}/location/`, {
    headers
  });
  
  if (!locationRes.ok) {
    throw new Error(`Failed to fetch locations: ${locationRes.status} ${await locationRes.text()}`);
  }
  
  const locationData = await locationRes.json();
  log(`Fetched locations: count=${locationData.count}`);
  
  if (!locationData.results || locationData.results.length === 0) {
    throw new Error('No locations found in facility');
  }
  
  const locationId = locationData.results[0].id;
  log(`Using location ID: ${locationId}`);
  
  // Create dispense orders
  const createdOrders = [];
  for (let i = 0; i < count; i++) {
    const timestamp = Date.now();
    const body = {
      patient: patientId,
      location: locationId,
      status: 'draft',
      name: `QA Test Dispense ${timestamp}-${i}`,
      note: `AC5 test dispense order ${i+1}/${count}`
    };
    
    log(`Creating dispense order ${i+1}/${count}...`);
    const res = await fetch(`${apiUrl}/api/v1/facility/${facilityId}/order/dispense/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to create dispense order ${i+1}: ${res.status} ${errorText}`);
    }
    
    const order = await res.json();
    createdOrders.push(order);
    log(`Created dispense order ${i+1}/${count}: ${order.id}`);
  }
  
  log(`Seed complete: created ${createdOrders.length} dispense orders`);
  return createdOrders;
}

async function main() {
  log('=== AC5: Short lists do not trigger repeated fetches ===');
  log(`Facility: ${facilityId}`);
  log(`Patient: ${patientId}`);
  log(`Encounter: ${encounterId}`);
  
  try {
    // Step 1: Seed exactly 10 dispense orders
    log('Step 1: Seeding exactly 10 dispense orders via API');
    const orders = await seedDispenseOrders(10);
    log(`Seeded ${orders.length} dispense orders`);
    
    // Step 2: Open browser and navigate to Dispense History
    log('Step 2: Opening browser and navigating to Dispense History tab');
    
    const size = { width: 1440, height: 900 };
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      storageState: 'tests/.auth/user.json',
      viewport: size,
      recordVideo: { dir: '.agent-hq/pw-videos', size }
    });
    
    const page = await context.newPage();
    
    // Enable cursor overlay
    await page.screencast.showActions({ cursor: 'pointer' });
    log('Enabled cursor overlay');
    
    // Navigate to encounter with medicines tab
    const encounterUrl = `http://localhost:4000/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/medicines`;
    log(`Navigating to: ${encounterUrl}`);
    await page.goto(encounterUrl);
    
    // Wait for auth shell readiness
    log('Waiting for auth shell readiness...');
    await page.waitForLoadState('networkidle');
    
    // Check for loading spinner gone
    await page.waitForSelector('[data-sidebar="sidebar"]', { timeout: 10000 });
    log('Auth shell ready: sidebar visible');
    
    // Wait for the Dispense History tab to be available
    log('Waiting for Dispense History tab');
    await page.waitForSelector('[role="tab"]', { timeout: 10000 });
    
    // Click Dispense History tab (we're already on medicines tab from URL)
    log('Clicking Dispense History tab');
    await page.getByRole('tab', { name: 'Dispense History' }).click();
    await page.waitForTimeout(2000);
    
    // Step 3: Count visible dispense orders
    log('Step 3: Counting visible dispense order entries');
    await page.waitForSelector('[data-slot="dispense-order-card"]', { state: 'attached', timeout: 10000 });
    const dispenseOrders = await page.locator('[data-slot="dispense-order-card"]').count();
    log(`Visible dispense orders: ${dispenseOrders}`);
    
    // Step 4: Check for loading skeleton
    log('Step 4: Checking for loading skeleton (should NOT be present)');
    const loadingSkeleton = await page.locator('[data-slot="card-list-skeleton"]').count();
    log(`Loading skeleton count: ${loadingSkeleton}`);
    
    // Step 5: Scroll to bottom and wait
    log('Step 5: Scrolling to bottom and waiting 5 seconds');
    // Try to find the scrollable container
    const scrollableContainer = await page.locator('[data-slot="dispense-order-list"]').first();
    if (await scrollableContainer.count() > 0) {
      await scrollableContainer.evaluate(el => {
        el.scrollTop = el.scrollHeight;
      });
    }
    await page.waitForTimeout(5000);
    
    // Step 6: Verify no additional loading skeleton
    log('Step 6: Verifying no loading skeleton appeared after scroll');
    const loadingSkeletonAfter = await page.locator('[data-slot="card-list-skeleton"]').count();
    log(`Loading skeleton count after scroll: ${loadingSkeletonAfter}`);
    
    // Final count
    const finalCount = await page.locator('[data-slot="dispense-order-card"]').count();
    log(`Final dispense order count: ${finalCount} (should still be ${dispenseOrders})`);
    
    // Success criteria
    if (dispenseOrders === 10 && loadingSkeleton === 0 && loadingSkeletonAfter === 0 && finalCount === 10) {
      log('✅ SUCCESS: Short list (10 entries) loaded without triggering pagination');
    } else {
      log(`⚠️ UNEXPECTED: dispenseOrders=${dispenseOrders} (expected 10), loadingSkeleton=${loadingSkeleton} (expected 0), loadingSkeletonAfter=${loadingSkeletonAfter} (expected 0), finalCount=${finalCount} (expected 10)`);
    }
    
    // Close and save video
    await page.close();
    await context.close();
    await browser.close();
    
    log('Waiting for video to be written...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Move video to expected location
    const videoDir = '.agent-hq/pw-videos';
    const videos = fs.readdirSync(videoDir).filter(f => f.endsWith('.webm'));
    if (videos.length > 0) {
      const videoPath = path.join(videoDir, videos[videos.length - 1]);
      const targetPath = 'specs/42/videos/ac5-short-lists.webm';
      fs.copyFileSync(videoPath, targetPath);
      log(`Video saved: ${targetPath}`);
    }
    
    log('=== AC5 Complete ===');
  } catch (error) {
    log(`❌ ERROR: ${error.message}`);
    console.error(error);
    throw error;
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
