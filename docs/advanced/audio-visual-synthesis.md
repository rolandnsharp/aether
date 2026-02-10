# Audio-Visual Synthesis: Oscilloscope and Beyond

> *"Sound is frozen time, vision is frozen space. Synthesis unifies them."*

## Introduction

Our multi-paradigm synthesis engine is fundamentally about **generating values over time**. An oscilloscope visualization applies this same power to the visual domain: `f(t) -> visual_value`.

The key insight: **audio synthesis and visual synthesis are the same problem**.

---

## Basic Oscilloscope Architecture

### Conceptual Model

```
Audio Synthesis          Visualization
─────────────────        ─────────────
f(t) -> samples    →     samples -> pixels
```

### Three Rendering Approaches

1. **Direct Sampling**: Call `f(t)` at visual refresh rate (60fps)
2. **Audio Buffer Visualization**: Read from audio output buffer
3. **Parallel Synthesis**: Generate separate visual-rate signal

---

## Approach 1: Direct Sampling (Clean but Limited)

### Basic Waveform Display

```javascript
// Canvas setup
const canvas = document.getElementById('oscilloscope');
const ctx = canvas.getContext('2d');
const width = canvas.width;
const height = canvas.height;

// Import synthesis function
import { Kanon } from './src/arche/kanon/index.js';

// Get the registered signal
const signal = Kanon.get('my-sound');

// Render loop (60fps)
let t = 0;
const dt = 1/60;  // Visual refresh rate

function render() {
  ctx.clearRect(0, 0, width, height);
  ctx.beginPath();
  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 2;

  // Sample the waveform at visual rate
  const samplesPerFrame = width;
  const timeWindow = 0.05;  // 50ms window
  const sampleDt = timeWindow / samplesPerFrame;

  for (let i = 0; i < samplesPerFrame; i++) {
    const sampleTime = t + i * sampleDt;
    const amplitude = signal(sampleTime);

    // Map amplitude [-1, 1] to screen space [0, height]
    const x = (i / samplesPerFrame) * width;
    const y = height/2 - (amplitude * height * 0.4);

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.stroke();

  t += dt;
  requestAnimationFrame(render);
}

render();
```

**Pros**: Simple, direct visualization of f(t)
**Cons**: May miss high-frequency detail (audio at 48kHz, visual at 60Hz)

---

## Approach 2: Audio Buffer Visualization (Production)

### Reading from Audio Output

```javascript
import { Aether } from './src/arche/aether/index.js';

// Create ring buffer for audio samples
const bufferSize = 4096;
const ringBuffer = new Float32Array(bufferSize);
let writeIndex = 0;

// Hook into audio generation (in your audio callback)
Aether.onSample((sample) => {
  ringBuffer[writeIndex] = sample;
  writeIndex = (writeIndex + 1) % bufferSize;
});

// Visual render loop
function renderAudioBuffer() {
  ctx.clearRect(0, 0, width, height);
  ctx.beginPath();
  ctx.strokeStyle = '#00ff00';

  const samplesPerPixel = bufferSize / width;

  for (let x = 0; x < width; x++) {
    // Average samples per pixel for anti-aliasing
    let sum = 0;
    let count = 0;

    for (let s = 0; s < samplesPerPixel; s++) {
      const idx = Math.floor((writeIndex + x * samplesPerPixel + s) % bufferSize);
      sum += ringBuffer[idx];
      count++;
    }

    const amplitude = sum / count;
    const y = height/2 - (amplitude * height * 0.4);

    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.stroke();
  requestAnimationFrame(renderAudioBuffer);
}
```

**Pros**: Shows actual audio output, no aliasing
**Cons**: More complex, requires audio engine integration

---

## Approach 3: Dual-Rate Synthesis (Most Powerful)

### Generate Both Audio and Visual Signals

```javascript
// Define synthesis at both rates
const audioSynthesis = Kanon.register('audio', t => {
  return Math.sin(2 * Math.PI * 440 * t);
});

const visualSynthesis = Kanon.register('visual', t => {
  // Same function, but called at visual rate
  // Can add extra detail, envelope display, etc.
  const audio = Math.sin(2 * Math.PI * 440 * t);

  // Add slow envelope for visualization
  const envelope = Math.exp(-t * 0.5);

  return audio * envelope;
});

// Audio thread: 48kHz
audioEngine.process((t) => audioSynthesis(t));

// Visual thread: 60fps
function renderDualRate() {
  // Visualize over time window
  const window = 0.05;  // 50ms

  for (let i = 0; i < width; i++) {
    const sampleT = t + (i / width) * window;
    const value = visualSynthesis(sampleT);
    // ... render
  }

  t += 1/60;
  requestAnimationFrame(renderDualRate);
}
```

