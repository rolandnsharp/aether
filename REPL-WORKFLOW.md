# REPL Workflow - Live Coding Best Practices

This document describes best practices for live coding with Kanon using the REPL interface.

## Two Live Coding Methods

### Method 1: File-Based (Hot-Reload)

Edit `live-session.js` and save. The file is automatically reloaded.

```bash
# Start the server
bun src/index.js

# Edit live-session.js in your editor
# Changes apply immediately on save
```

**Cleanup:** Automatic via `clear()` at top of file
```javascript
import { clear } from './src/aether.js';
clear();  // Cleans up all signals and Zap states
```

---

### Method 2: REPL (Interactive)

Send code snippets to the running server via UDP.

```bash
# Terminal 1: Start server
bun src/index.js

# Terminal 2: Interactive REPL
kanon-repl

# Or send a file
kanon-send my-patch.js
```

## Memory Management in REPL Mode

### The Problem

When using the REPL, signals and their states accumulate in memory:

```javascript
// You create signal 1
Zap.register('drone-1', s => ...);

// Later, you create signal 2
Zap.register('drone-2', s => ...);

// Signal 1 is still playing! Both are active.
// State for both signals exists in globalThis.ZAP_STATES
```

### The Solution: Graceful Stop

**TODO:** Implement a `.stop()` method for signals:

```javascript
// Proposed API:
Zap.register('drone', s => {
  // ... signal logic
});

// Later, stop it gracefully:
Zap.stop('drone', {
  fadeOut: 0.5  // Fade out over 0.5 seconds
});

// This should:
// 1. Apply exponential fade to signal
// 2. Unregister from audio engine after fade
// 3. Clean up state from globalThis.ZAP_STATES
// 4. Free memory
```

### Current Workaround

Until `.stop()` is implemented, manually clean up:

```javascript
// Via REPL:

// 1. Unregister signal
Zap.unregister('drone', true);  // true = also clear state

// 2. Or clean all stale states
Zap.cleanStaleStates();

// 3. Or nuclear option (clears everything)
Zap.clearAllStates();
```

## Best Practices

### Start Each REPL Session Clean

```javascript
// First command in REPL session:
import { clear } from './src/aether.js';
clear();  // Cleans all signals and states
```

### Name Your Signals Strategically

```javascript
// Bad: Keeps creating new names
Zap.register('drone-1', ...);
Zap.register('drone-2', ...);
Zap.register('drone-3', ...);  // Now 3 drones playing!

// Good: Reuse names to replace
Zap.register('drone', ...);     // Playing
Zap.register('drone', ...);     // Replaced previous, only 1 playing
```

When you re-register with the same name:
- ✅ Audio signal replaced (no accumulation)
- ✅ State persists (phase continuity)
- ✅ No memory leak

### Check Memory Usage

```javascript
// See all active signals
import { list } from './src/aether.js';
console.log('Active signals:', list());

// See Zap states
console.log('Zap states:', Zap.list());
console.log('State count:', globalThis.ZAP_STATES?.size || 0);
```

### Long REPL Sessions

For multi-hour live coding sessions, periodically clean up:

```javascript
// Every ~30 minutes or when you notice sluggishness:
Zap.cleanStaleStates();
console.log('Cleanup done');
```

## Implementation Notes

### Why Signals Accumulate

Each `Zap.register()` call with a **unique name** creates:
1. Entry in audio engine registry (`globalThis.AETHER_REGISTRY`)
2. State object in `globalThis.ZAP_STATES`
3. Memory allocation for state (phases, buffers, etc.)

Unlike file-based hot-reload (which calls `clear()` on each reload), REPL commands accumulate until manually cleaned.

### State Persistence Benefits

State persistence is **good** for hot-reload but needs **manual management** in REPL:

```javascript
// File-based: State persists across edits (smooth!)
Zap.register('lead', s => {
  if (!s.phase) s.phase = 0;
  s.phase = (s.phase + 440 / s.sr) % 1.0;
  return Math.sin(s.phase * 2 * Math.PI);
});
// Edit frequency to 880 → No click, phase continues

// REPL: Same benefit, but states accumulate
// Need to clean up manually
```

## Future API: Graceful Stop

The ideal API for REPL live coding:

```javascript
// Start a signal
const drone = Zap.register('drone', s => {
  if (!s.phase) s.phase = 0;
  s.phase = (s.phase + 110 / s.sr) % 1.0;
  return Math.sin(s.phase * 2 * Math.PI) * 0.3;
});

// Stop it gracefully (fades out, cleans up)
Zap.stop('drone', {
  fadeOut: 1.0,      // 1 second fade
  onComplete: () => console.log('Stopped cleanly')
});

// Or stop immediately (no fade)
Zap.stop('drone', { immediate: true });

// Or stop all signals
Zap.stopAll({ fadeOut: 2.0 });
```

**Implementation requirements:**
1. Apply exponential envelope: `level *= 0.999` per sample
2. When level < threshold (e.g., 0.001), unregister
3. Clean up state from `globalThis.ZAP_STATES`
4. Callback when complete

**Location:** Add to `/src/arche/zap/index.js`

---

## Quick Reference

| Task | File-Based | REPL |
|------|-----------|------|
| Start clean | `clear()` at top of file | Send `clear()` command |
| Replace signal | Save file (auto-replaces) | Re-register same name |
| Remove signal | Comment out + save | `Zap.unregister(name, true)` |
| Clean memory | Automatic on reload | Manual `cleanStaleStates()` |
| List active | `list()` | `list()` |

---

## See Also

- [Zap Patterns](./docs/advanced/zap-patterns.md) - Synthesis patterns
- [State Management](./docs/STATE_MANAGEMENT_BEST_PRACTICES.md) - General state tips
- [Live Coding Guide](./docs/SURGERY_GUIDE.md) - Surgery guide
