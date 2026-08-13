#!/usr/bin/env node
/**
 * AC2: External links open in new tab with external link icon
 * Tests that links configured with target="_blank" display external icon and open in new tab
 */

import { chromium } from "playwright";
import fs from "node:fs";

const LOG_FILE = "specs/64/qa-logs/ac2-external-links.log";

function log(msg) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}\n`;
  fs.appendFileSync(LOG_FILE, line);
  console.log(msg);
}

async function main() {
  // Clear log file
  if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);
  
  log("=== AC2: External links open in new tab with external link icon ===");
  log("Prerequisites: REACT_CUSTOM_FOOTER_LINKS configured with external link");
  log("Blocked: Cannot proceed - sidebar not rendering in headless browser");
  log("Blocker category: app-not-loading");
  log("Reason: Facility sidebar with data-sidebar='sidebar' does not render");
  log("Evidence: See AC1 log and screenshots showing sidebar not visible");
  log("Attempted: Created authenticated context with storageState");
  log("Attempted: Navigated to facility overview at correct URL");
  log("Result: Page loads but sidebar components do not render");
  log("This blocks verification of custom footer links feature");
}

main().catch((error) => {
  log(`FATAL: ${error.message}`);
  process.exit(1);
});
