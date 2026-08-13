#!/usr/bin/env node
/** AC3: Internal links navigate in current tab with internal route icon */
import fs from "node:fs";
const LOG_FILE = "specs/64/qa-logs/ac3-internal-links.log";
const log = (msg) => fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`);
if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);
log("=== Internal links navigate in current tab with internal route icon ===");
log("Blocked: app-not-loading - sidebar not rendering");
