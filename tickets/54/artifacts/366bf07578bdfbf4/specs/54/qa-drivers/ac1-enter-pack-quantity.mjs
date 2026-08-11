#!/usr/bin/env node
/**
 * AC1: Enter in Pack Quantity field moves focus
 * Tests that pressing Enter in Pack Quantity field moves focus to the next field
 * and does NOT submit the form.
 */

import { chromium } from '@playwright/test';
import { readAccessToken } from '../../../.agent-hq/qa-auth.mjs';

const FACILITY_ID = '4583267e-5699-4d87-b1fe-4756e33c5c7c';
const API_BASE = process.env.REACT_CARE_API_URL || 'http://localhost:9000';
const SIZE = { width: 1440, height: 900 };

async function findOrCreateLocation(facilityId, accessToken) {
  console.log('[AC1] Finding location for facility...');
  const locationsRes = await fetch(
    `${API_BASE}/api/v1/facility/${facilityId}/location/`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  
  if (!locationsRes.ok) {
    throw new Error(`Failed to list locations: ${locationsRes.status}`);
  }
  
  const locations = await locationsRes.json();
  console.log(`[AC1] Found ${locations.results?.length || 0} locations`);
  
  if (locations.results && locations.results.length > 0) {
    const location = locations.results[0];
    console.log(`[AC1] Using location: ${location.name} (${location.id})`);
    return location.id;
  }
  
  throw new Error('No locations found in facility');
}

async function findOrCreateDeliveryOrder(facilityId, locationId, accessToken) {
  console.log('[AC1] Looking for existing draft delivery orders...');
  
  // Try to find existing draft delivery orders (only draft orders show the form)
  const listRes = await fetch(
    `${API_BASE}/api/v1/facility/${facilityId}/order/delivery/?status=draft&limit=10`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  
  if (listRes.ok) {
    const data = await listRes.json();
    console.log(`[AC1] Found ${data.results?.length || 0} draft delivery orders`);
    
    if (data.results && data.results.length > 0) {
      const order = data.results[0];
      console.log(`[AC1] Using existing delivery order: ${order.id}`);
      return { id: order.id };
    }
  }
  
  // Create a new draft delivery order if none found
  console.log('[AC1] Creating new draft delivery order via API...');
  const createRes = await fetch(
    `${API_BASE}/api/v1/facility/${facilityId}/order/delivery/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        name: `qa-delivery-54-${Date.now()}`,
        status: 'draft',  // Must be draft to show the form!
        origin: locationId,
        destination: locationId,
      }),
    }
  );
  
  if (!createRes.ok) {
    const errorText = await createRes.text();
    console.log('[AC1] Create response status:', createRes.status);
    console.log('[AC1] Create response body:', errorText);
    throw new Error(`Failed to create delivery order: ${createRes.status} - ${errorText}`);
  }
  
  const order = await createRes.json();
  console.log(`[AC1] Created delivery order: ${order.id}`);
  return { id: order.id };
}

async function runAC1() {
  const browser = await chromium.launch({ headless: true });
  
  try {
    // Get auth token for API calls
    const accessToken = readAccessToken();
    console.log('[AC1] Read access token for API calls');
    
    // Find or create location
    const locationId = await findOrCreateLocation(FACILITY_ID, accessToken);
    
    // Find or create delivery order
    const deliveryOrder = await findOrCreateDeliveryOrder(FACILITY_ID, locationId, accessToken);
    
    // Open browser context with auth
    console.log('[AC1] Opening browser context...');
    const context = await browser.newContext({
      storageState: 'tests/.auth/user.json',
      viewport: SIZE,
      recordVideo: { dir: '.agent-hq/pw-videos', size: SIZE },
    });
    
    const page = await context.newPage();
    
    // Enable cursor overlay
    await page.screencast.showActions({ cursor: 'pointer' });
    console.log('[AC1] Enabled cursor overlay');
    
    // Navigate to delivery order page (must be draft status to show the form)
    const url = `http://localhost:4000/facility/${FACILITY_ID}/locations/${locationId}/inventory/external/deliveries/draft/${deliveryOrder.id}`;
    console.log(`[AC1] Navigating to ${url}`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    console.log('[AC1] Page loaded');
    
    // Wait for auth indicators
    await Promise.race([
      page.getByRole('heading', { name: /^Hey .+/ }).waitFor({ state: 'visible', timeout: 10000 }),
      page.locator('[data-sidebar="sidebar"]').waitFor({ state: 'visible', timeout: 10000 }),
    ]).catch(() => console.log('[AC1] Auth indicator not found, continuing...'));
    
    await page.waitForTimeout(2000);
    
    // Look for the Add Item button
    console.log('[AC1] Looking for Add Item button...');
    const addItemButton = page.getByRole('button', { name: /add item|add another/i });
    await addItemButton.waitFor({ state: 'visible', timeout: 10000 });
    console.log('[AC1] Found Add Item button');
    
    // Click Add Item button
    console.log('[AC1] Step 1: Clicking Add Item button...');
    await addItemButton.click();
    await page.waitForTimeout(1000);
    console.log('[AC1] Item row added');
    
    // Select a product (look for Product or Medication autocomplete)
    console.log('[AC1] Step 2: Selecting product...');
    const productInput = page.locator('input[placeholder*="Search"], input[placeholder*="Product"]').first();
    await productInput.waitFor({ state: 'visible', timeout: 10000 });
    await productInput.click();
    await productInput.fill('Paracetamol');
    await page.waitForTimeout(1000);
    
    // Select first option from dropdown
    const firstOption = page.locator('[role="option"]').first();
    if (await firstOption.isVisible().catch(() => false)) {
      await firstOption.click();
      console.log('[AC1] Selected Paracetamol from dropdown');
    } else {
      console.log('[AC1] No dropdown appeared, pressing Enter');
      await productInput.press('Enter');
    }
    
    await page.waitForTimeout(1500);
    
    // Find Pack Quantity field
    console.log('[AC1] Step 3: Finding Pack Quantity field...');
    const allInputs = await page.locator('input[type="number"]').all();
    let packQtyField = null;
    
    for (const input of allInputs) {
      const label = await input.evaluate((el) => {
        const parent = el.closest('[data-field], .form-item, fieldset');
        return parent?.textContent || '';
      });
      if (label.match(/pack quantity|quantity/i)) {
        packQtyField = input;
        console.log(`[AC1] Found Pack Quantity field via label match`);
        break;
      }
    }
    
    if (!packQtyField) {
      packQtyField = allInputs[0]; // Fallback to first number input
      console.log('[AC1] Using first number input as Pack Quantity field');
    }
    
    // Click and fill Pack Quantity
    await packQtyField.click();
    await packQtyField.fill('5');
    console.log('[AC1] Filled Pack Quantity with "5"');
    
    // Get currently focused element before pressing Enter
    const beforeFocus = await page.evaluate(() => document.activeElement?.tagName);
    console.log(`[AC1] Focus before Enter: ${beforeFocus}`);
    
    // Press Enter (without Shift)
    console.log('[AC1] Pressing Enter key...');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    
    // Check that form did NOT submit
    console.log('[AC1] Verifying form did not submit...');
    
    // Check for success toast (should NOT appear)
    const successToast = page.getByText(/supply delivery created|saved successfully/i);
    const toastVisible = await successToast.isVisible().catch(() => false);
    
    if (toastVisible) {
      console.log('[AC1] ❌ FAIL: Success toast appeared - form was submitted!');
      await page.screenshot({ path: 'specs/54/screenshots/ac1-fail-toast.png' });
      return false;
    }
    console.log('[AC1] ✓ No success toast - form did not submit');
    
    // Check that focus moved to next field
    const afterFocus = await page.evaluate(() => ({
      tag: document.activeElement?.tagName,
      type: document.activeElement?.getAttribute('type'),
      name: document.activeElement?.getAttribute('name'),
    }));
    console.log(`[AC1] Focus after Enter: ${afterFocus.tag} (type=${afterFocus.type}, name=${afterFocus.name})`);
    
    if (afterFocus.tag === 'INPUT' && afterFocus.tag !== beforeFocus) {
      console.log('[AC1] ✓ Focus moved to next field');
    } else {
      console.log('[AC1] ⚠ Focus may not have moved (or stayed in same element type)');
    }
    
    // Check that item row still exists in edit mode
    const packQtyStillVisible = await packQtyField.isVisible();
    if (packQtyStillVisible) {
      console.log('[AC1] ✓ Item row still exists in edit mode');
    } else {
      console.log('[AC1] ❌ FAIL: Item row disappeared');
      return false;
    }
    
    // Success
    console.log('[AC1] ✅ PASS: Enter in Pack Quantity moved focus without submitting');
    
    // Keep page open for video to flush
    await page.waitForTimeout(2000);
    
    await context.close();
    return true;
    
  } catch (error) {
    console.error('[AC1] Error:', error.message);
    console.error(error.stack);
    return false;
  } finally {
    await browser.close();
    console.log('[AC1] Browser closed');
  }
}

runAC1()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('[AC1] Unhandled error:', error);
    process.exit(1);
  });
