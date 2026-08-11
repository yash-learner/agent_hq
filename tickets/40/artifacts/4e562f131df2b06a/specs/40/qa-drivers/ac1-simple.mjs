import { chromium } from 'playwright';
import fs from 'fs';

const log = (...args) => console.log('[AC1-SIMPLE]', ...args);

async function testAC1Simple() {
  const browser = await chromium.launch({ headless: true });
  
  try {
    log('Creating browser context with auth...');
    const size = { width: 1440, height: 900 };
    const context = await browser.newContext({
      storageState: 'tests/.auth/user.json',
      viewport: size,
      recordVideo: { dir: '.agent-hq/videos-ac1-simple', size },
    });
    
    const page = await context.newPage();
    
    // Enable cursor overlay for recording
    log('Enabling cursor overlay...');
    await page.screencast.showActions({ cursor: 'pointer' });
    
    log('Navigating to login page...');
    await page.goto('http://localhost:4000/login');
    
    log('Filling in login form...');
    await page.waitForSelector('input[name="username"]', { timeout: 15000 });
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    
    log('Clicking login button...');
    await page.click('button:has-text("Sign In")');
    
    log('Waiting for navigation after login...');
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 20000 });
    await page.waitForTimeout(3000);
    
    log('Navigating to facility overview...');
    const facilityId = 'f8b58cf4-1ddc-43af-83c5-cb6a2bf7b182';
    await page.goto(`http://localhost:4000/facility/${facilityId}/overview`);
    await page.waitForTimeout(3000);
    
    log('Waiting for sidebar to appear...');
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await sidebar.waitFor({ state: 'visible', timeout: 15000 });
    
    log('Scrolling to bottom of sidebar...');
    await sidebar.evaluate(el => el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }));
    await page.waitForTimeout(2000);
    
    log('Looking for custom links in footer...');
    const supportLink = page.locator('text=Support Portal');
    const isVisible = await supportLink.isVisible();
    log(`Support Portal link visible: ${isVisible}`);
    
    if (!isVisible) {
      log('ERROR: Support Portal link not found');
      await page.screenshot({ path: '.agent-hq/ac1-simple-error.png', fullPage: true });
      throw new Error('Custom link not visible in sidebar footer');
    }
    
    log('Hovering over Support Portal link...');
    await supportLink.hover();
    await page.waitForTimeout(2000);
    
    log('SUCCESS: Custom link visible in sidebar footer');
    
    await context.close();
    
  } catch (error) {
    log('ERROR:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

testAC1Simple().catch(error => {
  console.error('AC1 test failed:', error);
  process.exit(1);
});
