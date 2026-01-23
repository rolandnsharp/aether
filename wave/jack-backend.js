// JACK Audio Backend for Wave via Bun FFI
// Provides real-time audio output through JACK/PipeWire

import { dlopen, FFIType, ptr, JSCallback, CString } from "bun:ffi";

// Load JACK library via PipeWire (not standalone JACK server)
// This routes audio through PipeWire instead of taking over the audio device
const PIPEWIRE_JACK_LIB = "/usr/lib/x86_64-linux-gnu/pipewire-0.3/jack/libjack.so.0";
const jack = dlopen(PIPEWIRE_JACK_LIB, {
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
  jack_get_ports: {
    args: [FFIType.ptr, FFIType.cstring, FFIType.cstring, FFIType.i64],
    returns: FFIType.ptr,
  },
  jack_connect: {
    args: [FFIType.ptr, FFIType.cstring, FFIType.cstring],
    returns: FFIType.i32,
  },
  jack_port_name: {
    args: [FFIType.ptr],
    returns: FFIType.cstring,
  },
  jack_free: {
    args: [FFIType.ptr],
    returns: FFIType.void,
  },
});

/**
 * Create a JACK audio client for real-time audio output
 *
 * @param {string} clientName - Name of the JACK client
 * @param {Function} audioCallback - Called for each audio buffer: (bufferL, bufferR, nframes) => void
 * @returns {Object} Client with start() and close() methods
 */
export function createJackClient(clientName, audioCallback) {
  // Open JACK client
  const statusPtr = new Uint32Array(1);
  const client = jack.symbols.jack_client_open(
    ptr(Buffer.from(`${clientName}\0`)),
    0, // JackNullOption
    ptr(statusPtr.buffer)
  );

  if (!client || client === 0n) {
    throw new Error("Failed to open JACK client");
  }

  // Get sample rate
  const sampleRate = jack.symbols.jack_get_sample_rate(client);

  // Register stereo output ports
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

  if (!portL || !portR) {
    jack.symbols.jack_client_close(client);
    throw new Error("Failed to register JACK ports");
  }

  // Create process callback
  const processCallback = new JSCallback(
    (nframes, arg) => {
      // Get audio buffers from JACK
      const bufferL = new Float32Array(
        ptr(jack.symbols.jack_port_get_buffer(portL, nframes)),
        nframes
      );
      const bufferR = new Float32Array(
        ptr(jack.symbols.jack_port_get_buffer(portR, nframes)),
        nframes
      );

      // Call user's audio generation function
      try {
        audioCallback(bufferL, bufferR, nframes);
      } catch (err) {
        console.error("Error in audio callback:", err);
        // Fill with silence on error
        bufferL.fill(0);
        bufferR.fill(0);
      }

      return 0; // Success
    },
    {
      args: [FFIType.i32, FFIType.ptr],
      returns: FFIType.i32,
      threadsafe: true, // Critical for real-time audio!
    }
  );

  // Set process callback
  const ret = jack.symbols.jack_set_process_callback(
    client,
    processCallback.ptr,
    null
  );

  if (ret !== 0) {
    jack.symbols.jack_client_close(client);
    throw new Error("Failed to set JACK process callback");
  }

  // Return client API
  return {
    sampleRate,

    /**
     * Activate the JACK client and start audio processing
     * Auto-connects to system playback ports
     */
    start() {
      const activateRet = jack.symbols.jack_activate(client);
      if (activateRet !== 0) {
        throw new Error("Failed to activate JACK client");
      }

      // Auto-connect to system playback ports
      // Try common PipeWire/JACK playback port patterns
      const playbackPatterns = [
        ["Built-in Audio Analog Stereo:playback_FL", "Built-in Audio Analog Stereo:playback_FR"],
        ["system:playback_1", "system:playback_2"],
        ["alsa_output.pci-0000_00_1f.3.analog-stereo:playback_FL", "alsa_output.pci-0000_00_1f.3.analog-stereo:playback_FR"]
      ];

      for (const [leftDest, rightDest] of playbackPatterns) {
        const leftRet = jack.symbols.jack_connect(
          client,
          ptr(Buffer.from(`${clientName}:output_L\0`)),
          ptr(Buffer.from(`${leftDest}\0`))
        );

        if (leftRet === 0) {
          // Left connected successfully, try right
          jack.symbols.jack_connect(
            client,
            ptr(Buffer.from(`${clientName}:output_R\0`)),
            ptr(Buffer.from(`${rightDest}\0`))
          );
          break; // Stop trying other patterns
        }
      }
    },

    /**
     * Close the JACK client and clean up resources
     */
    close() {
      jack.symbols.jack_client_close(client);
    },
  };
}
