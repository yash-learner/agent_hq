// Criterion 6: Error resilience — Failed next-page fetch does not clear already loaded items  
import { chromium } from '@playwright/test';
import { size, enableCursor, navigateToDispenseHistory, closeAndSave } from '../../../.agent-hq/qa-driver-utils.mjs';

const criterionId = 'error-resilience';
const videoDir = '.agent-hq/pw-videos';

console.log('=== Criterion 6: Error resilience ===');

try {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: 'tests/.auth/user.json',
    viewport: size,
    recordVideo: { dir: videoDir, size },
    javaScriptEnabled: true
  });
  
  const page = await context.newPage();
  await enableCursor(page);
  await navigateToDispenseHistory(page);
  
  console.log('Counting initial items...');
  const initialCount = await page.locator('svg.lucide-package').count();
  console.log(`Initial count: ${initialCount}`);
  
  // Enable offline mode to simulate network failure
  console.log('Enabling offline mode...');
  await context.setOffline(true);
  
  // Try to scroll and trigger next page
  const scrollContainer = page.locator('.lg\\:block.overflow-y-auto').first();
  await scrollContainer.evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await page.waitForTimeout(3000);
  
  // Verify first page items still visible
  const offlineCount = await page.locator('svg.lucide-package').count();
  console.log(`Count while offline: ${offlineCount}`);
  
  if (offlineCount !== initialCount) {
    throw new Error(`Items changed while offline: initial=${initialCount}, offline=${offlineCount}`);
  }
  
  console.log('✓ First page items persisted during network failure');
  
  // Re-enable network
  console.log('Re-enabling network...');
  await context.setOffline(false);
  await page.waitForTimeout(1000);
  
  // Try scrolling again - should now load
  await scrollContainer.evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await page.waitForTimeout(3000);
  
  const recoveredCount = await page.locator('svg.lucide-package').count();
  console.log(`Count after network recovery: ${recoveredCount}`);
  
  if (recoveredCount <= initialCount) {
    console.log('⚠️  Note: Second page did not load after recovery (may need manual retry)');
  } else {
    console.log('✓ Successfully loaded next page after recovery');
  }
  
  console.log('✓ Criterion 6 passed: Error resilience verified');
  
  await closeAndSave(context, browser, `${videoDir}/temp.webm`, criterionId);
  
} catch (error) {
  console.error('✗ Criterion 6 failed:', error.message);
  process.exit(1);
}
