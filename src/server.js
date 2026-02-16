// Aither Server — wires engine + speaker + REPL together.

import { performance, monitorEventLoopDelay } from 'perf_hooks';
import { api, config, generateAudioChunk } from './engine.js';
import { startStream } from './adapters/speaker.js';
import { startReplServer } from './repl/server.js';
import path from 'path';

Object.assign(globalThis, api);

console.log('[Aither] Starting audio engine...');

startStream(generateAudioChunk);
startReplServer(api);

if (process.env.AITHER_PERF_MONITOR === 'true') {
    const histogram = monitorEventLoopDelay();
    histogram.enable();
    setInterval(() => {
        if (histogram.max > 0) {
            console.log(`[Perf] Max event loop delay: ${histogram.max / 1_000_000} ms`);
            histogram.reset();
        }
    }, 5000);
}

const sessionFile = process.argv[2];
if (sessionFile) {
    try {
        await import(path.resolve(process.cwd(), sessionFile));
        console.log(`[Aither] Loaded ${sessionFile}`);
    } catch (e) {
        console.error(`[Aither] Error loading session file:`, e.message);
    }
}
