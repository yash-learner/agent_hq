#!/usr/bin/env node
/**
 * AC2: Search filters services by name (debounced)
 * Tests that typing in the search input filters the healthcare services list
 */

import { chromium } from '@playwright/test';
import fs from 'fs';

const FACILITY_ID = '8f2bfd67-f731-435a-af51-e0f45ddce02e';
const size = { width: 1440, height: 900 };
const timestamp = Date.now();

const log = (msg) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${msg}`);
};

async function createHealthcareService(page, serviceName) {
  log(`Creating healthcare service: ${serviceName}`);
  
  // Navigate to healthcare services settings
  await page.goto(`http://localhost:4000/facility/${FACILITY_ID}/settings/healthcare_services`);
  await page.waitForLoadState('networkidle');
  
  // Click Add Healthcare Service button
  await page.getByRole('button', { name: 'Add Healthcare Service' }).click();
  log('Clicked Add Healthcare Service button');
  
  // Fill in service name
  await page.getByRole('textbox', { name: 'Name' }).fill(serviceName);
  log(`Filled service name: ${serviceName}`);
  
  // Select internal type
  await page.getByRole('combobox').filter({ hasText: 'Select Internal Type' }).click();
  await page.getByRole('option', { name: 'Pharmacy' }).click();
  log('Selected Pharmacy as internal type');
  
  // Select locations
  await page.getByRole('combobox').filter({ hasText: 'Select locations' }).click();
  await page.getByPlaceholder('Search locations...').fill('Pharmacy');
  
  // Wait for search results
  await page.waitForTimeout(500);
  
  // Select the first location (empty button in dialog)
  await page.getByRole('dialog').getByRole('button').filter({ hasText: /^$/ }).first().click();
  log('Selected location');
  
  // Create the service
  await page.getByRole('button', { name: 'Create' }).click();
  log('Clicked Create button');
  
  // Wait for service to appear
  await page.waitForSelector(`text=${serviceName}`, { timeout: 5000 });
  log(`✓ Service ${serviceName} created successfully`);
}

async function run() {
  let browser, context, page;

  try {
    log('Starting AC2: Search filters services by name');
    
    // Launch browser
    browser = await chromium.launch({ headless: true });
    log('Browser launched');

    // Create context with auth
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

    // Data Setup: Create three healthcare services
    log('=== DATA SETUP START ===');
    const services = [
      `Cardiology-${timestamp}`,
      `Neurology-${timestamp}`,
      `Orthopedics-${timestamp}`
    ];
    
    for (const service of services) {
      await createHealthcareService(page, service);
    }
    log('=== DATA SETUP COMPLETE ===');

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

    // Verify all three services are visible
    log('Verifying all three services are visible');
    for (const service of services) {
      await page.waitForSelector(`text=${service}`, { timeout: 5000 });
      log(`✓ Service ${service} visible`);
    }

    // Step 1: Type "Cardiology" in the search input
    log('Step 1: Typing "Cardiology" in search input');
    const searchInput = page.getByPlaceholder('Search healthcare services...');
    await searchInput.fill('Cardiology');
    log('Typed "Cardiology"');

    // Wait for debounce and API response
    await page.waitForTimeout(1000);
    await page.waitForLoadState('networkidle');
    log('Waited for debounce and API response');

    // Step 2: Verify only Cardiology service is visible
    log('Step 2: Verifying filtered results');
    const cardiologyVisible = await page.locator(`text=${services[0]}`).isVisible();
    const neurologyVisible = await page.locator(`text=${services[1]}`).isVisible();
    const orthopedicsVisible = await page.locator(`text=${services[2]}`).isVisible();

    if (!cardiologyVisible) {
      throw new Error('Cardiology service should be visible but is not');
    }
    if (neurologyVisible) {
      throw new Error('Neurology service should not be visible but is');
    }
    if (orthopedicsVisible) {
      throw new Error('Orthopedics service should not be visible but is');
    }
    log('✓ Only Cardiology service is visible');

    // Step 3: Verify URL contains search parameter
    log('Step 3: Verifying URL contains search parameter');
    const url = page.url();
    if (!url.includes('search=Cardiology')) {
      throw new Error(`URL should contain search=Cardiology but got: ${url}`);
    }
    log('✓ URL contains search=Cardiology');

    // Wait a moment for video to capture the state
    await page.waitForTimeout(2000);

    log('AC2: PASS - Search filters services by name');

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
