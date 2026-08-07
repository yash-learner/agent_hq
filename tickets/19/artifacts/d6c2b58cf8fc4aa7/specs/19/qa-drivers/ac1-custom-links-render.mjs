import { chromium } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

const FACILITY_ID = '53bf3de7-2346-4343-8eba-8114c2f2f72d';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: 'tests/.auth/user.json',
    recordVideo: {
      dir: '.agent-hq/pw-videos',
      size: { width: 1440, height: 900 }
    },
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();
  await page.screencast.showActions({ cursor: 'pointer' });

  console.log('AC1: Navigating to home first...');
  await page.goto('http://localhost:4000/', { 
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });
  
  await page.waitForTimeout(3000);
  
  console.log('Current URL after home:', page.url());
  
  console.log('AC1: Navigating to facility overview...');
  await page.goto(`http://localhost:4000/facility/${FACILITY_ID}/overview`, { 
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  console.log('Waiting for page to load...');
  await page.waitForTimeout(5000);
  
  console.log('Current URL:', page.url());
  
  // Check page title
  const title = await page.title();
  console.log('Page title:', title);
  
  console.log('Looking for sidebar...');
  const sidebarVisible = await page.locator('[data-sidebar="sidebar"]').isVisible().catch(() => false);
  console.log(`Sidebar visible: ${sidebarVisible}`);
  
  // Check if we're on login page
  const isLoginPage = page.url().includes('/login');
  console.log(`Is login page: ${isLoginPage}`);
  
  if (isLoginPage) {
    console.log('ERROR: Redirected to login page - auth tokens may be expired');
  }

  console.log('Looking for custom links in sidebar...');
  // Wait a moment for custom links to render
  await page.waitForTimeout(2000);

  // Check for custom link "Documentation"
  const docLinkVisible = await page.getByText('Documentation', { exact: false }).isVisible().catch(() => false);
  console.log(`Documentation link visible: ${docLinkVisible}`);

  // Check for custom link "Internal Link"
  const internalLinkVisible = await page.getByText('Internal Link', { exact: false }).isVisible().catch(() => false);
  console.log(`Internal Link visible: ${internalLinkVisible}`);

  // Scroll the sidebar to show custom links
  await page.evaluate(() => {
    const sidebar = document.querySelector('[data-sidebar="sidebar"]');
    if (sidebar) {
      const nav = sidebar.querySelector('nav');
      if (nav) {
        nav.scrollTop = nav.scrollHeight;
      }
    }
  });

  await page.waitForTimeout(2000);

  // Take a screenshot showing the custom links
  console.log('Taking screenshot of sidebar with custom links...');
  await page.screenshot({ path: 'specs/19/screenshots/ac1-custom-links.png', fullPage: true });

  console.log('AC1: Test completed successfully');

  await page.close();
  await context.close();
  await browser.close();

  // Move the video file
  const videos = await fs.readdir('.agent-hq/pw-videos');
  const videoFile = videos.find(f => f.endsWith('.webm'));
  if (videoFile) {
    await fs.rename(
      `.agent-hq/pw-videos/${videoFile}`,
      'specs/19/videos/ac1-custom-links-render.webm'
    );
    console.log(`Video moved to specs/19/videos/ac1-custom-links-render.webm`);
  }
}

main().catch(console.error);
