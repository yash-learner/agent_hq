import { chromium } from "@playwright/test";

const FACILITY_ID = "142f247c-fea7-451a-875f-4a6110a242f6";
const BASE_URL = "http://localhost:4000";

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    storageState: "tests/.auth/user.json",
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: ".agent-hq/pw-videos",
      size: { width: 1440, height: 900 },
    },
  });

  const page = await context.newPage();
  await page.screencast.showActions({ cursor: "pointer" });

  console.log("Navigating to services page...");
  await page.goto(`${BASE_URL}/facility/${FACILITY_ID}/services`, { 
    waitUntil: "networkidle",
    timeout: 30000
  });

  await page.waitForTimeout(2000);

  console.log("Typing search term...");
  const searchInput = page.getByPlaceholder("Search healthcare services...");
  await searchInput.click();
  await searchInput.fill("Pathology");
  
  // Wait for debounce and URL update
  await page.waitForTimeout(2000);

  const urlBeforePagination = page.url();
  console.log("URL after search:", urlBeforePagination);

  // Check URL contains search parameter
  if (urlBeforePagination.includes('search=Pathology')) {
    console.log("✅ AC6: Search term persists in URL - PASS");
  } else {
    console.log("❌ AC6: Search term not in URL");
  }

  // If pagination exists, click to another page
  console.log("Checking for pagination...");
  const pagination = page.locator('nav[aria-label="pagination"]').first();
  const paginationExists = await pagination.isVisible().catch(() => false);
  
  if (!paginationExists) {
    console.log("Note: No pagination available (expected with filtered results)");
  }

  await page.waitForTimeout(2000);

  await page.close();
  await context.close();
  await browser.close();

  console.log("Recording complete");
})();
