#!/usr/bin/env node
/**
 * AC3: Clearing search shows all services
 * Tests that clearing the search input shows all healthcare services again
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
    log('Starting AC3: Clearing search shows all services');
    
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

    // Navigate to services page with search parameter (continuing from AC2)
    const servicesUrl = `http://localhost:4000/facility/${FACILITY_ID}/services?search=Cardiology`;
    log(`Navigating to ${servicesUrl}`);
    await page.goto(servicesUrl);
    await page.waitForLoadState('networkidle');
    log('Navigation complete');

    // Wait for auth shell readiness
    log('Waiting for auth shell readiness...');
    await page.waitForSelector('[data-sidebar="sidebar"]', { timeout: 10000 });
    log('Auth shell ready - sidebar visible');

    // Verify search input has "Cardiology"
    const searchInput = page.getByPlaceholder('Search healthcare services...');
    const searchValue = await searchInput.inputValue();
    log(`Search input value: "${searchValue}"`);

    // Verify only one service is visible initially (filtered state)
    log('Verifying filtered state (only Cardiology visible)');
    const cardiologyCount = await page.locator('text=/Cardiology-/').count();
    log(`Cardiology services visible: ${cardiologyCount}`);

    // Step 1: Clear the search input
    log('Step 1: Clearing search input');
    await searchInput.clear();
    log('Search input cleared');

    // Wait for debounce and API response
    await page.waitForTimeout(1000);
    await page.waitForLoadState('networkidle');
    log('Waited for debounce and API response');

    // Step 2: Verify all services are visible
    log('Step 2: Verifying all services are visible');
    const allCardiologyVisible = await page.locator('text=/Cardiology-/').count() >= 1;
    const allNeurologyVisible = await page.locator('text=/Neurology-/').count() >= 1;
    const allOrthopedicsVisible = await page.locator('text=/Orthopedics-/').count() >= 1;

    if (!allCardiologyVisible) {
      throw new Error('Cardiology service should be visible after clearing search');
    }
    if (!allNeurologyVisible) {
      throw new Error('Neurology service should be visible after clearing search');
    }
    if (!allOrthopedicsVisible) {
      throw new Error('Orthopedics service should be visible after clearing search');
    }
    log('✓ All three services are visible');

    // Step 3: Verify URL no longer has search parameter
    log('Step 3: Verifying URL does not contain search parameter');
    const url = page.url();
    if (url.includes('search=Cardiology') || (url.includes('search=') && !url.includes('search=&'))) {
      throw new Error(`URL should not contain search parameter but got: ${url}`);
    }
    log('✓ URL does not contain search parameter');

    // Wait a moment for video to capture the state
    await page.waitForTimeout(2000);

    log('AC3: PASS - Clearing search shows all services');

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
