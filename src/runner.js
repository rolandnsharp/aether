#!/usr/bin/env bun

// ============================================================================
// KANON LIVE CODING RUNNER
// ============================================================================
// Watches a session file and hot-reloads it on changes
// Usage: bun kanon <session-file.js>
//
// Requires Bun for proper tail call optimization (TCO)

const fs = require('fs');
const path = require('path');
const kanon = require('./index');

// Get session file from command line
const sessionFile = process.argv[2];

if (!sessionFile) {
  console.error('Usage: kanon <session-file.js>');
  process.exit(1);
}

const sessionPath = path.resolve(sessionFile);

if (!fs.existsSync(sessionPath)) {
  console.error(`Session file not found: ${sessionPath}`);
  process.exit(1);
}

console.log('Kanon Live Coding Runner');
console.log('========================');
console.log(`Session: ${sessionPath}`);
console.log('Watching for changes...\n');

// Track which functions were defined in the last load
let lastFunctions = new Set();

// Load and execute session file
function loadSession() {
  try {
    // Clear require cache for hot reload
    delete require.cache[sessionPath];

    // Get current functions before reload
    const beforeFunctions = new Set(kanon.list());

    // Clear all functions
    kanon.clear();

    // Load the session file
    require(sessionPath);

    // Boot the audio engine now that players are registered
    kanon.boot();

    // Get functions after reload
    const afterFunctions = new Set(kanon.list());

    // Show what changed
    const added = [...afterFunctions].filter(s => !beforeFunctions.has(s));
    const removed = [...beforeFunctions].filter(s => !afterFunctions.has(s));
    const updated = [...afterFunctions].filter(s => beforeFunctions.has(s));

    console.log(`[${new Date().toLocaleTimeString()}] Reloaded`);
    if (added.length > 0) console.log(`  + Added: ${added.join(', ')}`);
    if (removed.length > 0) console.log(`  - Removed: ${removed.join(', ')}`);
    if (updated.length > 0) console.log(`  ↻ Updated: ${updated.join(', ')}`);
    console.log('');

    lastFunctions = afterFunctions;
  } catch (err) {
    console.error(`[${new Date().toLocaleTimeString()}] Error loading session:`);
    console.error(err.message);
    console.error('');
  }
}

// Initial load
loadSession();

// Watch for file changes
fs.watch(sessionPath, (eventType) => {
  if (eventType === 'change') {
    // Debounce: wait a bit for file write to complete
    setTimeout(loadSession, 100);
  }
});

// Handle exit
process.on('SIGINT', () => {
  console.log('\nStopping audio...');
  kanon.stopAudio();
  process.exit(0);
});
