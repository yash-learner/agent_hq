import { chromium } from "@playwright/test";

const FACILITY_ID = "f3e73e98-23fc-4d1f-8666-d687ab18132a";
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

  console.log("Typing non-existent service name...");
  const searchInput = page.getByPlaceholder("Search healthcare services...");
  await searchInput.click();
  await searchInput.fill("NonExistentService12345");
  
  // Wait for debounce and API response
  await page.waitForTimeout(2000);

  console.log("Checking for empty state message...");
  // Check if "No services found" text is visible
  const emptyState = page.getByText("No services found");
  const isVisible = await emptyState.isVisible();

  if (isVisible) {
    console.log("✅ AC4: Empty state displays 'No services found' - PASS");
    await page.waitForTimeout(2000);
  } else {
    console.log("❌ AC4: Empty state not displayed");
    const pageText = await page.evaluate(() => document.body.innerText);
    console.log("Page text:", pageText.substring(0, 500));
  }

  await page.close();
  await context.close();
  await browser.close();

  console.log("Recording complete");
})();
