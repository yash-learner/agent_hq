#!/usr/bin/env node
/**
 * AC5: Patient nav menu has no role badge
 */

import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const size = { width: 1440, height: 900 };
  const context = await browser.newContext({
    viewport: size,
    recordVideo: { dir: ".agent-hq/pw-videos", size },
  });
  
  try {
    const page = await context.newPage();
    
    console.log("[AC5] Patient login flow not available in fixtures");
    console.log("[AC5] Checking code instead - PatientNavUser should not show badge");
    
    // Since patient OTP login is complex and not in fixtures, document as not-exercised
    throw new Error("Patient OTP login not available in fixture data - cannot test live");
    
  } catch (error) {
    console.error(`[AC5] ✗ NOT EXERCISED: ${error.message}`);
    await context.close();
    throw error;
  } finally {
    await browser.close();
  }
}

main().catch(() => process.exit(1));
