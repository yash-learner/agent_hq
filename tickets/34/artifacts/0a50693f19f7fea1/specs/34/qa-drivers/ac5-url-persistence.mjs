#!/usr/bin/env node
/**
 * AC5: Search term persists in URL and on page reload
 * Tests that search terms persist in the URL and remain after page reload
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
    log('Starting AC5: Search term persists in URL and on page reload');
    
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
    await page.goto(servicesUrl);
    await page.waitForLoadState('networkidle');
    log('Navigation complete');

    // Wait for auth shell readiness
    log('Waiting for auth shell readiness...');
    await page.waitForSelector('[data-sidebar="sidebar"]', { timeout: 10000 });
    log('Auth shell ready - sidebar visible');

    // Step 1: Type "Neurology" in the search input
    log('Step 1: Typing "Neurology" in search input');
    const searchInput = page.getByPlaceholder('Search healthcare services...');
    await searchInput.fill('Neurology');
    log('Typed "Neurology"');

    // Wait for debounce and API response
    await page.waitForTimeout(1000);
    await page.waitForLoadState('networkidle');
    log('Waited for debounce and API response');

    // Verify URL contains search parameter
    log('Verifying URL contains search=Neurology');
    let url = page.url();
    if (!url.includes('search=Neurology')) {
      throw new Error(`URL should contain search=Neurology but got: ${url}`);
    }
    log('✓ URL contains search=Neurology');

    // Verify only Neurology service is visible
    log('Verifying only Neurology service is visible');
    const neurologyCount = await page.locator('text=/Neurology-/').count();
    const cardiologyCount = await page.locator('text=/Cardiology-/').count();
    const orthopedicsCount = await page.locator('text=/Orthopedics-/').count();
    
    if (neurologyCount < 1) {
      throw new Error('Neurology service should be visible');
    }
    if (cardiologyCount > 0 || orthopedicsCount > 0) {
      throw new Error('Only Neurology service should be visible');
    }
    log('✓ Only Neurology service is visible');

    // Step 2: Reload the page
    log('Step 2: Reloading the page');
    await page.reload({ waitUntil: 'networkidle' });
    log('Page reloaded');

    // Wait for auth shell readiness after reload
    log('Waiting for auth shell readiness after reload...');
    await page.waitForSelector('[data-sidebar="sidebar"]', { timeout: 10000 });
    log('Auth shell ready after reload');

    // Step 3: Verify search input is pre-filled with "Neurology"
    log('Step 3: Verifying search input is pre-filled');
    const reloadedSearchInput = page.getByPlaceholder('Search healthcare services...');
    const searchValue = await reloadedSearchInput.inputValue();
    if (searchValue !== 'Neurology') {
      throw new Error(`Search input should contain "Neurology" but got: "${searchValue}"`);
    }
    log('✓ Search input is pre-filled with "Neurology"');

    // Step 4: Verify filtered results remain (only Neurology visible)
    log('Step 4: Verifying filtered results remain after reload');
    const neurologyCountAfter = await page.locator('text=/Neurology-/').count();
    const cardiologyCountAfter = await page.locator('text=/Cardiology-/').count();
    const orthopedicsCountAfter = await page.locator('text=/Orthopedics-/').count();
    
    if (neurologyCountAfter < 1) {
      throw new Error('Neurology service should still be visible after reload');
    }
    if (cardiologyCountAfter > 0 || orthopedicsCountAfter > 0) {
      throw new Error('Only Neurology service should be visible after reload');
    }
    log('✓ Filtered results remain (only Neurology visible)');

    // Step 5: Verify URL still contains search parameter
    log('Step 5: Verifying URL still contains search parameter');
    url = page.url();
    if (!url.includes('search=Neurology')) {
      throw new Error(`URL should contain search=Neurology after reload but got: ${url}`);
    }
    log('✓ URL still contains search=Neurology');

    // Wait a moment for video to capture the state
    await page.waitForTimeout(2000);

    log('AC5: PASS - Search term persists in URL and on page reload');

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
