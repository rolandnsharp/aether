#!/usr/bin/env bun
// send.js - Sends a session file to the Kanon REPL server
// ============================================================================
// Usage: bun send.js <session-file.js>
// ============================================================================

import dgram from 'dgram';
import fs from 'fs';
import path from 'path';

const PORT = 41234;
const HOST = '127.0.0.1';

// Get file from command line
const sessionFile = process.argv[2];
if (!sessionFile) {
  console.error('Usage: bun send.js <session-file.js>');
  process.exit(1);
}

const sessionPath = path.resolve(sessionFile);
if (!fs.existsSync(sessionPath)) {
  console.error(`File not found: ${sessionPath}`);
  process.exit(1);
}

// Read the file content
let code = fs.readFileSync(sessionPath, 'utf-8');
console.log(`Read ${code.length} bytes from ${sessionFile}.`);

// Strip import statements so the code is valid for eval()
const originalLength = code.length;
code = code.replace(/import.*from '.*';/g, '');
console.log(`Removed ${originalLength - code.length} bytes of import statements.`);

// Prepend a clear() call to ensure old signals are removed
const finalCode = `clear();\n${code}`;
console.log('Prepended clear() command for a clean state replacement.');

// Create a UDP client and send the code
const client = dgram.createSocket('udp4');
client.send(Buffer.from(finalCode), PORT, HOST, (err) => {
  if (err) {
    console.error('Error sending message:', err);
    client.close();
    process.exit(1);
  }
  console.log('Code sent successfully to the Kanon server.');
  client.close();
});