**Pros**: Maximum flexibility, can show different aspects
**Cons**: More CPU usage

---

## Advanced Oscilloscope Modes

### 1. Triggered Oscilloscope (Stable Waveform)

```javascript
// Find zero-crossing for stable display
function findTrigger(signal, t, window = 0.1) {
  const dt = 1/48000;

  for (let i = 0; i < window * 48000; i++) {
    const t1 = t + i * dt;
    const t2 = t + (i + 1) * dt;

    const v1 = signal(t1);
    const v2 = signal(t2);

    // Rising edge zero crossing
    if (v1 < 0 && v2 >= 0) {
      return t1;
    }
  }

  return t;  // No trigger found
}

function renderTriggered() {
  const triggerTime = findTrigger(signal, t);

  // Render from trigger point
  for (let i = 0; i < width; i++) {
    const sampleTime = triggerTime + (i / width) * timeWindow;
    const amplitude = signal(sampleTime);
    // ... render
  }

  t += 1/60;
  requestAnimationFrame(renderTriggered);
}
```

### 2. XY Mode (Lissajous Figures)

```javascript
// Two signals as X and Y coordinates
const signalX = Kanon.get('channel-left');
const signalY = Kanon.get('channel-right');

function renderLissajous() {
  ctx.clearRect(0, 0, width, height);
  ctx.beginPath();
  ctx.strokeStyle = '#00ff00';

  const samples = 1000;
  const window = 0.05;

  for (let i = 0; i < samples; i++) {
    const sampleTime = t + (i / samples) * window;

    const x = signalX(sampleTime);
    const y = signalY(sampleTime);

    // Map to screen space
    const screenX = width/2 + x * width * 0.4;
    const screenY = height/2 - y * height * 0.4;

    if (i === 0) ctx.moveTo(screenX, screenY);
    else ctx.lineTo(screenX, screenY);
  }

  ctx.stroke();
  t += 1/60;
  requestAnimationFrame(renderLissajous);
}
```

### 3. Spectral Display (FFT)

```javascript
// Real-time spectrum analyzer
function renderSpectrum() {
  // Get audio samples
  const samples = new Float32Array(2048);
  for (let i = 0; i < samples.length; i++) {
    samples[i] = signal(t + i / 48000);
  }

  // Compute FFT (use FFT library)
  const spectrum = FFT(samples);

  // Render bars
  ctx.clearRect(0, 0, width, height);
  const barWidth = width / spectrum.length;

  for (let i = 0; i < spectrum.length; i++) {
    const magnitude = Math.abs(spectrum[i]);
    const barHeight = magnitude * height;

    ctx.fillStyle = `hsl(${i / spectrum.length * 360}, 100%, 50%)`;
    ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
  }

  t += 1/60;
  requestAnimationFrame(renderSpectrum);
}
```

### 4. Phase Scope (Stereo Field)

```javascript
function renderPhaseScope() {
  ctx.clearRect(0, 0, width, height);

  // Draw guides
  ctx.strokeStyle = '#333';
  ctx.beginPath();
  ctx.moveTo(0, height/2);
  ctx.lineTo(width, height/2);
  ctx.moveTo(width/2, 0);
  ctx.lineTo(width/2, height);
  ctx.stroke();

  // Render stereo correlation
  ctx.strokeStyle = '#00ff00';
  ctx.beginPath();

  const samples = 500;
  for (let i = 0; i < samples; i++) {
    const sampleTime = t + (i / samples) * 0.05;

    const mid = (signalX(sampleTime) + signalY(sampleTime)) / 2;
    const side = (signalX(sampleTime) - signalY(sampleTime)) / 2;

    const x = width/2 + mid * width * 0.4;
    const y = height/2 - side * height * 0.4;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.stroke();
  t += 1/60;
  requestAnimationFrame(renderPhaseScope);
}
```

---

## Paradigm-Specific Visualizations

### Kanon (Fire 🔥): Pure Functions as Pure Shapes

```javascript
// Visualize the function itself, not just samples
function renderKanonFunction() {
  const func = Kanon.get('my-sound');

  // Analytical visualization
  ctx.clearRect(0, 0, width, height);

  // Plot multiple time windows simultaneously
  const windows = 5;
  for (let w = 0; w < windows; w++) {
    ctx.globalAlpha = 1.0 - (w / windows) * 0.8;
    ctx.strokeStyle = '#ff4400';
    ctx.beginPath();

    const windowStart = t + w * 0.1;

    for (let x = 0; x < width; x++) {
      const sampleTime = windowStart + (x / width) * 0.05;
      const value = func(sampleTime);
      const y = (height / (windows + 1)) * (w + 1) - value * 50;

      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  ctx.globalAlpha = 1.0;
  t += 1/60;
  requestAnimationFrame(renderKanonFunction);
}
```

