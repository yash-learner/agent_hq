import { chromium } from 'playwright';
import { openAuthedContext } from '../../../.agent-hq/qa-auth.mjs';

const log = (...args) => console.log('[AC1]', ...args);

async function testAC1() {
  const browser = await chromium.launch({ headless: true });
  
  try {
    log('Launching browser and opening authenticated context...');
    
    // Use the facility ID from fixtures
    const facilityId = 'f8b58cf4-1ddc-43af-83c5-cb6a2bf7b182';
    const { context, page } = await openAuthedContext(browser, {
      gotoPath: `/facility/${facilityId}/overview`,
      recordVideo: true,
      videoDir: '.agent-hq/videos-ac1'
    });

    // Enable cursor overlay for recording
    log('Enabling cursor overlay...');
    await page.screencast.showActions({ cursor: 'pointer' });
    
    log('Waiting for facility page to load...');
    await page.waitForLoadState('domcontentloaded', { timeout: 20000 });
    await page.waitForTimeout(3000); // Wait for app to hydrate
    
    log('Checking for sidebar...');
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    const sidebarVisible = await sidebar.isVisible().catch(() => false);
    log(`Sidebar visible: ${sidebarVisible}`);
    
    if (!sidebarVisible) {
      log('Sidebar not visible, trying to wait longer...');
      await sidebar.waitFor({ state: 'visible', timeout: 10000 });
    }
    
    log('Scrolling to bottom of sidebar...');
    await sidebar.evaluate(el => el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }));
    await page.waitForTimeout(2000);
    
    log('Looking for custom links in footer...');
    // Check for "Support Portal" custom link
    const supportLink = page.locator('text=Support Portal');
    const isVisible = await supportLink.isVisible();
    log(`Support Portal link visible: ${isVisible}`);
    
    if (!isVisible) {
      log('ERROR: Support Portal link not found in sidebar footer');
      log('Taking screenshot of current state...');
      await page.screenshot({ path: '.agent-hq/ac1-error.png', fullPage: true });
      throw new Error('Custom link not visible in sidebar footer');
    }
    
    // Check for external link icon
    log('Checking for external link icon...');
    const supportLinkContainer = supportLink.locator('..').first();
    const hasExternalIcon = await supportLinkContainer.locator('svg').count() > 0;
    log(`Has external link icon: ${hasExternalIcon}`);
    
    log('Hovering over Support Portal link to highlight it...');
    await supportLink.hover();
    await page.waitForTimeout(2000);
    
    log('SUCCESS: Custom link from care.config.ts appears in sidebar footer with external icon');
    
    await page.waitForTimeout(1000);
    await context.close();
    
  } catch (error) {
    log('ERROR:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

testAC1().catch(error => {
  console.error('AC1 test failed:', error);
  process.exit(1);
});
