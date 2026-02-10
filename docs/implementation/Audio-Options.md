[Home](../Home.md) > [Implementation](#) > Audio-Options

# Audio Library Options for Signal (2026)

## Current Situation

**Current:** `speaker` library (v0.5.5)
- **Sample Rate:** 48 kHz (fixed)
- **Bit Depth:** 16-bit (fixed)
- **Latency:** ~85ms (4096 sample buffer)
- **Dynamic Range:** -96 dB

**Problem:** "Low definition" audio
- Subtle harmonics lost below -96 dB quantization floor
- No configuration options
- Latency too high for live performance
- Mathematical synthesis deserves better fidelity

## Research Summary

### What We Explored

1. **naudiodon/naudiodon2** ❌
   - Requires native compilation (node-gyp)
   - Fails to build with Bun
   - Would require switching to Node

2. **Bun FFI** ⚠️
   - Officially marked **EXPERIMENTAL**
   - Known crashes and segfaults
   - Not recommended for production
   - [Official docs](https://bun.com/docs/runtime/ffi) explicitly warn against production use

3. **Web Audio API** ❌
   - Browser-only
   - Not available in Bun CLI runtime

## Recommended Solutions (Linux)

### Option 1: Node-API Module + JACK 🏆 RECOMMENDED

**What:** Write a C/C++ addon using Node-API that wraps JACK Audio

**Why:**
- ✅ **Production-stable** (official Bun recommendation)
- ✅ **Works with Bun** (Node-API is officially supported)
- ✅ **32-bit float audio** (-1500 dB dynamic range)
- ✅ **Ultra-low latency** (1-5ms typical)
- ✅ **Professional routing** (connect to other apps)
- ✅ **Industry standard** for Linux live coding

**Requirements:**
```bash
sudo apt-get install libjack-jackd2-dev jackd2 qjackctl
npm install node-addon-api
```

**Development Time:** 8-10 hours

**Example Usage:**
```javascript
const jack = require('./build/Release/jack_audio.node');

jack.start({
  sampleRate: 48000,
  bufferSize: 256,  // 5ms latency!
  callback: (leftBuffer, rightBuffer, frames) => {
    // Fill buffers with synthesis (32-bit float)
    for (let i = 0; i < frames; i++) {
      const sample = synthesize(time);
      leftBuffer[i] = sample.left;
      rightBuffer[i] = sample.right;
    }
  }
});
```

**Architecture:**
```
Signal.js (Bun)
    ↓
jack_audio.node (Node-API C++ addon)
    ↓
JACK Audio Server
    ↓
Hardware / Other Apps
```

**Advantages:**
- Same module works with Node AND Bun
- Production-tested (Node-API used by thousands of packages)
- No experimental warnings
- Professional-grade audio
- Can route to effects, recording, etc.

**Disadvantages:**
- Requires writing C/C++ code
- Need to compile native addon
- Requires JACK server running

---

### Option 2: Switch to Node + naudiodon2

**What:** Use Node.js with the naudiodon2 library

**Why:**
- ✅ **Production-ready** npm package
- ✅ **32-bit float** support
- ✅ **Flexible sample rates** (up to 192 kHz)
- ✅ **Works immediately** (no custom code)

**Requirements:**
```bash
npm install naudiodon2
```

**Development Time:** 2-3 hours (port from Bun to Node)

**Disadvantages:**
- ❌ **Lose Bun benefits** (speed, tail-call optimization)
- ❌ **Higher latency** (~10-15ms vs JACK's 1-5ms)
- ❌ **No JACK routing** (can't connect to other apps easily)
- ❌ **Slower runtime** for math-heavy synthesis

**Verdict:** Works but sacrifices Bun's advantages

---

### Option 3: Stay with Speaker (Pragmatic)

**What:** Keep current `speaker` library, document limitations

**Why:**
- ✅ **Works now** (no development needed)
- ✅ **No dependencies** to install
- ✅ **Simple** to maintain

**Improvements:**
- Apply dithering to reduce quantization artifacts
- Document 16-bit limitation clearly
- Use smaller write buffers where possible
- Recommend users upsample via OS settings

**Development Time:** 1-2 hours (optimizations)

**Disadvantages:**
- ❌ **Still 16-bit** (fundamental limitation)
- ❌ **Still ~85ms latency**
- ❌ **Doesn't solve "low definition" problem**

**Verdict:** Only acceptable as interim solution while waiting for Bun FFI to mature

---

### Option 4: Bun FFI + JACK ⚠️ EXPERIMENTAL

**What:** Use Bun's FFI to call JACK directly

**Why:**
- ✅ **Best latency possible** (1-2ms)
- ✅ **32-bit float**
- ✅ **Leverages Bun's FFI speed**

**Disadvantages:**
- ❌ **Experimental** (official warning)
- ❌ **Known crashes** and segfaults
- ❌ **Not production-ready**
- ❌ **May break in future Bun versions**

**Development Time:** 4-6 hours

**Verdict:** Only if willing to accept experimental status and potential crashes. Must have fallback to Speaker.

---

## Comparison Table

| Solution | Bit Depth | Latency | Stability | Bun Compatible | Dev Time | Routing |
|----------|-----------|---------|-----------|----------------|----------|---------|
| **Node-API + JACK** | 32-bit float | 1-5ms | ✅ Production | ✅ Yes | 8-10h | ✅ Yes |
| **Node + naudiodon2** | 32-bit float | 10-15ms | ✅ Production | ❌ No (Node only) | 2-3h | ❌ No |
| **Speaker (current)** | 16-bit | 85ms | ✅ Stable | ✅ Yes | 0h | ❌ No |
| **Bun FFI + JACK** | 32-bit float | 1-5ms | ⚠️ Experimental | ✅ Yes | 4-6h | ✅ Yes |

---

## Recommendation

### For Production: **Node-API + JACK**

This is the BEST solution for professional audio with Bun:

**Benefits:**
1. Solves "low definition" with 32-bit float
2. Ultra-low latency for live performance (1-5ms)
3. Production-stable (no experimental features)
4. Professional routing capabilities
5. Works with Bun officially
6. Future-proof (works with Node too)

**Development Investment:**
- 8-10 hours initial development
- One-time C/C++ code writing
- Maintained as part of Signal project

**Long-term Value:**
- Professional-grade audio forever
- No vendor lock-in (works with Node + Bun)
- Industry standard (JACK used by live coding community)
- Can grow into complex audio routing as project matures

---

## Getting Started with Node-API + JACK

### 1. Install Dependencies

```bash
# JACK Audio
sudo apt-get install jackd2 libjack-jackd2-dev qjackctl

# Node-API helpers
npm install node-addon-api

# Build tools (if not installed)
sudo apt-get install build-essential
```

### 2. Project Structure

```
signal/
├── src/
│   ├── audio/
│   │   ├── jack_audio.cc         # Node-API C++ code
│   │   ├── binding.gyp           # Build configuration
│   │   └── HighQualityAudio.js   # JavaScript wrapper
│   └── index.js                  # Main Signal library
├── build/
│   └── Release/
│       └── jack_audio.node       # Compiled addon
└── package.json
```

### 3. Minimal Example

**binding.gyp:**
```json
{
  "targets": [{
    "target_name": "jack_audio",
    "sources": ["src/audio/jack_audio.cc"],
    "libraries": ["-ljack"],
    "include_dirs": [
      "<!@(node -p \"require('node-addon-api').include\")"
    ],
    "cflags!": ["-fno-exceptions"],
    "cflags_cc!": ["-fno-exceptions"],
    "defines": ["NAPI_DISABLE_CPP_EXCEPTIONS"]
  }]
}
```

**jack_audio.cc:**
```cpp
#include <napi.h>
#include <jack/jack.h>

// JACK callback
int process(jack_nframes_t nframes, void *arg) {
  // Get output buffers
  // Call JavaScript callback
  // Fill with audio
  return 0;
}

Napi::Value Start(const Napi::CallbackInfo& info) {
  // Create JACK client
  // Register process callback
  // Activate
  return Napi::Boolean::New(info.Env(), true);
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("start", Napi::Function::New(env, Start));
  return exports;
}

NODE_API_MODULE(jack_audio, Init)
```

### 4. Build and Test

```bash
# Build addon
npm run build  # or: node-gyp rebuild

# Test with Bun
bun test-jack.js

# If successful, integrate with Signal
```

---

## Alternative: Wait for Bun FFI to Mature

If Node-API feels like too much work, the pragmatic approach:

1. **Keep Speaker for now**
2. **Document limitations** in README
3. **Monitor Bun FFI progress** (check quarterly)
4. **Switch when stable** (likely 6-12 months)

Bun FFI will eventually be production-ready - it's just not there yet in 2026.

---

## Sources

- [Bun FFI Documentation (experimental warning)](https://bun.com/docs/runtime/ffi)
- [Is Bun Production-Ready in 2026?](https://dev.to/last9/is-bun-production-ready-in-2026-a-practical-assessment-181h)
- [Bun vs Node.js 2025 Performance Guide](https://strapi.io/blog/bun-vs-nodejs-performance-comparison-guide)
- [JACK Audio Connection Kit](https://jackaudio.org/)
- [Node-API Documentation](https://nodejs.org/api/n-api.html)

---

## Questions?

- **"Is Node-API hard to learn?"** - Moderate. If you know C/C++, it takes a weekend.
- **"Can I use TypeScript with Node-API?"** - Yes! Use node-addon-api for C++ templates.
- **"Does JACK work without a server?"** - No, but `qjackctl` makes it easy to start.
- **"Can I deploy this?"** - Yes! The compiled `.node` file is portable.

---

**Last Updated:** January 2026
**Recommendation:** Node-API + JACK for production-ready 32-bit float audio with Bun
