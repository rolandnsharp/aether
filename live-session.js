// live-session.js - `lel` Startup Script / Example Showcase
// This file is loaded once when the `lel` engine starts.
// Use the REPL to interact with the engine live (e.g., `register(...)`, `unregister(...)`).

// All functions exported by helpers.js are globally available here (e.g., `gain`, `tremolo`).
// The engine's core API (`register`, `unregister`, `clear`, `setPosition`) are also global.

// Clear any existing signals from a previous hot-reload (if running in `--hot` mode during dev).
clear(true); // Full reset for a clean start

// --- Helper Oscillator for Examples ---
// This is a simple, stateful oscillator. Note how it uses its own s.state[0]
// as the helpers now manage their memory from a separate pool.
const userOsc = (freq, phaseSlot = 0) => s => {
    s.state[phaseSlot] = (s.state[phaseSlot] + freq / s.sr) % 1.0;
    return Math.sin(s.state[phaseSlot] * 2 * Math.PI);
};


// --- Example 1: Simple Filtered & Delayed Sine Wave ---
// This showcases composition with stateful and stateless helpers.
// The helpers manage their state automatically.
register('filtered-delayed-sine',
  pipe(
    userOsc(440), // Base oscillator at 440Hz
    signal => lowpass(signal, 800), // Lowpass filter at 800Hz
    signal => tremolo(signal, 5, 0.8), // Tremolo: 5Hz rate, 80% depth
    signal => delay(signal, 0.5, 0.25), // Delay: max 0.5s, actual 0.25s
    signal => gain(signal, 0.4) // Overall gain
  )
);


// --- Example 2: Another Independent Signal Chain ---
register('panning-osc',
  pipe(
    userOsc(220), // Base oscillator at 220Hz
    signal => gain(signal, 0.5), // Gain
    signal => pan(signal, s => Math.sin(s.t * 0.1)) // Pan LFO
  )
);

console.log("Initial signals loaded from live-session.js. Use REPL to explore!");
