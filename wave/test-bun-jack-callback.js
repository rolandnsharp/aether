// Test Bun FFI JSCallback with JACK audio
import { dlopen, FFIType, ptr, JSCallback, CString } from "bun:ffi";

console.log("Testing Bun JSCallback with JACK real-time audio...\n");

const jack = dlopen("libjack.so.0", {
  jack_client_open: {
    args: [FFIType.cstring, FFIType.i32, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jack_client_close: {
    args: [FFIType.ptr],
    returns: FFIType.i32,
  },
  jack_set_process_callback: {
    args: [FFIType.ptr, FFIType.function, FFIType.ptr],
    returns: FFIType.i32,
  },
  jack_get_sample_rate: {
    args: [FFIType.ptr],
    returns: FFIType.i32,
  },
  jack_port_register: {
    args: [FFIType.ptr, FFIType.cstring, FFIType.cstring, FFIType.i32, FFIType.i32],
    returns: FFIType.ptr,
  },
  jack_activate: {
    args: [FFIType.ptr],
    returns: FFIType.i32,
  },
  jack_port_get_buffer: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.ptr,
  },
});

// Open JACK client
const statusPtr = new Uint32Array(1);
const client = jack.symbols.jack_client_open(
  ptr(Buffer.from("bun-test\0")),
  0, // JackNullOption
  ptr(statusPtr.buffer)
);

if (!client || client === 0n) {
  console.error("✗ Failed to open JACK client");
  process.exit(1);
}

console.log("✓ JACK client opened");

const sampleRate = jack.symbols.jack_get_sample_rate(client);
console.log(`✓ Sample rate: ${sampleRate} Hz`);

// Register output ports
const portL = jack.symbols.jack_port_register(
  client,
  ptr(Buffer.from("output_L\0")),
  ptr(Buffer.from("32 bit float mono audio\0")),
  2, // JackPortIsOutput
  0
);

const portR = jack.symbols.jack_port_register(
  client,
  ptr(Buffer.from("output_R\0")),
  ptr(Buffer.from("32 bit float mono audio\0")),
  2, // JackPortIsOutput
  0
);

console.log("✓ Ports registered");

// Audio callback
let callbackCount = 0;
let phase = 0;
const freq = 440;
const dt = (2 * Math.PI * freq) / sampleRate;

const processCallback = new JSCallback(
  (nframes, arg) => {
    callbackCount++;

    // Get buffers
    const bufL = new Float32Array(
      ptr(jack.symbols.jack_port_get_buffer(portL, nframes)),
      nframes
    );
    const bufR = new Float32Array(
      ptr(jack.symbols.jack_port_get_buffer(portR, nframes)),
      nframes
    );

    // Generate sine wave
    for (let i = 0; i < nframes; i++) {
      const sample = Math.sin(phase) * 0.3;
      bufL[i] = sample;
      bufR[i] = sample;
      phase += dt;
    }

    if (callbackCount % 100 === 0) {
      console.log(`Callback #${callbackCount}`);
    }

    return 0;
  },
  {
    args: [FFIType.i32, FFIType.ptr],
    returns: FFIType.i32,
    threadsafe: true, // Critical for real-time audio!
  }
);

const ret = jack.symbols.jack_set_process_callback(
  client,
  processCallback.ptr,
  null
);

if (ret !== 0) {
  console.error("✗ Failed to set process callback");
  jack.symbols.jack_client_close(client);
  process.exit(1);
}

console.log("✓ Process callback set");

// Activate client
const activateRet = jack.symbols.jack_activate(client);
if (activateRet !== 0) {
  console.error("✗ Failed to activate client");
  jack.symbols.jack_client_close(client);
  process.exit(1);
}

console.log("✓ JACK client activated");
console.log("\n🎵 Playing 440Hz sine wave...");
console.log("(Run 'pw-jack jack_lsp' or check PipeWire to see ports)");
console.log("\nPress Ctrl+C to stop\n");

// Keep running
await new Promise((resolve) => {
  setTimeout(() => {
    console.log(`\n=== Results ===`);
    console.log(`Total callbacks: ${callbackCount}`);
    console.log(`Expected ~${sampleRate / 1024} callbacks/sec`);

    jack.symbols.jack_client_close(client);

    if (callbackCount > 0) {
      console.log("\n✅ BUN FFI + JACK WORKS!");
    } else {
      console.log("\n✗ No callbacks received");
    }
    resolve();
  }, 3000);
});
