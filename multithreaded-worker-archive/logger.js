// logger.js - Persistent logging across hot-reloads
import { appendFileSync } from 'fs';

const LOG_FILE = '/tmp/flux-debug.log';

export function log(...args) {
  const timestamp = new Date().toISOString();
  const message = args.join(' ');
  const line = `[${timestamp}] ${message}\n`;

  // Write to file
  appendFileSync(LOG_FILE, line);

  // Also console.log
  console.log(...args);
}

// Clear log file on first import
if (!globalThis.__FLUX_LOG_INITIALIZED__) {
  globalThis.__FLUX_LOG_INITIALIZED__ = true;
  try {
    require('fs').writeFileSync(LOG_FILE, `=== FLUX DEBUG LOG STARTED ===\n`);
    console.log(`✦ Flux: Logging to ${LOG_FILE}`);
  } catch (e) {
    console.error('Failed to initialize log file:', e);
  }
}
