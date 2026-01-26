// client/worklet.js

// genish.js and wave-dsp.js are bundled before this code
// They provide genish and helper functions globally

// Define wave() function in worklet scope for signal.js to use
let waveRegistry = new Map();
const wave = (label, graphFn) => {
  waveRegistry.set(label, graphFn);
};
// Make wave() available globally for eval'd code
globalThis.wave = wave;

class GenishProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    try {
      this.port.postMessage({ type: 'info', message: 'GenishProcessor constructor called' });

      const genish = globalThis.genish;
      this.port.postMessage({ type: 'info', message: `genish type: ${typeof genish}` });

      if (!genish) {
        this.port.postMessage({ type: 'error', message: 'genish is not available in worklet!' });
      } else {
        this.port.postMessage({ type: 'info', message: `genish loaded, has cycle: ${typeof genish.cycle}, has gen: ${typeof genish.gen}` });
      }

      this.port.onmessage = this.handleMessage.bind(this);
      this.registry = new Map();
      this.t = 0;
      this.sampleRate = 44100;
      this.logProcessOnce = true;

      this.port.postMessage({ type: 'info', message: 'Constructor completed successfully' });
    } catch (e) {
      this.port.postMessage({ type: 'error', message: `Constructor error: ${e.toString()}` });
    }
  }

  handleMessage(event) {
    const { type, code, sampleRate } = event.data;

    if (type === 'init') {
      this.sampleRate = sampleRate;
      this.port.postMessage({ type: 'info', message: `Sample rate set to ${sampleRate}` });
      return;
    }

    if (type === 'eval') {
      // Evaluate signal.js code in worklet context
      try {
        waveRegistry.clear();
        this.registry.clear(); // Clear the audio registry to remove old sounds
        const genish = globalThis.genish;

        if (!genish) {
          throw new Error('genish not available');
        }

        this.port.postMessage({ type: 'info', message: 'Evaluating signal.js...' });

        // Eval the code - wave() calls will populate waveRegistry
        eval(code);

        this.port.postMessage({ type: 'info', message: `Found ${waveRegistry.size} wave definitions` });

        // Now compile all the waves
        for (const [label, graphFn] of waveRegistry.entries()) {
          this.compileWave(label, graphFn);
        }

        this.port.postMessage({ type: 'info', message: `Compiled ${waveRegistry.size} waves successfully` });
      } catch (e) {
        this.port.postMessage({ type: 'error', message: `Error evaluating signal.js: ${e.message}` });
        console.error('[GenishProcessor] Eval error:', e);
      }
      return;
    }
  }

  compileWave(label, graphFn) {
    try {
      const genish = globalThis.genish;
      if (!genish || !genish.gen || !genish.gen.createCallback) {
        throw new Error('genish.gen.createCallback not available');
      }

      // Create time accumulator
      const t = genish.accum(1 / this.sampleRate);

      // Call the user's function with t to build the genish graph
      const genishGraph = graphFn(t);

      this.port.postMessage({ type: 'info', message: `Graph created for '${label}', name: ${genishGraph?.name}` });

      // Compile the genish graph into an optimized callback
      const compiledCallback = genish.gen.createCallback(genishGraph, genish.gen.memory);

      // Create context object for calling the callback
      const context = { memory: genish.gen.memory.heap };

      const current = this.registry.get(label);
      const updateType = current ? 'update' : 'add';

      if (current && updateType === 'update') {
        // Crossfade
        this.registry.set(label, {
          graph: compiledCallback,
          context: context,
          oldGraph: current.graph,
          oldContext: current.context,
          fade: 0.0,
          fadeDuration: 0.05 * this.sampleRate
        });
      } else {
        this.registry.set(label, { graph: compiledCallback, context: context, oldGraph: null, fade: 1.0 });
      }

      this.port.postMessage({ type: 'info', message: `Successfully compiled signal '${label}'` });
    } catch (e) {
      this.port.postMessage({ type: 'error', message: `Error compiling '${label}': ${e.message}` });
      console.error('[GenishProcessor] Compilation error:', e);
    }
  }

  process(inputs, outputs, parameters) {
    if (this.logProcessOnce) {
      this.port.postMessage({ type: 'info', message: `process() called, registry size: ${this.registry.size}` });
      this.logProcessOnce = false;
    }

    const output = outputs[0];
    const channel = output[0];

    for (let i = 0; i < channel.length; i++) {
      let sample = 0;
      this.t += 1 / this.sampleRate;

      for (const [label, synth] of this.registry.entries()) {
        try {
          let currentSample = 0;

          // Call the compiled genish callback with the correct context
          currentSample += synth.graph.call(synth.context);

          // Handle crossfade if an old graph exists
          if (synth.oldGraph) {
            const oldSample = synth.oldGraph.call(synth.oldContext);
            const fadeValue = synth.fade / synth.fadeDuration;

            currentSample = (currentSample * fadeValue) + (oldSample * (1 - fadeValue));

            synth.fade++;
            if (synth.fade >= synth.fadeDuration) {
              synth.oldGraph = null;
              synth.oldContext = null;
            }
          }

          sample += currentSample;
        } catch (e) {
          this.port.postMessage({ type: 'error', message: `Runtime error in '${label}': ${e.toString()}` });
          // Remove the faulty synth to prevent further errors
          this.registry.delete(label);
        }
      }

      // Basic hard clip to prevent speaker damage
      channel[i] = Math.max(-1, Math.min(1, sample));
    }

    return true;
  }
}

registerProcessor('genish-processor', GenishProcessor);
