// Criterion 4: End of list — Scroll until no more pages; further scrolling does not spam requests
import { createBrowserContext, enableCursor, navigateToDispenseHistory, closeAndSave } from '../../../.agent-hq/qa-driver-utils.mjs';

const criterionId = 'end-of-list';
const videoDir = '.agent-hq/pw-videos';

console.log('=== Criterion 4: End of list ===');

try {
  const { browser, context } = await createBrowserContext(`${videoDir}/temp.webm`);
  const page = await context.newPage();
  
  // Track network requests
  const dispenseRequests = [];
  page.on('request', request => {
    if (request.url().includes('/order/dispense/')) {
      dispenseRequests.push({ url: request.url(), time: Date.now() });
    }
  });
  
  await enableCursor(page);
  await navigateToDispenseHistory(page);
  
  const scrollContainer = page.locator('.lg\\:block.overflow-y-auto').first();
  
  console.log('Scrolling until all items loaded...');
  let previousCount = 0;
  let currentCount = await page.locator('svg.lucide-package').count();
  let scrollAttempts = 0;
  const maxScrolls = 5;
  
  while (currentCount > previousCount && scrollAttempts < maxScrolls) {
    previousCount = currentCount;
    await scrollContainer.evaluate((el) => el.scrollTo(0, el.scrollHeight));
    await page.waitForTimeout(2000);
    currentCount = await page.locator('svg.lucide-package').count();
    scrollAttempts++;
    console.log(`Scroll ${scrollAttempts}: ${currentCount} items`);
  }
  
  console.log('✓ Reached end of list');
  
  // Look for end-of-list indicator (horizontal line)
  const hasEndIndicator = await page.locator('.border-b.border-gray-300').count() > 0;
  console.log(`End indicator visible: ${hasEndIndicator}`);
  
  const requestsBeforeExtra = dispenseRequests.length;
  console.log(`Requests before extra scroll: ${requestsBeforeExtra}`);
  
  // Scroll again to verify no extra requests
  await scrollContainer.evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await page.waitForTimeout(2000);
  await scrollContainer.evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await page.waitForTimeout(2000);
  
  const requestsAfterExtra = dispenseRequests.length;
  console.log(`Requests after extra scroll: ${requestsAfterExtra}`);
  
  if (requestsAfterExtra > requestsBeforeExtra) {
    throw new Error(`Extra requests made after end of list: ${requestsAfterExtra - requestsBeforeExtra}`);
  }
  
  console.log('✓ Criterion 4 passed: No spam requests at end of list');
  
  await closeAndSave(context, browser, `${videoDir}/temp.webm`, criterionId);
  
} catch (error) {
  console.error('✗ Criterion 4 failed:', error.message);
  process.exit(1);
}
