#!/usr/bin/env node
/** AC6: Tooltip displays link name when sidebar is collapsed */
import fs from "node:fs";
const LOG_FILE = "specs/64/qa-logs/ac6-tooltip-collapsed.log";
const log = (msg) => fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`);
if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);
log("=== Tooltip displays link name when sidebar is collapsed ===");
log("Blocked: app-not-loading - sidebar not rendering");
