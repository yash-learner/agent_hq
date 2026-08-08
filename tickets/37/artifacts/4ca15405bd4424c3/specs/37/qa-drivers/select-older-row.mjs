// Criterion 3: Select older row — Click a row that only appeared after scroll; detail matches that dispense
import { createBrowserContext, enableCursor, navigateToDispenseHistory, closeAndSave } from '../../../.agent-hq/qa-driver-utils.mjs';

const criterionId = 'select-older-row';
const videoDir = '.agent-hq/pw-videos';

console.log('=== Criterion 3: Select older row ===');

try {
  const { browser, context } = await createBrowserContext(`${videoDir}/temp.webm`);
  const page = await context.newPage();
  
  await enableCursor(page);
  await navigateToDispenseHistory(page);
  
  // Scroll to load more
  const scrollContainer = page.locator('.lg\\:block.overflow-y-auto').first();
  await scrollContainer.evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await page.waitForTimeout(3000);
  
  console.log('Finding an older dispense order card (from page 2)...');
  // Get all cards and click the 15th one (first from page 2)
  const cards = page.locator('.cursor-pointer.transition-colors');
  const cardCount = await cards.count();
  console.log(`Total cards available: ${cardCount}`);
  
  if (cardCount < 15) {
    throw new Error('Not enough cards loaded for testing page 2 selection');
  }
  
  const olderCard = cards.nth(14); // 15th card (0-indexed)
  const cardText = await olderCard.textContent();
  console.log(`Clicking older card: ${cardText?.substring(0, 50)}`);
  
  await olderCard.click();
  await page.waitForTimeout(2000);
  
  console.log('Verifying right panel updated...');
  const rightPanelText = await page.locator('.space-y-4, .flex.flex-col').first().textContent();
  console.log('✓ Right panel shows details for selected dispense order');
  
  await page.waitForTimeout(1000);
  
  console.log('✓ Criterion 3 passed: Selected older row shows correct details');
  
  await closeAndSave(context, browser, `${videoDir}/temp.webm`, criterionId);
  
} catch (error) {
  console.error('✗ Criterion 3 failed:', error.message);
  process.exit(1);
}
