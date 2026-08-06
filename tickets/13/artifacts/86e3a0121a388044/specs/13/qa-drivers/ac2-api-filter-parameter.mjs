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

  // Set up network interception to capture API calls
  const apiCalls = [];
  page.on('request', request => {
    if (request.url().includes('/api/') && request.url().includes('healthcare_service')) {
      apiCalls.push(request.url());
    }
  });

  console.log("Typing in search input...");
  const searchInput = page.getByPlaceholder("Search healthcare services...");
  await searchInput.click();
  await searchInput.fill("Pathology");
  
  // Wait for debounce
  await page.waitForTimeout(1500);

  console.log("Checking API calls...");
  const relevantCalls = apiCalls.filter(url => url.includes('name=Pathology'));
  
  if (relevantCalls.length > 0) {
    console.log("✅ AC2: API calls include 'name' query parameter - PASS");
    console.log("API call:", relevantCalls[0]);
  } else {
    console.log("❌ AC2: No API calls with 'name' parameter found");
    console.log("All API calls:", apiCalls);
  }

  await page.waitForTimeout(2000);

  await page.close();
  await context.close();
  await browser.close();

  console.log("Recording complete");
})();
