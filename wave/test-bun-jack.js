// Test Bun FFI with JACK
import { dlopen, FFIType, ptr } from "bun:ffi";

console.log("Testing Bun FFI with JACK...\n");

// Try to load JACK library
try {
  const jack = dlopen("libjack.so.0", {
    jack_client_open: {
      args: [FFIType.cstring, FFIType.i32, FFIType.ptr],
      returns: FFIType.ptr,
    },
    jack_get_version_string: {
      args: [],
      returns: FFIType.cstring,
    },
  });

  console.log("✓ JACK library loaded successfully!");

  // Get JACK version
  const version = jack.symbols.jack_get_version_string();
  console.log(`✓ JACK version: ${version}`);

  console.log("\n✅ Bun FFI can interface with JACK!");
  console.log("\nNext: Test if JSCallback works for audio callback");

} catch (err) {
  console.error("✗ Failed to load JACK:", err.message);
  process.exit(1);
}
