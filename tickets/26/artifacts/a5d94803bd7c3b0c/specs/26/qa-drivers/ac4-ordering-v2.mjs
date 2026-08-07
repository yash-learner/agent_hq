import { chromium } from 'playwright';

const size = { width: 1440, height: 900 };

async function testSidebarLinks() {
  const browser = await chromium.launch({ headless: true });
  
  try {
    const context = await browser.newContext({
      storageState: 'tests/.auth/user.json',
      viewport: size,
      recordVideo: { dir: '.agent-hq/pw-videos', size },
    });

    const page = await context.newPage();
    
    // Enable cursor overlay
    await page.screencast.showActions({ cursor: 'pointer' });
    
    console.log('[AC4] Navigating to facility overview');
    await page.goto('http://localhost:4000/facility/1/overview', { waitUntil: 'networkidle' });
    
    console.log('[AC4] Waiting for app to load...');
    // Wait for JavaScript to load and render the app
    await page.waitForTimeout(5000);
    
    // Check for sidebar
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await sidebar.waitFor({ state: 'visible', timeout: 10000 });
    console.log('[AC4] Sidebar is visible');
    
    // Take screenshot
    await page.screenshot({ path: 'specs/26/screenshots/ac4-facility-sidebar.png', fullPage: false });
    console.log('[AC4] Screenshot saved');
    
    // Get all navigation items
    const navItems = await page.locator('[data-sidebar="sidebar"] a').allTextContents();
    console.log('[AC4] Navigation items:', navItems);
    
    // Scroll to show all links
    await page.mouse.move(200, 400);
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(1000);
    
    // Navigate to admin page
    console.log('[AC4] Navigating to admin page');
    await page.goto('http://localhost:4000/admin', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    
    await sidebar.waitFor({ state: 'visible', timeout: 10000 });
    console.log('[AC4] Admin sidebar is visible');
    
    // Take screenshot
    await page.screenshot({ path: 'specs/26/screenshots/ac4-admin-sidebar.png', fullPage: false });
    console.log('[AC4] Admin screenshot saved');
    
    // Get admin navigation items
    const adminNavItems = await page.locator('[data-sidebar="sidebar"] a').allTextContents();
    console.log('[AC4] Admin navigation items:', adminNavItems);
    
    console.log('[AC4] Test completed successfully');
    
    await page.waitForTimeout(2000);
    
    await context.close();
  } catch (error) {
    console.error('[AC4] Error:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

testSidebarLinks().catch(console.error);
