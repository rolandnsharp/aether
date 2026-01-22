Jan 23, 2026, 02:28:35 

1. Node-API Module with JACK (SAFEST + BEST)
   - Write C/C++ Node-API module wrapping JACK
   - Works with BOTH Node AND Bun (Bun supports Node-API)
   - Production-stable (official recommendation)
   - 32-bit float + low latency
   - 1-2 days development time
 2. Switch to Node + naudiodon2 (QUICK + STABLE)
   - Use existing maintained library
   - Lose Bun's speed benefits
   - But production-ready immediately
   - Higher latency (~10-15ms vs 1-5ms)
 3. Stay with Speaker + Optimize (PRAGMATIC)
   - Keep current setup
   - Document limitations
   - Wait for Bun FFI to mature
   - Add optimizations (dithering, smaller buffers)
 4. JACK FFI (EXPERIMENTAL) - Only if willing to accept risks
   - Best performance IF it works
   - Have Speaker as fallback
   - Expect crashes during development
   - Not production-ready
