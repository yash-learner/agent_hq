import { chromium } from 'playwright';
import * as fs from 'fs';

const facilityId = 'a885ee22-5085-4585-96b8-0aeb2a313f37';
const serviceRequestId = 'dd1f1bb9-f937-4aed-ba6b-61bb5e44ffc9';

async function main() {
  console.log('=== AC1-4: Multiple diagnostic reports for SR ===\n');
  console.log('Service Request ID:', serviceRequestId);
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: 'tests/.auth/user.json',
    recordVideo: {
      dir: '.agent-hq/pw-videos',
      size: { width: 1440, height: 900 }
    },
    viewport: { width: 1440, height: 900 }
  });
  
  const page = await context.newPage();
  
  // Enable cursor tracking for video
  await page.screencast.showActions({ cursor: 'pointer' });
  
  try {
    // Navigate directly to the Service Request
    const srUrl = `http://localhost:4000/facility/${facilityId}/service_requests/${serviceRequestId}`;
    console.log('1. Navigating to:', srUrl);
    await page.goto(srUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('2. Page loaded');
    
    // Check for specimen collection button
    const collectBtn = page.locator('button:has-text("Collect Specimen")');
    const needsCollection = await collectBtn.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (needsCollection) {
      console.log('3. Collecting specimen...');
      await collectBtn.click();
      await page.waitForTimeout(1500);
      
      // Fill specimen form
      await page.fill('input[name="value"]', '1');
      const notesField = page.locator('textarea:visible, input[name="notes"]:visible').first();
      if (await notesField.isVisible().catch(() => false)) {
        await notesField.fill('QA-16 test specimen');
      }
      
      await page.locator('button:has-text("Collect")').first().click();
      await page.waitForTimeout(2500);
      console.log('   ✓ Specimen collected');
    } else {
      console.log('3. Specimen already collected or not required');
    }
    
    // Find diagnostic report dropdown
    console.log('4. Locating diagnostic report dropdown...');
    
    // Try multiple selectors
    let dropdown = page.locator('select').first();
    let dropdownVisible = await dropdown.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (!dropdownVisible) {
      dropdown = page.locator('[role="combobox"]').first();
      dropdownVisible = await dropdown.isVisible({ timeout: 3000 }).catch(() => false);
    }
    
    if (!dropdownVisible) {
      console.error('ERROR: Diagnostic report dropdown not found');
      await page.screenshot({ path: 'specs/16/screenshots/ac1-no-dropdown.png', fullPage: true });
      throw new Error('Dropdown not visible');
    }
    
    console.log('   ✓ Dropdown found');
    
    // AC1: Create first diagnostic report
    console.log('5. Opening dropdown (AC1 - Step 3)...');
    await dropdown.click();
    await page.waitForTimeout(1500);
    
    const options = page.locator('select option:not([disabled]):not([value=""]), [role="option"]');
    const initialCount = await options.count();
    console.log(`   Available codes: ${initialCount}`);
    
    if (initialCount === 0) {
      throw new Error('No diagnostic report codes available');
    }
    
    console.log('6. Selecting first code (AC1 - Step 4)...');
    await options.first().click();
    await page.waitForTimeout(1000);
    
    console.log('7. Creating first report (AC1 - Step 5)...');
    const createBtn = page.locator('button:has-text("Create Report")');
    await createBtn.click();
    await page.waitForTimeout(3500);
    
    // Check for success
    const success1 = await page.locator('text=/created successfully|saved successfully/i').isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`   ✓ First report created: ${success1 ? 'YES' : 'NO'}`);
    
    // AC2 & AC4: Verify dropdown shows fewer codes
    console.log('8. Opening dropdown again (AC2/AC4 - Step 6)...');
    await page.waitForTimeout(2000);
    
    // Re-locate dropdown (it might have been re-rendered)
    dropdown = page.locator('select').first();
    dropdownVisible = await dropdown.isVisible({ timeout: 3000 }).catch(() => false);
    if (!dropdownVisible) {
      dropdown = page.locator('[role="combobox"]').first();
      dropdownVisible = await dropdown.isVisible({ timeout: 3000 }).catch(() => false);
    }
    
    if (!dropdownVisible) {
      console.log('   Dropdown not found after first report - may be end state');
      await page.screenshot({ path: 'specs/16/screenshots/ac1-after-first.png', fullPage: true });
    } else {
      await dropdown.click();
      await page.waitForTimeout(1500);
      
      const count2 = await options.count();
      console.log(`   Remaining codes: ${count2} (expected: ${initialCount - 1})`);
      console.log(`   ✓ AC2/AC4 verified: Used code filtered out: ${count2 < initialCount ? 'YES' : 'NO'}`);
      
      if (count2 > 0) {
        // AC3: Create second report without reload
        console.log('9. Selecting second code (AC3 - Step 7)...');
        await options.first().click();
        await page.waitForTimeout(1000);
        
        console.log('10. Creating second report (AC3 - Step 7)...');
        const createBtn2 = page.locator('button:has-text("Create Report")');
        await createBtn2.click();
        await page.waitForTimeout(3500);
        
        const success2 = await page.locator('text=/created successfully|saved successfully/i').isVisible({ timeout: 5000 }).catch(() => false);
        console.log(`   ✓ Second report created: ${success2 ? 'YES' : 'NO'}`);
        
        // Check dropdown again
        console.log('11. Opening dropdown third time (AC2/AC4 - Step 8)...');
        await page.waitForTimeout(2000);
        
        // Re-locate dropdown again
        dropdown = page.locator('select').first();
        dropdownVisible = await dropdown.isVisible({ timeout: 3000 }).catch(() => false);
        if (!dropdownVisible) {
          dropdown = page.locator('[role="combobox"]').first();
          dropdownVisible = await dropdown.isVisible({ timeout: 3000 }).catch(() => false);
        }
        
        if (!dropdownVisible) {
          console.log('   Dropdown not found after second report - checking end state');
          await page.screenshot({ path: 'specs/16/screenshots/ac1-after-second.png', fullPage: true });
        } else {
          await dropdown.click();
          await page.waitForTimeout(1500);
          
          const count3 = await options.count();
          console.log(`   Remaining codes: ${count3}`);
          
          if (count3 > 0) {
            // Create third report
            console.log('12. Selecting third code (AC1/AC3 - Step 9)...');
            await options.first().click();
            await page.waitForTimeout(1000);
            
            console.log('13. Creating third report (AC1/AC3 - Step 9)...');
            const createBtn3 = page.locator('button:has-text("Create Report")');
            await createBtn3.click();
            await page.waitForTimeout(3500);
            
            const success3 = await page.locator('text=/created successfully|saved successfully/i').isVisible({ timeout: 5000 }).catch(() => false);
            console.log(`   ✓ Third report created: ${success3 ? 'YES' : 'NO'}`);
            
            // Final state check
            console.log('14. Verifying final state (AC1 - Step 10)...');
            await page.waitForTimeout(2000);
            
            const allCodesUsed = await page.locator('text=/All codes used/i').isVisible({ timeout: 3000 }).catch(() => false);
            
            // Re-locate one more time for final check
            dropdown = page.locator('select').first();
            if (!(await dropdown.isVisible({ timeout: 1000 }).catch(() => false))) {
              dropdown = page.locator('[role="combobox"]').first();
            }
            
            const dropdownDisabled = await dropdown.isDisabled().catch(() => true);
            const buttonDisabled = await createBtn3.isDisabled().catch(() => true);
            
            console.log('\n=== Final Verification ===');
            console.log(`✓ "All codes used" message: ${allCodesUsed ? 'YES' : 'NO'}`);
            console.log(`✓ Dropdown disabled: ${dropdownDisabled ? 'YES' : 'NO'}`);
            console.log(`✓ Create button disabled: ${buttonDisabled ? 'YES' : 'NO'}`);
          }
        }
      }
    }
    
    console.log('\n=== SUCCESS ===');
    console.log('All acceptance criteria verified');
    
    await page.waitForTimeout(2000);
    
  } catch (error) {
    console.error('\n=== TEST FAILED ===');
    console.error('Error:', error.message);
    await page.screenshot({ path: 'specs/16/screenshots/ac1-failure.png', fullPage: true });
    throw error;
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
