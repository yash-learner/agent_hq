#!/usr/bin/env node
/** AC7: Links appear in configuration order, stacked vertically */
import fs from "node:fs";
const LOG_FILE = "specs/64/qa-logs/ac7-link-ordering.log";
const log = (msg) => fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`);
if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);
log("=== Links appear in configuration order, stacked vertically ===");
log("Blocked: app-not-loading - sidebar not rendering");
