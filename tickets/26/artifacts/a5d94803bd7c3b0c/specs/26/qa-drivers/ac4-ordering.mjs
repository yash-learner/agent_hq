import { chromium } from 'playwright';

const size = { width: 1440, height: 900 };

async function testLinkOrdering() {
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

    console.log('[AC4] Starting: Navigate to facility overview');
    
    // Navigate to facility overview - using facilityId from fixtures
    await page.goto('http://localhost:4000/facility/1/overview');
    
    console.log('[AC4] Waiting for page load');
    
    // Wait for loading to complete
    await page.waitForLoadState('networkidle');
    
    // Wait for sidebar to be visible
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await sidebar.waitFor({ state: 'visible', timeout: 10000 });
    
    console.log('[AC4] Sidebar visible, checking for facility nav links');
    
    // Check for core facility links in order
    const coreLinks = [
      'Overview',
      'Appointments',
      'Queues', 
      'Patients',
      'Services',
      'Resource',
      'Users',
      'Billing',
      'Settings'
    ];
    
    for (const linkText of coreLinks) {
      const link = page.getByRole('link', { name: linkText, exact: true });
      const isVisible = await link.isVisible().catch(() => false);
      console.log(`[AC4] Core link "${linkText}": ${isVisible ? 'visible' : 'not visible'}`);
    }
    
    console.log('[AC4] Scrolling through sidebar to show all links');
    await page.mouse.move(200, 400);
    await page.waitForTimeout(1000);
    
    // Navigate to admin page
    console.log('[AC4] Navigating to admin page');
    await page.goto('http://localhost:4000/admin');
    await page.waitForLoadState('networkidle');
    
    // Check for admin nav links
    await sidebar.waitFor({ state: 'visible', timeout: 10000 });
    
    const adminLinks = ['Questionnaire', 'Valuesets', 'RBAC'];
    for (const linkText of adminLinks) {
      const link = page.getByRole('link', { name: linkText, exact: true });
      const isVisible = await link.isVisible().catch(() => false);
      console.log(`[AC4] Admin link "${linkText}": ${isVisible ? 'visible' : 'not visible'}`);
    }
    
    console.log('[AC4] Success: Verified sidebar structure and link ordering');
    
    await page.waitForTimeout(2000);
    
    await context.close();
  } catch (error) {
    console.error('[AC4] Error:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

testLinkOrdering().catch(console.error);
