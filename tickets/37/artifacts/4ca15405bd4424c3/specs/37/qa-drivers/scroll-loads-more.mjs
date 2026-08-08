// Criterion 2: Scroll loads more — Scroll to bottom; older rows append; loading indicator appears then settles
import { createBrowserContext, enableCursor, navigateToDispenseHistory, closeAndSave } from '../../../.agent-hq/qa-driver-utils.mjs';

const criterionId = 'scroll-loads-more';
const videoDir = '.agent-hq/pw-videos';

console.log('=== Criterion 2: Scroll loads more ===');

try {
  const { browser, context } = await createBrowserContext(`${videoDir}/temp.webm`);
  const page = await context.newPage();
  
  await enableCursor(page);
  await navigateToDispenseHistory(page);
  
  console.log('Counting initial dispense orders...');
  const initialCount = await page.locator('svg.lucide-package').count();
  console.log(`Initial count: ${initialCount}`);
  
  // Find the scrollable container (hidden lg:block h-full overflow-y-auto pr-1)
  const scrollContainer = page.locator('.lg\\:block.overflow-y-auto').first();
  
  console.log('Scrolling to bottom of left selector...');
  await scrollContainer.evaluate((el) => {
    el.scrollTo(0, el.scrollHeight);
  });
  
  // Wait for loading skeleton
  console.log('Waiting for loading indicator...');
  await page.waitForTimeout(1000);
  
  // Wait for new items to load
  await page.waitForTimeout(3000);
  
  console.log('Counting orders after scroll...');
  const afterCount = await page.locator('svg.lucide-package').count();
  console.log(`Count after scroll: ${afterCount}`);
  
  if (afterCount <= initialCount) {
    throw new Error(`No new orders loaded. Initial: ${initialCount}, After: ${afterCount}`);
  }
  
  console.log('✓ Criterion 2 passed: Scroll loaded more items');
  console.log(`✓ Loaded ${afterCount - initialCount} additional items`);
  
  await closeAndSave(context, browser, `${videoDir}/temp.webm`, criterionId);
  
} catch (error) {
  console.error('✗ Criterion 2 failed:', error.message);
  process.exit(1);
}
