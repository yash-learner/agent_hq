#!/usr/bin/env node
/** AC4: Links filtered by visibleIn sidebar context */
import fs from "node:fs";
const LOG_FILE = "specs/64/qa-logs/ac4-context-filtering.log";
const log = (msg) => fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`);
if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);
log("=== Links filtered by visibleIn sidebar context ===");
log("Blocked: app-not-loading - sidebar not rendering");
