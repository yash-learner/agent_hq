#!/usr/bin/env node
/** AC5: Plugin footer links appear alongside config links */
import fs from "node:fs";
const LOG_FILE = "specs/64/qa-logs/ac5-plugin-links.log";
const log = (msg) => fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`);
if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);
log("=== Plugin footer links appear alongside config links ===");
log("Blocked: missing-test-data - requires test plugin setup");
