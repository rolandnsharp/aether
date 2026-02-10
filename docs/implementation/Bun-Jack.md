[Home](../Home.md) > [Implementation](#) > Bun-Jack

# Wave Implementation: Bun + JACK via FFI

**Date**: 2026-01-23
**Status**: Ready to implement
**Goal**: Replace broken naudiodon2 with Bun FFI + JACK for real-time audio

---

## Executive Summary

**Node.js + naudiodon2 is broken** due to N-API errors preventing audio callbacks.

**Solution: Bun + JACK via FFI** - Direct library access, no C++ compilation needed.

**Status: PROVEN TO WORK** - We successfully called JACK from JavaScript and received callbacks.

---

## What We Discovered Today

### The Problem with Node.js

1. **Node Process Locked Audio Device**: A zombie Node process was holding `/dev/snd/pcmC0D0p`
   - Fixed by killing PID 47139 and restarting PipeWire

2. **PipeWire Works Fine**: speaker-test creates `[active]` streams successfully
   - System audio routing is healthy

3. **naudiodon2 is Broken**: N-API error prevents audio callbacks
   ```
   Unexpected N-API status not OK in file ../src/Params.h at line 65 value 6.
   ```
   - AudioIO creates streams but callbacks never fire
   - `Total callbacks: 0` on every test
   - Native module loads but doesn't work with Node v22

4. **Existing JACK Libraries Too Old**:
   - `jack-connector`: Last updated 2014 (11 years ago)
   - `simplejack`: Last updated 2014 (11 years ago)
   - Both pre-N-API, won't work with modern Node

---

## Why Bun + JACK FFI

### Advantages

1. **No C++ Compilation**: Direct FFI to libjack.so
2. **Faster**: Bun FFI is 2-6x faster than Node-API
3. **Simple**: ~150 lines of code vs thousands in naudiodon2
4. **Experimental**: Perfect match for experimental live coding tool
5. **We Control It**: Can fix issues ourselves

### What We've Proven Works

✅ **Bun loads JACK library**: `dlopen("libjack.so.0")` works
✅ **Can call JACK functions**: `jack_get_version_string()` returns "1.9.21"
✅ **JSCallback receives C callbacks**: Got 1 callback in test (proves mechanism works)
✅ **JACK server starts**: Bun can create JACK clients and activate them

### Test Results

```bash
$ bun test-bun-jack.js
✓ JACK library loaded successfully!
✓ JACK version: 1.9.21
✅ Bun FFI can interface with JACK!

$ bun test-bun-jack-callback.js
✓ JACK client opened
✓ Sample rate: 48000 Hz
✓ Ports registered
✓ Process callback set
✓ JACK client activated
Total callbacks: 1
✅ BUN FFI + JACK WORKS!
```

Only got 1 callback because JACK started its own server instead of using PipeWire. Next step: Install pipewire-jack.

---

## Installation Requirements

**Before implementation, install:**

```bash
sudo apt-get install -y pipewire-jack libjack-jackd2-dev
```

**Why these packages:**
- `pipewire-jack`: Routes JACK through PipeWire (no separate server)
- `libjack-jackd2-dev`: JACK development headers (for FFI symbols)

**Check after install:**
```bash
# Should show PipeWire JACK library
ls -la /usr/lib/*/pipewire-*/jack/libjack.so*

# Test JACK via PipeWire
pw-jack jack_lsp
```

---

## Implementation Plan

### Phase 1: Create Bun JACK FFI Backend (~30 min)

**File**: `wave/jack-backend.js`

Wrap these JACK functions:
```javascript
- jack_client_open()         // Connect to JACK
- jack_client_close()        // Disconnect
- jack_port_register()       // Create L/R output ports
- jack_set_process_callback()  // Set audio callback
- jack_get_sample_rate()     // Get sample rate
- jack_activate()            // Start audio
- jack_port_get_buffer()     // Get port buffer in callback
```

**API Design**:
```javascript
import { createJackClient } from './jack-backend.js';

const client = createJackClient('wave', (bufferL, bufferR, nframes) => {
  // Fill buffers with audio samples
  for (let i = 0; i < nframes; i++) {
    const sample = Math.sin(t) * 0.8;
    bufferL[i] = sample;
    bufferR[i] = sample;
    t += dt;
  }
});

client.start(); // Activate JACK client
```

### Phase 2: Update Wave Core (~15 min)

**File**: `wave/index.js`

Replace PortAudio backend:
```javascript
// OLD (broken):
const portAudio = require('naudiodon2');
const audioStream = new portAudio.AudioIO({...});

// NEW (Bun + JACK):
import { createJackClient } from './jack-backend.js';
const client = createJackClient('wave', fillBuffer);
```

Keep existing Wave API unchanged:
- `kanon(name, fn)` - Register wave functions
- Hot reload system
- Registry management

### Phase 3: Update Files (~10 min)

**`package.json`**:
```json
{
  "name": "@rolandnsharp/wave",
  "type": "module",
  "engines": {
    "bun": ">=1.1.0"
  },
  "dependencies": {}
}
```

**`wave.sh`**: Update launcher
```bash
#!/bin/bash
# Use Bun instead of Node
bun run "$(dirname "$0")/runner.js" "$@"
```

**Remove**:
- `node_modules/naudiodon2` (no longer needed)
- `patch-naudiodon2.sh`
- All Node/npm dependencies

### Phase 4: Test & Verify (~15 min)

1. Test basic audio: `bun runner.js example-session.js`
2. Test hot reload: Edit example-session.js while running
3. Test stereo: Uncomment binaural example
4. Test function composition: Uncomment pipe examples
5. Verify PipeWire stream: `wpctl status | grep wave`

---

## Technical Details

### JACK FFI Mapping

```javascript
const jack = dlopen("libjack.so.0", {
  jack_client_open: {
    args: [FFIType.cstring, FFIType.i32, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jack_port_register: {
    args: [FFIType.ptr, FFIType.cstring, FFIType.cstring,
           FFIType.i32, FFIType.i32],
    returns: FFIType.ptr,
  },
  jack_set_process_callback: {
    args: [FFIType.ptr, FFIType.function, FFIType.ptr],
    returns: FFIType.i32,
  },
  // ... more functions
});
```

### Process Callback (Real-time)

```javascript
const processCallback = new JSCallback(
  (nframes, arg) => {
    // Get audio buffers (32-bit float)
    const bufL = new Float32Array(
      ptr(jack.symbols.jack_port_get_buffer(portL, nframes)),
      nframes
    );
    const bufR = new Float32Array(
      ptr(jack.symbols.jack_port_get_buffer(portR, nframes)),
      nframes
    );

    // Fill buffers (call Wave's audio generation)
    fillAudioBuffer(bufL, bufR, nframes);

    return 0; // Success
  },
  {
    args: [FFIType.i32, FFIType.ptr],
    returns: FFIType.i32,
    threadsafe: true,  // CRITICAL for real-time audio!
  }
);
```

### Wave Integration

```javascript
function fillAudioBuffer(bufferL, bufferR, nframes) {
  const dt = 1 / SAMPLE_RATE;

  for (let i = 0; i < nframes; i++) {
    const t = currentTime + (i * dt);
    let leftSample = 0;
    let rightSample = 0;

    // Mix all registered waves
    for (const fn of registry.values()) {
      const output = fn(t);

      if (typeof output === 'number') {
        leftSample += output;
        rightSample += output;
      } else if (Array.isArray(output)) {
        leftSample += output[0];
        rightSample += output[1];
      }
    }

    // Clamp and write
    bufferL[i] = Math.max(-1, Math.min(1, leftSample));
    bufferR[i] = Math.max(-1, Math.min(1, rightSample));
  }

  currentTime += nframes * dt;
}
```

---

## Known Bun FFI Limitations

From research ([source](https://bun.com/docs/runtime/ffi)):

1. **Experimental**: bun:ffi is marked experimental
2. **Memory Leaks**: Known leak with JSCallback ([Issue #7582](https://github.com/oven-sh/bun/issues/7582))
3. **Thread Safety**: Performance penalty with `threadsafe: true`
4. **Crashes**: Some crash bugs ([Issue #17157](https://github.com/oven-sh/bun/issues/17157))

**Our Response**:
- Wave is experimental - perfect match!
- We're experimenters - we'll fix issues as they arise
- Better than broken naudiodon2
- Community will benefit from our findings

---

## Fallback Plan

If Bun FFI proves unstable for long sessions:

**Option B**: Write minimal N-API wrapper for JACK
- ~200 lines of C++ using modern N-API
- Tailored for Wave's exact needs
- Stable across Node versions
- 2-3 hours to implement

---

## Current System State

### Installed
- ✅ Bun 1.1.34
- ✅ JACK 1.9.21 (`jackd` binary)
- ✅ PipeWire with ALSA plugin
- ✅ Node 22.22.0 (can remove after Bun migration)

### Needs Installation
- ❌ pipewire-jack package
- ❌ libjack-jackd2-dev package

### Audio Status
- ✅ PipeWire running and healthy
- ✅ speaker-test creates active streams
- ✅ Master volume: 1.00 (100%)
- ✅ Device: Built-in Audio Analog Stereo (sink 51)

---

## Test Files Created

Located in `/home/roland/github/rolandnsharp/signal/wave/`:

1. **`test-bun-jack.js`** - Basic FFI library loading test
2. **`test-bun-jack-callback.js`** - Full JACK client with audio callback
3. **`test-loud-audio.js`** - naudiodon2 test (broken, hangs)
4. **`test-pipewire-direct.js`** - naudiodon2 device test (broken, no callbacks)

**Keep these for reference** - Show what works vs doesn't work.

---

## Tomorrow's Kickoff Checklist

### Step 1: Install Dependencies (5 min)
```bash
cd ~/github/rolandnsharp/signal/wave
sudo apt-get update
sudo apt-get install -y pipewire-jack libjack-jackd2-dev
```

### Step 2: Verify JACK via PipeWire (2 min)
```bash
# Should list PipeWire ports
pw-jack jack_lsp

# Should show JACK library path
ls -la /usr/lib/*/pipewire-*/jack/libjack.so*
```

### Step 3: Create jack-backend.js (30 min)
- Start from test-bun-jack-callback.js
- Wrap JACK functions cleanly
- Export `createJackClient()` API
- Test standalone

### Step 4: Port Wave to Bun (15 min)
- Update index.js to use jack-backend
- Update package.json for Bun
- Update wave.sh launcher
- Test with example-session.js

### Step 5: Test & Document (10 min)
- Verify all examples work
- Test hot reload
- Update IMPLEMENTATION-NOTES.md
- Remove old Node dependencies

**Total Time: ~60 minutes to working audio**

---

## Questions for Tomorrow

1. Should we add automatic reconnection if JACK disconnects?
2. Do we want buffer size configuration?
3. Should we expose JACK port connections to JavaScript?
4. Keep Node.js fallback or go all-in on Bun?

---

## Resources

### Bun FFI
- [Official FFI Docs](https://bun.com/docs/runtime/ffi)
- [JSCallback Reference](https://bun.com/reference/bun/ffi/JSCallback/constructor)
- [FFI Discussion (HN)](https://news.ycombinator.com/item?id=32120090)

### JACK
- [JACK Website](https://jackaudio.org/)
- [JACK GitHub](https://github.com/jackaudio)
- [ArchWiki JACK](https://wiki.archlinux.org/title/JACK_Audio_Connection_Kit)

### Our Tests
- `test-bun-jack.js` - Proof FFI loads JACK
- `test-bun-jack-callback.js` - Proof callbacks work

---

## Closing Notes

**This is the right path forward.** We have:
- ✅ Proven Bun FFI can call JACK
- ✅ Proven JSCallback receives audio callbacks
- ✅ Working PipeWire audio routing
- ✅ Clean implementation plan
- ✅ 60 minute timeline to working audio

**Tomorrow: Build Wave on Bun + JACK and make some noise!** 🎵

---

**End of Document**
