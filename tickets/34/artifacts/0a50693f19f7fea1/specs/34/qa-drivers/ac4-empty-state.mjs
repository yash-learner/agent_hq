#!/usr/bin/env node
/**
 * AC4: Empty state for no matching results
 * Tests that searching for a non-existent service shows an empty state message
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
    log('Starting AC4: Empty state for no matching results');
    
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

    // Step 1: Type a non-existent service name in search
    log('Step 1: Typing "NonexistentService12345" in search input');
    const searchInput = page.getByPlaceholder('Search healthcare services...');
    await searchInput.fill('NonexistentService12345');
    log('Typed "NonexistentService12345"');

    // Wait for debounce and API response
    await page.waitForTimeout(1000);
    await page.waitForLoadState('networkidle');
    log('Waited for debounce and API response');

    // Step 2: Verify empty state message is displayed
    log('Step 2: Verifying empty state message');
    const emptyStateVisible = await page.getByText(/no services found/i).isVisible();
    if (!emptyStateVisible) {
      throw new Error('Empty state message "No services found" should be visible but is not');
    }
    log('✓ Empty state message "No services found" is visible');

    // Step 3: Verify no service cards are visible
    log('Step 3: Verifying no service cards are visible');
    const cardiologyVisible = await page.locator('text=/Cardiology-/').isVisible().catch(() => false);
    const neurologyVisible = await page.locator('text=/Neurology-/').isVisible().catch(() => false);
    const orthopedicsVisible = await page.locator('text=/Orthopedics-/').isVisible().catch(() => false);

    if (cardiologyVisible || neurologyVisible || orthopedicsVisible) {
      throw new Error('No service cards should be visible but some are');
    }
    log('✓ No service cards are visible');

    // Verify URL contains search parameter
    log('Verifying URL contains search parameter');
    const url = page.url();
    if (!url.includes('search=NonexistentService12345')) {
      throw new Error(`URL should contain search parameter but got: ${url}`);
    }
    log('✓ URL contains search=NonexistentService12345');

    // Wait a moment for video to capture the state
    await page.waitForTimeout(2000);

    log('AC4: PASS - Empty state for no matching results');

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
