// client/engine.js

(async () => {
  try {
    if (!window.AudioContext) {
      console.error("AudioContext not supported");
      return;
    }

    const audioContext = new AudioContext({ latencyHint: 'interactive', sampleRate: 44100 });
    console.log(`[Engine] AudioContext created in state: ${audioContext.state}`);
    
    // Forcefully try to resume the context, as autoplay policies can be unreliable.
    await audioContext.resume();

    console.log('[Engine] Attempting to load AudioWorklet module...');
    try {
      await audioContext.audioWorklet.addModule('/client/worklet-bundled.js');
      console.log('[Engine] AudioWorklet module loaded successfully.');
    } catch (error) {
      console.error('[Engine] Failed to load AudioWorklet module:', error);
      return; // Stop further execution if worklet fails to load
    }
    const genishNode = new AudioWorkletNode(audioContext, 'genish-processor');
    genishNode.connect(audioContext.destination);

    // Send sample rate to the worklet
    genishNode.port.postMessage({
        type: 'init',
        sampleRate: audioContext.sampleRate
    });

    // Listen for messages from the worklet
    genishNode.port.onmessage = (event) => {
      if (event.data.type === 'error') {
        console.error('[Engine] Worklet error:', event.data.message);
      } else if (event.data.type === 'info') {
        console.log('[Engine] Worklet info:', event.data.message);
      }
    };


    const registry = new Map();

    // The main API function exposed to the user
    window.wave = (label, graphOrFn) => {
      if (typeof label !== 'string') {
        console.error('Usage: wave("label", "genish_expression" or () => "genish_expression")');
        return;
      }

      let graphString;

      // If it's a function, call it to get the genish expression string
      if (typeof graphOrFn === 'function') {
        try {
          graphString = graphOrFn();
          if (typeof graphString !== 'string') {
            console.error(`[Engine] Function must return a string, got ${typeof graphString}`);
            return;
          }
        } catch (e) {
          console.error(`[Engine] Error evaluating graph function for '${label}':`, e);
          return;
        }
      } else if (typeof graphOrFn === 'string') {
        graphString = graphOrFn;
      } else {
        console.error('Invalid graph type - must be string or function returning string');
        return;
      }

      // Check if the graph is new or an update
      const type = registry.has(label) ? 'update' : 'add';
      registry.set(label, graphString);

      genishNode.port.postMessage({
        type: type,
        label: label,
        graph: graphString
      });
      console.log(`[Engine] ${type === 'add' ? 'Added' : 'Updated'} signal: '${label}'`);
    };

    // WebSocket connection to the host
    const socket = new WebSocket('ws://localhost:8080/ws');

    // Consolidate all 'open' event logic into a single addEventListener
    socket.addEventListener('open', async () => { // Make this async because audioContext.resume() returns a Promise
      console.log('[Engine] WebSocket connection established.');
      console.log(`[Engine] AudioContext state on open: ${audioContext.state}`);
      
      // Resume AudioContext after user interaction (or autoplay policy)
      // It should already be running due to the initial await audioContext.resume()
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        console.log(`[Engine] AudioContext resumed from suspended state to: ${audioContext.state}`);
      }
      
      // Signal to the host that the engine is fully ready to receive code
      socket.send(JSON.stringify({type: 'ready'}));
      console.log('[Engine] Sent ready signal to host.');
    }, { once: true });

    socket.onmessage = (event) => {
      console.log(`[Engine] AudioContext state on message: ${audioContext.state}`);

      try {
        const message = JSON.parse(event.data);

        if (message.type === 'eval') {
          console.log('[Engine] Forwarding signal.js to worklet for evaluation');
          // Forward the code to the worklet for evaluation
          genishNode.port.postMessage({
            type: 'eval',
            code: message.code
          });
        }
      } catch (e) {
        console.error('[Engine] Error handling message:', e);
      }
    };

    socket.onerror = (error) => {
      console.error('[Engine] WebSocket Error:', error);
    };

    socket.onclose = () => {
      console.log('[Engine] WebSocket connection closed.');
    };

    // Hijack console.log to send messages back to the host
    const originalLog = console.log;
    const originalError = console.error;
    console.log = (...args) => {
        originalLog.apply(console, args);
        socket.send(JSON.stringify({type: 'log', data: args}));
    };
    console.error = (...args) => {
        originalError.apply(console, args);
        socket.send(JSON.stringify({type: 'error', data: args}));
    };
  } catch (e) {
    console.error('[Engine] A fatal error occurred during initialization:', e);
  }
})();