### Rhythmos (Earth 🌍): State Evolution

```javascript
// Visualize state transitions over time
function renderRhythmosState() {
  // Capture state at each sample
  const stateHistory = [];

  Rhythmos.onStateChange((state, idx) => {
    stateHistory.push({
      time: state.t,
      phase: state[idx],
      value: state.output
    });
  });

  // Render state space
  ctx.clearRect(0, 0, width, height);

  for (let i = 0; i < stateHistory.length; i++) {
    const state = stateHistory[i];

    // X = time, Y = phase, color = amplitude
    const x = (state.time / maxTime) * width;
    const y = state.phase * height;
    const brightness = (state.value + 1) / 2;  // Map [-1,1] to [0,1]

    ctx.fillStyle = `rgba(0, ${brightness * 255}, 0, 0.8)`;
    ctx.fillRect(x, y, 2, 2);
  }

  requestAnimationFrame(renderRhythmosState);
}
```

### Chora (Aether ✨): Spatial Field Visualization

```javascript
// When Chora is implemented: visualize the spatial field
function renderChoraField() {
  const fieldFunc = Chora.get('spatial-resonance');

  ctx.clearRect(0, 0, width, height);

  // Render 2D slice of 3D field
  const resolution = 100;

  for (let x = 0; x < resolution; x++) {
    for (let y = 0; y < resolution; y++) {
      // Map screen space to physical space (meters)
      const posX = (x / resolution) * 10 - 5;  // -5m to +5m
      const posY = (y / resolution) * 10 - 5;
      const posZ = 0;  // 2D slice at z=0

      const position = { x: posX, y: posY, z: posZ };

      // Sample field at this position
      const fieldValue = fieldFunc(t, position);

      // Render as heatmap
      const intensity = (fieldValue + 1) / 2;  // [-1,1] -> [0,1]
      ctx.fillStyle = `hsl(${intensity * 240}, 100%, 50%)`;
      ctx.fillRect(
        (x / resolution) * width,
        (y / resolution) * height,
        width / resolution,
        height / resolution
      );
    }
  }

  t += 1/60;
  requestAnimationFrame(renderChoraField);
}
```

---

## WebGL Acceleration (High Performance)

### GPU-Accelerated Waveform

```glsl
// Vertex Shader
attribute float aTime;
attribute float aAmplitude;

void main() {
  gl_Position = vec4(
    aTime * 2.0 - 1.0,  // Map [0,1] to [-1,1]
    aAmplitude,
    0.0,
    1.0
  );
}

// Fragment Shader
void main() {
  gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);  // Green
}
```

```javascript
// JavaScript setup
const vertices = new Float32Array(width * 2);

function renderWebGL() {
  // Fill vertex buffer with samples
  for (let i = 0; i < width; i++) {
    const sampleTime = t + (i / width) * 0.05;
    const amplitude = signal(sampleTime);

    vertices[i * 2] = i / width;      // Time (0-1)
    vertices[i * 2 + 1] = amplitude;  // Amplitude (-1 to 1)
  }

  // Upload to GPU
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

  // Draw
  gl.drawArrays(gl.LINE_STRIP, 0, width);

  t += 1/60;
  requestAnimationFrame(renderWebGL);
}
```

---

## Creative Visualizations

### 1. Harmonic Spiral

```javascript
// Visualize additive synthesis as spiral
function renderHarmonicSpiral() {
  ctx.clearRect(0, 0, width, height);
  ctx.translate(width/2, height/2);

  const partials = 16;

  for (let n = 1; n <= partials; n++) {
    const freq = 110 * n;
    const amplitude = signal(t) / n;

    // Spiral coordinates
    const angle = (t * freq) % (2 * Math.PI);
    const radius = n * 20;

    const x = Math.cos(angle) * radius * amplitude;
    const y = Math.sin(angle) * radius * amplitude;

    ctx.fillStyle = `hsl(${n * 20}, 100%, 50%)`;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fill();
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);  // Reset transform
  t += 1/60;
  requestAnimationFrame(renderHarmonicSpiral);
}
```

### 2. Cymatics (Standing Wave Patterns)

