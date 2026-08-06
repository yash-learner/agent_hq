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
  
  // Wait for debounce and API response
  await page.waitForTimeout(2000);

  console.log("Checking if matching services are displayed...");
  // Check if Pathology Lab is visible
  const pathologyService = page.getByText("Pathology Lab");
  const isVisible = await pathologyService.isVisible();

  if (isVisible) {
    console.log("✅ AC3: Matching services are displayed - PASS");
    // Highlight the service by hovering over it
    await pathologyService.hover();
    await page.waitForTimeout(2000);
  } else {
    console.log("❌ AC3: Matching service not displayed");
  }

  await page.close();
  await context.close();
  await browser.close();

  console.log("Recording complete");
})();
