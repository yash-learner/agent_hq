#!/usr/bin/env node
/**
 * AC1: Search input displays on page load
 * Tests that the search input field is displayed when navigating to /facility/{facilityId}/services
 */

import { chromium } from '@playwright/test';
import fs from 'fs';

const FACILITY_ID = '8f2bfd67-f731-435a-af51-e0f45ddce02e';
const size = { width: 1440, height: 900 };

const log = (msg) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${msg}`);
};

async function run() {
  let browser, context, page;

  try {
    log('Starting AC1: Search input displays on page load');
    
    // Launch browser
    browser = await chromium.launch({ headless: true });
    log('Browser launched');

    // Create context with auth and recording
    context = await browser.newContext({
      storageState: 'tests/.auth/user.json',
      viewport: size,
      recordVideo: {
        dir: '.agent-hq/pw-videos',
        size: size
      }
    });
    log('Context created with auth and video recording');

    // Create page
    page = await context.newPage();
    log('Page created');

    // Enable cursor overlay
    await page.screencast.showActions({ cursor: 'pointer' });
    log('Cursor overlay enabled');

    // Navigate to services page
    const servicesUrl = `http://localhost:4000/facility/${FACILITY_ID}/services`;
    log(`Navigating to ${servicesUrl}`);
    await page.goto(servicesUrl, { waitUntil: 'networkidle' });
    log('Navigation complete');

    // Wait for auth shell readiness
    log('Waiting for auth shell readiness...');
    await page.waitForSelector('[data-sidebar="sidebar"]', { timeout: 10000 });
    log('Auth shell ready - sidebar visible');

    // Check for login form (auth failure indicator)
    const loginForm = await page.locator('input[placeholder*="Username"], input[placeholder*="username"]').count();
    if (loginForm > 0) {
      throw new Error('Login form detected - auth failure');
    }
    log('No login form detected - auth success');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    log('Page fully loaded');

    // Step 1: Verify page loads with Services heading
    log('Step 1: Verifying Services heading');
    const servicesHeading = page.getByRole('heading', { name: /services/i });
    await servicesHeading.waitFor({ state: 'visible', timeout: 5000 });
    log('✓ Services heading visible');

    // Step 2: Verify search input is visible
    log('Step 2: Verifying search input field');
    const searchInput = page.getByPlaceholder('Search healthcare services...');
    await searchInput.waitFor({ state: 'visible', timeout: 5000 });
    log('✓ Search input visible with correct placeholder');

    // Wait a moment for video to capture the state
    await page.waitForTimeout(2000);

    log('AC1: PASS - Search input displays on page load');

  } catch (error) {
    log(`ERROR: ${error.message}`);
    throw error;
  } finally {
    if (page) await page.close();
    if (context) await context.close();
    if (browser) await browser.close();
    log('Browser cleanup complete');
  }
}

run().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
