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

  const urlWithSearch = page.url();
  console.log("URL with search:", urlWithSearch);

  console.log("Refreshing page...");
  await page.reload({ waitUntil: "networkidle" });
  
  await page.waitForTimeout(2000);

  const urlAfterRefresh = page.url();
  console.log("URL after refresh:", urlAfterRefresh);

  // Check if search term persisted in input
  const searchInputAfterRefresh = page.getByPlaceholder("Search healthcare services...");
  const inputValue = await searchInputAfterRefresh.inputValue();
  
  console.log("Search input value after refresh:", inputValue);

  if (inputValue === "Pathology" && urlAfterRefresh.includes('search=Pathology')) {
    console.log("✅ AC7: Search term persists on page refresh - PASS");
  } else {
    console.log("❌ AC7: Search term did not persist");
  }

  await page.waitForTimeout(2000);

  await page.close();
  await context.close();
  await browser.close();

  console.log("Recording complete");
})();
