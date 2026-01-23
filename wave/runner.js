#!/usr/bin/env bun

// ============================================================================
// WAVE LIVE CODING RUNNER
// ============================================================================
// Watches a session file and hot-reloads it on changes
// Usage: bun runner.js <session-file.js>

import fs from 'fs';
import path from 'path';
import wave from './index.js';

// Get session file from command line
const sessionFile = process.argv[2];

if (!sessionFile) {
  console.error('Usage: wave <session-file.js>');
  console.error('Example: wave session.js');
  process.exit(1);
}

const sessionPath = path.resolve(sessionFile);

if (!fs.existsSync(sessionPath)) {
  console.error(`Session file not found: ${sessionPath}`);
  process.exit(1);
}

console.log('Wave Live Coding Runner');
console.log('======================');
console.log(`Session: ${sessionPath}`);
console.log('Watching for changes...\n');

// Track which waves were defined in the last load
let lastWaves = new Set();

// Load and execute session file
async function loadSession() {
  try {
    // Get current waves before reload
    const beforeWaves = new Set(wave.list());

    // Clear all waves
    wave.clear();

    // Load the session file with cache busting
    // Add timestamp to force reload on each change
    const cacheBust = `?t=${Date.now()}`;
    await import(`${sessionPath}${cacheBust}`);

    // Get waves after reload
    const afterWaves = new Set(wave.list());

    // Show what changed
    const added = [...afterWaves].filter(w => !beforeWaves.has(w));
    const removed = [...beforeWaves].filter(w => !afterWaves.has(w));
    const updated = [...afterWaves].filter(w => beforeWaves.has(w));

    console.log(`[${new Date().toLocaleTimeString()}] Reloaded`);
    if (added.length > 0) console.log(`  + Added: ${added.join(', ')}`);
    if (removed.length > 0) console.log(`  - Removed: ${removed.join(', ')}`);
    if (updated.length > 0) console.log(`  ↻ Updated: ${updated.join(', ')}`);
    console.log('');

    lastWaves = afterWaves;
  } catch (err) {
    console.error(`[${new Date().toLocaleTimeString()}] Error loading session:`);
    console.error(err.message);
    console.error(err.stack);
    console.error('');
  }
}

// Initial load
await loadSession();

// Watch for file changes
fs.watch(sessionPath, (eventType) => {
  if (eventType === 'change') {
    // Debounce: wait a bit for file write to complete
    setTimeout(() => loadSession(), 100);
  }
});

// Handle exit
process.on('SIGINT', () => {
  console.log('\nStopping...');
  wave.stopAudio();
  process.exit(0);
});
