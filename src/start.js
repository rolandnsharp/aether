#!/usr/bin/env bun
// Kanon CLI - Start the live sound surgery engine
import { spawn } from 'bun';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the project root directory
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Run index.js with hot-reload
const proc = spawn(['bun', '--hot', 'index.js'], {
  cwd: projectRoot,
  stdio: ['inherit', 'inherit', 'inherit'],
});

await proc.exited;
process.exit(proc.exitCode);