```javascript
// Simulate Chladni plate patterns
function renderCymatics() {
  const imageData = ctx.createImageData(width, height);

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      // Normalize coordinates to [-1, 1]
      const nx = (x / width) * 2 - 1;
      const ny = (y / height) * 2 - 1;

      // Calculate standing wave at this position
      const freq = 440;
      const wavelength = 340 / freq;  // Speed of sound / frequency

      const distance = Math.sqrt(nx * nx + ny * ny);
      const wave = Math.sin(2 * Math.PI * distance / wavelength + t * freq);

      // Nodal lines (where amplitude is zero) appear as bright regions
      const intensity = Math.abs(wave) < 0.1 ? 255 : 0;

      const idx = (y * width + x) * 4;
      imageData.data[idx] = intensity;
      imageData.data[idx + 1] = intensity;
      imageData.data[idx + 2] = intensity;
      imageData.data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  t += 1/60;
  requestAnimationFrame(renderCymatics);
}
```

### 3. Attractor Visualization (Chaos)

```javascript
// Visualize Lorenz attractor driven by audio
function renderAttractor() {
  // Use audio to perturb attractor parameters
  const audioSample = signal(t);
  const sigma = 10 + audioSample * 2;
  const rho = 28 + audioSample * 5;
  const beta = 8/3;

  // Integrate Lorenz equations
  const dt = 0.01;
  x += sigma * (y - x) * dt;
  y += (x * (rho - z) - y) * dt;
  z += (x * y - beta * z) * dt;

  // Project 3D to 2D
  const screenX = width/2 + x * 10;
  const screenY = height/2 + y * 10;

  // Trail effect
  ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
  ctx.fillRect(0, 0, width, height);

  // Draw point
  const hue = (z / 50) * 360;
  ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
  ctx.beginPath();
  ctx.arc(screenX, screenY, 2, 0, 2 * Math.PI);
  ctx.fill();

  t += 1/60;
  requestAnimationFrame(renderAttractor);
}
```

---

## Integration with Aether

### Complete Example: Multi-View Oscilloscope

```javascript
import { Aether } from './src/arche/aether/index.js';

class MultiViewScope {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    this.ringBuffer = new Float32Array(8192);
    this.writeIndex = 0;

    this.mode = 'waveform';  // waveform, spectrum, lissajous, phase
    this.t = 0;
  }

  // Called by audio engine
  pushSamples(leftChannel, rightChannel, count) {
    for (let i = 0; i < count; i++) {
      this.ringBuffer[this.writeIndex] = leftChannel[i];
      this.writeIndex = (this.writeIndex + 1) % this.ringBuffer.length;
    }
  }

  render() {
    switch(this.mode) {
      case 'waveform':
        this.renderWaveform();
        break;
      case 'spectrum':
        this.renderSpectrum();
        break;
      case 'lissajous':
        this.renderLissajous();
        break;
      case 'phase':
        this.renderPhase();
        break;
    }

    requestAnimationFrame(() => this.render());
  }

  renderWaveform() {
    // ... implementation from above
  }

  // ... other render methods
}

// Initialize
const scope = new MultiViewScope('oscilloscope');

// Connect to Aether audio engine
Aether.onAudioFrame((left, right, count) => {
  scope.pushSamples(left, right, count);
});

// Start rendering
scope.render();
```

---

## Performance Optimization

### 1. Downsampling for High-Frequency Signals

```javascript
// Average samples to prevent aliasing
function downsample(signal, t, window, targetSamples, audioRate = 48000) {
  const samples = [];
  const samplesPerPixel = Math.floor((window * audioRate) / targetSamples);

  for (let i = 0; i < targetSamples; i++) {
    let sum = 0;
    for (let s = 0; s < samplesPerPixel; s++) {
      const sampleTime = t + ((i * samplesPerPixel + s) / audioRate);
      sum += signal(sampleTime);
    }
    samples.push(sum / samplesPerPixel);
  }

  return samples;
}
```

### 2. Offscreen Canvas (Web Workers)

```javascript
// worker.js
self.onmessage = (e) => {
  const { signal, t, width, height } = e.data;

  const offscreen = new OffscreenCanvas(width, height);
  const ctx = offscreen.getContext('2d');

  // Render waveform
  // ... rendering code

  const bitmap = offscreen.transferToImageBitmap();
  self.postMessage({ bitmap }, [bitmap]);
};

// main.js
const worker = new Worker('worker.js');
worker.onmessage = (e) => {
  ctx.drawImage(e.data.bitmap, 0, 0);
};
```

---

## Further Reading

- [Metaprogramming Audio Synthesis](metaprogramming-audio-synthesis.md) - Generate visual code dynamically
- [Chora Spatial Audio](../paradigms/chora/overview.md) - Visualizing spatial fields (when implemented)
- [FFT and Spectral Processing](../synthesis-techniques/spectral-processing.md) - Frequency domain visualization
- [WebGL Shader Audio](https://www.shadertoy.com/) - GPU-based audio visualization

---

**Next**: Build it! Create mind-blowing visualizations that match the power of your synthesis engine. 🔥🎨
