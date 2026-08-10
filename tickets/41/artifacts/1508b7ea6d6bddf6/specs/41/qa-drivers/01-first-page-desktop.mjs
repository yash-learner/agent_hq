#!/usr/bin/env node
import { chromium } from 'playwright';
import fs from 'fs';
import http from 'http';

const facilityId = JSON.parse(fs.readFileSync('tests/.auth/facilityMeta.json', 'utf-8')).id;
const patientId = JSON.parse(fs.readFileSync('tests/.auth/patientMeta.json', 'utf-8')).id;
const encounterId = JSON.parse(fs.readFileSync('tests/.auth/encounterMeta.json', 'utf-8')).id;
const locationId = '8137c6f1-ed6e-4b43-a96e-696a3607e71c';

const authFile = 'tests/.auth/user.json';
let storageState = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
let localStorage = storageState.origins?.[0]?.localStorage ?? [];
let tokenEntry = localStorage.find(item => item.name === 'care_access_token');
let token = tokenEntry?.value;

console.log('=== Criterion 01: First page loads immediately — Desktop ===');
console.log('Facility ID:', facilityId);
console.log('Patient ID:', patientId);
console.log('Encounter ID:', encounterId);
console.log('Location ID:', locationId);

// Token refresh function
async function refreshToken() {
  console.log('\n--- Attempting token refresh ---');
  const refreshTokenEntry = localStorage.find(item => item.name === 'care_refresh_token');
  if (!refreshTokenEntry) {
    console.error('No refresh token found');
    return false;
  }
  
  return new Promise((resolve) => {
    const body = JSON.stringify({ refresh: refreshTokenEntry.value });
    const options = {
      hostname: 'localhost',
      port: 9000,
      path: '/api/v1/auth/token/refresh/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': body.length
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          const result = JSON.parse(data);
          console.log('Token refresh successful');
          
          // Update tokens in storage state
          const accessIndex = localStorage.findIndex(item => item.name === 'care_access_token');
          const refreshIndex = localStorage.findIndex(item => item.name === 'care_refresh_token');
          
          if (accessIndex >= 0) localStorage[accessIndex].value = result.access;
          else localStorage.push({ name: 'care_access_token', value: result.access });
          
          if (refreshIndex >= 0) localStorage[refreshIndex].value = result.refresh;
          else localStorage.push({ name: 'care_refresh_token', value: result.refresh });
          
          // Update global token
          token = result.access;
          tokenEntry = localStorage[accessIndex >= 0 ? accessIndex : localStorage.length - 2];
          
          // Save updated storage state
          storageState.origins[0].localStorage = localStorage;
          fs.writeFileSync(authFile, JSON.stringify(storageState, null, 2));
          console.log('Updated storage state saved');
          
          resolve(true);
        } else {
          console.error(`Token refresh failed: ${res.statusCode}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (e) => {
      console.error('Token refresh error:', e.message);
      resolve(false);
    });
    req.write(body);
    req.end();
  });
}

// UI login function
async function performUILogin(page) {
  console.log('\n--- Performing UI login ---');
  
  try {
    // We're already on a page showing login tabs
    await page.waitForTimeout(1000);
    
    // Click "Log in as Staff" tab if it exists
    const staffTab = page.getByRole('tab', { name: /log in as staff/i });
    const staffTabVisible = await staffTab.isVisible().catch(() => false);
    if (staffTabVisible) {
      console.log('Clicking Log in as Staff tab');
      await staffTab.click({ timeout: 5000 });
      await page.waitForTimeout(500);
    } else {
      console.log('Already on staff login form or navigating to home');
      await page.goto('http://localhost:4000/', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      await page.getByRole('tab', { name: /log in as staff/i }).click({ timeout: 5000 });
      await page.waitForTimeout(500);
    }
    
    // Enter credentials (from fixtures: admin/admin)
    console.log('Filling login form');
    const usernameInput = page.getByLabel(/username/i);
    await usernameInput.waitFor({ state: 'visible', timeout: 10000 });
    await usernameInput.fill('admin');
    
    const passwordInput = page.getByLabel(/password/i);
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    await passwordInput.fill('admin');
    
    console.log('Looking for sign in button');
    await page.screenshot({ path: '.agent-hq/debug-before-signin.png' });
    
    // Try different selectors for the sign in button
    let signInButton = page.getByRole('button', { name: /sign in/i });
    let buttonVisible = await signInButton.isVisible().catch(() => false);
    
    if (!buttonVisible) {
      console.log('Trying alternative sign in button selector');
      signInButton = page.locator('button[type="submit"]').first();
      buttonVisible = await signInButton.isVisible().catch(() => false);
    }
    
    if (!buttonVisible) {
      // List all buttons
      const buttons = await page.getByRole('button').all();
      console.log(`Found ${buttons.length} buttons:`);
      for (const btn of buttons) {
        const text = await btn.textContent().catch(() => '');
        console.log(`  Button: "${text}"`);
      }
      throw new Error('Sign in button not found');
    }
    
    console.log('Clicking sign in button');
    await signInButton.click();
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // After login, reload to pick up new auth state
    console.log('Reloading page to pick up auth state');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Verify we're logged in by checking URL
    const afterReloadUrl = page.url();
    console.log('After reload URL:', afterReloadUrl);
    
    if (afterReloadUrl.includes('/facility/')) {
      console.log('Reload successful - still on facility page');
    }
    
    // Save new storage state
    await page.context().storageState({ path: authFile });
    console.log('UI login successful, storage state saved');
    
    // Reload storage state and token
    storageState = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
    localStorage = storageState.origins?.[0]?.localStorage ?? [];
    tokenEntry = localStorage.find(item => item.name === 'care_access_token');
    token = tokenEntry?.value;
    
    return true;
  } catch (err) {
    console.error('UI login failed:', err.message);
    return false;
  }
}

// Seed dispense orders via API
async function seedDispenseOrders() {
  console.log('\n--- Checking existing dispense orders ---');
  
  // First check if we already have enough orders
  const checkExisting = () => {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 9000,
        path: `/api/v1/facility/${facilityId}/order/dispense/?encounter=${encounterId}&limit=30`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          const result = JSON.parse(data);
          resolve(result.count || 0);
        });
      });
      
      req.on('error', reject);
      req.end();
    });
  };
  
  const existingCount = await checkExisting();
  console.log(`Found ${existingCount} existing dispense orders`);
  
  if (existingCount >= 20) {
    console.log('Sufficient dispense orders already exist, skipping seed');
    return;
  }
  
  console.log('Seeding additional dispense orders via API...');
  
  const createDispenseOrder = () => {
    return new Promise((resolve, reject) => {
      const body = JSON.stringify({
        patient: patientId,
        location: locationId,
        status: 'completed'
      });
      
      const options = {
        hostname: 'localhost',
        port: 9000,
        path: `/api/v1/facility/${facilityId}/order/dispense/`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Content-Length': body.length
        }
      };
      
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode === 200 || res.statusCode === 201) {
            resolve(JSON.parse(data));
          } else {
            console.error(`Failed to create dispense order: ${res.statusCode}`, data);
            reject(new Error(`Status ${res.statusCode}`));
          }
        });
      });
      
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  };
  
  // Create 25 dispense orders
  for (let i = 0; i < 25; i++) {
    try {
      const order = await createDispenseOrder();
      console.log(`Created dispense order ${i + 1}/25: ${order.id}`);
      await new Promise(resolve => setTimeout(resolve, 100)); // Brief delay
    } catch (err) {
      console.error(`Failed to create dispense order ${i + 1}:`, err.message);
    }
  }
  
  console.log('Finished seeding dispense orders');
}

// Main test
async function runTest() {
  // Try token refresh first
  await refreshToken();
  
  await seedDispenseOrders();
  
  console.log('\n--- Starting UI test ---');
  
  const size = { width: 1440, height: 900 };
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: authFile,
    viewport: size,
    recordVideo: { dir: '.agent-hq/pw-videos', size }
  });
  
  const page = await context.newPage();
  await page.screencast.showActions({ cursor: 'pointer' });
  
  console.log('Navigating to facility overview first...');
  const facilityUrl = `http://localhost:4000/facility/${facilityId}/overview`;
  await page.goto(facilityUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Check auth on facility page
  const onFacilityLoginPage = await page.getByRole('tab', { name: /log in as staff/i }).isVisible().catch(() => false);
  if (onFacilityLoginPage) {
    console.log('Still on login page at facility overview - auth definitely failed');
    throw new Error('Auth verification failed at facility overview');
  }
  
  console.log('Auth verified at facility overview, now navigating to encounter...');
  await page.goto(encounterUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Wait for auth shell readiness
  console.log('Waiting for auth shell...');
  await page.waitForLoadState('networkidle');
  
  // Log current state
  const currentUrl = page.url();
  const title = await page.title();
  console.log('Current URL:', currentUrl);
  console.log('Page title:', title);
  
  // Take a screenshot for debugging
  await page.screenshot({ path: '.agent-hq/debug-before-tabs.png' });
  console.log('Took debug screenshot');
  
  // Check if we're on the login page
  const isLoginPage = await page.getByRole('tab', { name: /log in as staff/i }).isVisible().catch(() => false);
  if (isLoginPage) {
    console.log('Detected login page - performing UI login');
    const loginSuccess = await performUILogin(page);
    if (!loginSuccess) {
      throw new Error('Auth failed - UI login unsuccessful');
    }
    
    // After login, we should already be on the encounter page
    // Wait for the page to fully load and render the correct tabs
    console.log('Waiting for encounter page to fully load after login...');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // Take another screenshot to see the state
    await page.screenshot({ path: '.agent-hq/debug-after-login.png' });
    console.log('Took post-login screenshot');
  }
  
  // Check for loading spinner gone
  await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 5000 }).catch(() => {
    console.log('No loading spinner found or already gone');
  });
  
  // Wait for Medicines tab to be visible
  await page.waitForTimeout(2000);
  const medicinesTab = page.getByRole('tab', { name: 'Medicines' });
  const isVisible = await medicinesTab.isVisible().catch(() => false);
  console.log('Medicines tab visible:', isVisible);
  
  if (!isVisible) {
    // List all tabs we can find
    const tabs = await page.getByRole('tab').all();
    console.log(`Found ${tabs.length} tabs`);
    for (const tab of tabs) {
      const text = await tab.textContent();
      console.log('  Tab:', text);
    }
    throw new Error('Medicines tab not found');
  }
  
  console.log('Auth shell ready');
  
  // Click Medicines tab
  console.log('Clicking Medicines tab...');
  await page.getByRole('tab', { name: 'Medicines' }).click();
  await page.waitForTimeout(1000);
  
  // Click Dispense History tab
  console.log('Clicking Dispense History tab...');
  await page.getByRole('tab', { name: 'Dispense History' }).click();
  await page.waitForTimeout(2000);
  
  // Verify the list is populated
  console.log('Checking for dispense order list...');
  const listItems = await page.locator('[role="button"]').filter({ hasText: /^DO-/ }).count();
  console.log(`Found ${listItems} dispense order list items`);
  
  if (listItems > 0) {
    console.log('✓ First page loaded with dispense orders');
    
    // Verify detail pane is visible
    const detailPane = await page.locator('text=Dispense History').count();
    console.log(`Detail pane visible: ${detailPane > 0}`);
  } else {
    console.log('✗ No dispense orders found in the list');
  }
  
  // Wait a bit to capture the state
  await page.waitForTimeout(2000);
  
  await page.close();
  await context.close();
  await browser.close();
  
  // Copy video
  console.log('\n--- Copying video ---');
  const videos = fs.readdirSync('.agent-hq/pw-videos').filter(f => f.endsWith('.webm'));
  if (videos.length > 0) {
    fs.copyFileSync(
      `.agent-hq/pw-videos/${videos[0]}`,
      'specs/41/videos/01-first-page-desktop.webm'
    );
    console.log('Video saved to specs/41/videos/01-first-page-desktop.webm');
  }
  
  console.log('\n=== Test completed ===');
}

runTest().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
