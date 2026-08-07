import { chromium } from 'playwright';

const size = { width: 1440, height: 900 };

async function testAuth() {
  const browser = await chromium.launch({ headless: true });
  
  try {
    const context = await browser.newContext({
      storageState: 'tests/.auth/user.json',
      viewport: size,
    });

    const page = await context.newPage();
    
    console.log('[AUTH] Navigating to facility overview');
    await page.goto('http://localhost:4000/facility/1/overview');
    await page.waitForTimeout(3000);
    
    const url = page.url();
    console.log('[AUTH] Current URL:', url);
    
    const title = await page.title();
    console.log('[AUTH] Page title:', title);
    
    // Check for login form
    const usernameInput = await page.locator('input[name="username"]').count();
    const passwordInput = await page.locator('input[name="password"]').count();
    console.log('[AUTH] Username input count:', usernameInput);
    console.log('[AUTH] Password input count:', passwordInput);
    
    // Check for sidebar
    const sidebar = await page.locator('[data-sidebar="sidebar"]').count();
    console.log('[AUTH] Sidebar count:', sidebar);
    
    // Check for any visible nav links
    const allLinks = await page.locator('a').allTextContents();
    console.log('[AUTH] All link texts:', allLinks.slice(0, 20));
    
    // Get page content preview
    const bodyText = await page.locator('body').textContent();
    console.log('[AUTH] Body text (first 500 chars):', bodyText.substring(0, 500));
    
    // Take screenshot for debugging
    await page.screenshot({ path: '.agent-hq/auth-test.png', fullPage: false });
    console.log('[AUTH] Screenshot saved to .agent-hq/auth-test.png');
    
    await context.close();
  } catch (error) {
    console.error('[AUTH] Error:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

testAuth().catch(console.error);
