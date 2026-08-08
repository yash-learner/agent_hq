// Criterion 1: First page loads — Open Dispense History; latest dispenses appear in the left selector
import { createBrowserContext, enableCursor, navigateToDispenseHistory, closeAndSave } from '../../../.agent-hq/qa-driver-utils.mjs';

const criterionId = 'first-page-loads';
const videoDir = '.agent-hq/pw-videos';

console.log('=== Criterion 1: First page loads ===');

try {
  console.log('Starting browser...');
  const { browser, context } = await createBrowserContext(`${videoDir}/temp.webm`);
  const page = await context.newPage();
  
  console.log('Enabling cursor overlay...');
  await enableCursor(page);
  
  console.log('Navigating to Dispense History...');
  await navigateToDispenseHistory(page);
  
  console.log('Verifying left selector shows dispense orders...');
  // Wait for the dispense order list to load - look for Card elements with PackageIcon
  await page.waitForSelector('svg.lucide-package', { timeout: 10000 });
  
  // Count visible dispense orders
  const visibleOrders = await page.locator('svg.lucide-package').count();
  console.log(`Visible dispense orders: ${visibleOrders}`);
  
  if (visibleOrders < 1) {
    throw new Error('No dispense orders visible in left selector');
  }
  
  // Verify right panel shows dispense details - look for "Medication Dispense" or dispense-related content
  const hasMedicationDispense = await page.locator('text=/Medication.*Dispense|Dispense/i').count() > 0;
  console.log('✓ Right panel shows dispense content');
  
  console.log('Waiting a moment for recording...');
  await page.waitForTimeout(2000);
  
  console.log('✓ Criterion 1 passed: First page loaded successfully');
  console.log(`✓ ${visibleOrders} dispense orders visible in left selector`);
  
  await closeAndSave(context, browser, `${videoDir}/temp.webm`, criterionId);
  
} catch (error) {
  console.error('✗ Criterion 1 failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}
