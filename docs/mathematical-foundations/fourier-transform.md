[Home](../Home.md) > [Mathematical Foundations](#) > Fourier-Transform

# Fourier Transform & Spectral Processing

## The Most Profound Truth in Audio

**Jean-Baptiste Fourier (1822)** proved something revolutionary that vindicated Pythagoras 2,300 years later:

> **ANY periodic waveform can be perfectly reconstructed as a sum of sine waves.**

This means:
- Every sound you've ever heard is secretly just harmonics
- Pythagoras was right: it's ALL about sine wave ratios
- The sine wave is the "atom" of sound

## From Pythagoras to Fourier

### Pythagoras (~500 BC)

Discovered that musical intervals correspond to simple ratios:
- Octave: 2:1 (string half the length)
- Perfect fifth: 3:2
- Perfect fourth: 4:3

These ratios define **harmonics** - frequencies that are integer multiples of a fundamental.

### Fourier (1822)

Proved mathematically that ANY periodic function f(t) can be written as:

```
f(t) = a₀ + Σ[aₙcos(nωt) + bₙsin(nωt)]
       n=1 to ∞

where:
  a₀ = DC offset (average value)
  aₙ, bₙ = amplitudes of each harmonic
  n = harmonic number (1, 2, 3, ...)
  ω = fundamental frequency (2πf)
```

This is the **Fourier Series** - every periodic waveform is a sum of harmonics!

### The Connection

**Pythagoras**: "String ratios create musical intervals"
**Fourier**: "All sounds ARE those ratios combined"

Pythagoras discovered the ingredients. Fourier proved those ingredients make up EVERYTHING.

---

## Two Domains, One Truth

Sound exists in two representations:

### Time Domain
What you measure with a microphone: amplitude vs. time
```
       Amplitude
         ↑
    1.0  |  ╱╲    ╱╲
         | ╱  ╲  ╱  ╲
    0.0  |╱────╲╱────╲─→ Time
         |      ╲    ╱
   -1.0  |       ╲  ╱
         |        ╲╱
```

### Frequency Domain
What it's MADE OF: amplitude vs. frequency
```
       Amplitude
         ↑
    1.0  | █
         | █
    0.5  | █  ▓     ▒
         | █  ▓     ▒
    0.0  |─█──▓─────▒─────→ Frequency
         0 440 880  1320 Hz
           f₁ f₂    f₃
```

Same signal, two views. Fourier Transform is the bridge between them.

---

## The Fourier Transform

### Forward Transform: Time → Frequency

Given a signal in time domain `x(t)`, compute its frequency spectrum `X(f)`:

```
X(f) = ∫ x(t) · e^(-i2πft) dt
       -∞ to ∞
```

This integral measures "how much" of each frequency `f` is present in `x(t)`.

In discrete form (for digital audio):

```
X[k] = Σ x[n] · e^(-i2πkn/N)
       n=0 to N-1

where:
  x[n] = input samples (time domain)
  X[k] = output spectrum (frequency domain)
  N = number of samples
  k = frequency bin index
```

### Inverse Transform: Frequency → Time

Given a spectrum `X(f)`, reconstruct the time signal `x(t)`:

```
x(t) = ∫ X(f) · e^(i2πft) df
       -∞ to ∞
```

In discrete form:

```
x[n] = (1/N) Σ X[k] · e^(i2πkn/N)
             k=0 to N-1
```

### The Profound Symmetry

```
Time Domain     →  [FFT]  →  Frequency Domain
                ←  [IFFT] ←
```

The information is IDENTICAL in both representations. It's the same signal, just viewed differently.

---

## Understanding the FFT Output

When you run FFT on a signal, you get a **spectrum** - an array of complex numbers:

```javascript
// Input: 1024 samples of audio
const timeSignal = [0.5, 0.3, -0.2, ...]; // 1024 samples

// Output: 513 frequency bins (N/2 + 1 for real signals)
const spectrum = fft(timeSignal);
// spectrum = [
//   { real: 0.1, imag: 0.0 },     // DC (0 Hz)
//   { real: 0.5, imag: 0.3 },     // Bin 1
//   { real: 0.2, imag: -0.4 },    // Bin 2
//   ...
// ]
```

### Each Bin Represents:

1. **Frequency**: `f = (k × sampleRate) / N`
   - Bin 0: DC (0 Hz)
   - Bin 1: sampleRate / N Hz
   - Bin k: k × (sampleRate / N) Hz

2. **Magnitude**: `|X[k]| = √(real² + imag²)`
   - How MUCH of that frequency is present

3. **Phase**: `φ[k] = atan2(imag, real)`
   - WHERE in the cycle that frequency starts

### Example

```javascript
sampleRate = 48000 Hz
N = 1024 samples

Bin 0:  0 Hz        (DC offset)
Bin 1:  46.875 Hz   (48000/1024)
Bin 2:  93.75 Hz
Bin 10: 468.75 Hz   (roughly 440 Hz)
...
Bin 512: 24000 Hz   (Nyquist frequency)
```

---

## The Fast Fourier Transform (FFT)

Naive DFT computation: O(N²) operations
FFT algorithm (Cooley-Tukey): O(N log N) operations

For N=1024:
- DFT: ~1,000,000 operations
- FFT: ~10,000 operations (100× faster!)

### How FFT Works (Conceptually)

Divide and conquer:
1. Split signal into even/odd samples
2. Compute FFT of each half (recursive)
3. Combine results using "twiddle factors"

```
FFT(N) = combine(FFT(N/2), FFT(N/2))
```

Base case: FFT(1) = trivial

This recursive halving is why N must be a power of 2 (1024, 2048, 4096).

---

## Windowing - The Hidden Complexity

### The Problem

FFT assumes the signal is **periodic** - it repeats infinitely. But real audio isn't!

When you grab 1024 samples and run FFT, you're implicitly assuming those samples repeat forever. This creates artificial discontinuities at the edges:

```
Actual signal:     ╱╲╱╲╱╲╱╲
FFT assumption:    ╱╲╱╲|╱╲╱╲|╱╲╱╲
                        ↑    ↑
                   Discontinuity!
```

Discontinuities create **spectral leakage** - false harmonics that aren't really there.

### The Solution: Windowing

Multiply the signal by a **window function** that tapers smoothly to zero at the edges:

```
Original:   [1.0, 1.0, 1.0, 1.0, 1.0]
Window:     [0.0, 0.5, 1.0, 0.5, 0.0]  (Hann window)
Windowed:   [0.0, 0.5, 1.0, 0.5, 0.0]
```

### Common Window Functions

**Rectangular** (no window):
```
w[n] = 1 for all n
```
- Best frequency resolution
- Worst spectral leakage

**Hann** (Hanning):
```
w[n] = 0.5(1 - cos(2πn/N))
```
- Good balance
- Most commonly used

**Hamming**:
```
w[n] = 0.54 - 0.46cos(2πn/N)
```
- Slightly better sidelobe suppression than Hann

**Blackman**:
```
w[n] = 0.42 - 0.5cos(2πn/N) + 0.08cos(4πn/N)
```
- Excellent sidelobe suppression
- Reduced frequency resolution

**Kaiser**:
```
w[n] = I₀(πα√(1-(2n/N-1)²)) / I₀(πα)
```
- Adjustable trade-off (parameter α)
- Most flexible

### Windowing Trade-offs

```
Better frequency resolution  ←→  Better spectral leakage reduction
         ↑                                    ↑
    Rectangular                            Blackman
         ↑                                    ↑
      No taper                           Heavy taper
```

---

## Short-Time Fourier Transform (STFT)

Audio changes over time! We need **time-frequency** representation.

### The Idea

1. Divide audio into short overlapping windows
2. Apply FFT to each window
3. Get spectrum that evolves over time

```
Time domain:
  ────────────────────────────────→
  [Window 1    ]
      [Window 2    ]
          [Window 3    ]
              [Window 4    ]

Frequency domain (spectrogram):
  Freq ↑
       │ ░▒▓█▓▒░
       │ ░▒▓██▓▒░
       │ ░▒▓▓▒░
       └─────────────→ Time
```

### Overlap-Add for Reconstruction

To get back to time domain:
1. Apply IFFT to each spectrum
2. Multiply by window again
3. Add overlapping portions together
4. Normalize by window sum

This preserves the original signal perfectly (with proper overlap).

### Parameters

**Window Size** (N):
- Larger: better frequency resolution, worse time resolution
- Smaller: better time resolution, worse frequency resolution
- Typical: 1024-4096 samples

**Hop Size** (H):
- How many samples to advance between windows
- Typical: N/2 or N/4 (50% or 75% overlap)
- More overlap = smoother processing, more computation

**Frequency Resolution**: `Δf = sampleRate / N`
- N=1024, SR=48000 → Δf = 46.875 Hz
- N=4096, SR=48000 → Δf = 11.72 Hz

**Time Resolution**: `Δt = H / sampleRate`
- H=512, SR=48000 → Δt = 10.67 ms
- H=128, SR=48000 → Δt = 2.67 ms

**Heisenberg Uncertainty**: Cannot have perfect frequency AND time resolution simultaneously!

---

## Spectral Processing Techniques

Once in frequency domain, you can do magical things...

### 1. Spectral Filtering

Remove or boost specific frequencies:

```javascript
// Lowpass filter
spectrum.forEach(bin => {
  if (bin.freq > cutoff) {
    bin.magnitude = 0;  // Remove high frequencies
  }
});

// Bandpass filter
spectrum.forEach(bin => {
  if (bin.freq < lowCutoff || bin.freq > highCutoff) {
    bin.magnitude = 0;
  }
});

// Notch filter (remove specific frequency)
spectrum.forEach(bin => {
  if (Math.abs(bin.freq - notchFreq) < bandwidth) {
    bin.magnitude = 0;
  }
});
```

### 2. Spectral Gate

Remove bins below a threshold (noise reduction):

```javascript
const threshold = 0.01;
spectrum.forEach(bin => {
  if (bin.magnitude < threshold) {
    bin.magnitude = 0;
  }
});
```

### 3. Spectral Freeze

Capture and hold a spectrum indefinitely:

```javascript
let frozenSpectrum = null;

if (freezeTriggered) {
  frozenSpectrum = currentSpectrum.clone();
}

// Keep outputting the frozen spectrum
output = ifft(frozenSpectrum);
```

### 4. Cross-Synthesis

Combine two signals in interesting ways:

**Magnitude from A, Phase from B**:
```javascript
output[k].magnitude = signalA[k].magnitude;
output[k].phase = signalB[k].phase;
```

**Vocoder** (spectral envelope transfer):
```javascript
// Multiply magnitudes, keep carrier phase
output[k].magnitude = carrier[k].magnitude * modulator[k].magnitude;
output[k].phase = carrier[k].phase;
```

### 5. Pitch Shifting

Shift all frequencies up or down:

```javascript
const shiftFactor = 1.5; // Shift up 1.5×

shiftedSpectrum[k] = spectrum[Math.floor(k / shiftFactor)];
// Interpolate for smooth shifting
```

### 6. Time Stretching

Change duration without changing pitch:

```javascript
// Process with different hop sizes for analysis vs synthesis
analysisHop = 512;
synthesisHop = 256; // Half speed = double duration
```

### 7. Harmonic/Percussive Separation

Harmonics: horizontal lines in spectrogram (sustained)
Percussion: vertical lines in spectrogram (transient)

Apply median filtering:
- Horizontal median → extract harmonics
- Vertical median → extract percussion

### 8. Spectral Delay

Delay different frequencies by different amounts:

```javascript
spectrum.forEach((bin, k) => {
  const delay = delayFunction(bin.freq);
  bin.phase += 2 * Math.PI * bin.freq * delay;
});
```

### 9. Spectral Morphing

Interpolate between two spectrums:

```javascript
output[k] = {
  magnitude: lerp(spectrumA[k].mag, spectrumB[k].mag, t),
  phase: lerpAngle(spectrumA[k].phase, spectrumB[k].phase, t)
};
```

---

## Convolution via FFT

Convolution is multiplication in frequency domain!

**Time domain**: `y[n] = x[n] * h[n]` (convolution)
**Frequency domain**: `Y[k] = X[k] × H[k]` (multiplication)

### The Algorithm

```javascript
// Convolve signal with impulse response
function convolve(signal, impulse) {
  // 1. FFT both
  const signalFFT = fft(signal);
  const impulseFFT = fft(impulse);

  // 2. Multiply (complex multiplication)
  const productFFT = signalFFT.map((bin, k) => ({
    real: bin.real * impulseFFT[k].real - bin.imag * impulseFFT[k].imag,
    imag: bin.real * impulseFFT[k].imag + bin.imag * impulseFFT[k].real
  }));

  // 3. IFFT back
  return ifft(productFFT);
}
```

### Why This Is Profound

Reverb, filtering, ANY linear effect - it's all just multiplication in frequency domain!

---

## Phase Vocoder

The ultimate spectral processing tool.

### The Idea

Analyze audio with STFT, process spectrum, resynthesize with overlap-add.

### Phase Coherence

Challenge: Phase must be continuous across windows, or you get artifacts.

**Phase unwrapping**:
```javascript
// Compute phase difference between windows
const phaseDiff = currentPhase[k] - prevPhase[k];

// Expected phase advance for this bin
const expectedDiff = 2 * Math.PI * k * hopSize / fftSize;

// Deviation from expected (frequency offset)
const deviation = phaseDiff - expectedDiff;

// True frequency for this bin
const trueFreq = (k * sampleRate / fftSize) + (deviation * sampleRate / (2 * Math.PI * hopSize));
```

This allows independent time/pitch manipulation.

---

## Implementation in Signal

### Conceptual API

```javascript
// Analysis
const spectrum = signal.fft(timeSignal, {
  fftSize: 2048,
  window: 'hann',
  hopSize: 512
});

// Spectrum manipulation
const processed = spectrum
  .filter(bin => bin.freq > 100)      // High-pass
  .map(bin => ({
    ...bin,
    magnitude: bin.magnitude * 2      // Boost
  }));

// Synthesis
const output = signal.ifft(processed);

// All in one (phase vocoder)
kanon('processed', t => {
  return signal.phaseVocoder(input, {
    pitchShift: 1.5,     // Up a fifth
    timeStretch: 0.75,   // 25% faster
    formantPreserve: true
  }).eval(t);
});
```

### Real-Time Considerations

**Latency**: Minimum = window size
- 2048 samples @ 48kHz = 42.67 ms

**CPU**: O(N log N) per frame
- Manageable with modern CPUs

**Memory**: Need buffers for overlap-add
- Input buffer, output buffer, window buffer

---

## Relationship to Other Concepts

### FFT + Additive Synthesis

Additive synthesis IS inverse FFT!

```javascript
// These are equivalent:
signal.additive([
  { freq: 440, amp: 1.0 },
  { freq: 880, amp: 0.5 },
  { freq: 1320, amp: 0.33 }
]);

// vs.
const spectrum = [
  { freq: 440, magnitude: 1.0, phase: 0 },
  { freq: 880, magnitude: 0.5, phase: 0 },
  { freq: 1320, magnitude: 0.33, phase: 0 }
];
signal.ifft(spectrum);
```

### FFT + Filters

Filter design = shaping frequency response:

```javascript
// Design lowpass filter by specifying magnitude response
const filterSpectrum = bins.map(bin =>
  bin.freq < cutoff ? 1.0 : 0.0
);

// Apply via convolution (FFT multiply)
```

### FFT + Physical Modeling

Modal synthesis uses bank of resonators - each mode is a frequency bin!

```javascript
// Modal resonators = filtered impulse at each frequency
const modes = [
  { freq: 200, decay: 2.0 },
  { freq: 421, decay: 1.5 },
  { freq: 651, decay: 1.0 }
];

// This is spectral processing!
```

---

## The Philosophical Beauty

### Why FFT Is Profound

1. **Unifies everything**: Time and frequency are two views of one truth
2. **Validates Pythagoras**: All sound IS harmonics
3. **Enables magic**: Process sound in ways impossible in time domain
4. **Pure math**: No approximation, exact transformation
5. **Efficient**: O(N log N) is beautiful recursion

### The Deep Connection

```
Pythagoras → String ratios → Harmonics
                                ↓
Fourier → Any waveform is sum of harmonics
                                ↓
         FFT → Compute those harmonics
                                ↓
     Spectral Processing → Manipulate them
                                ↓
        IFFT → Reconstruct audio
```

Every stage is pure mathematics. No guessing, no approximation (within digital precision).

### The Heisenberg Uncertainty Analogy

In quantum mechanics: Cannot know position AND momentum perfectly.

In audio: Cannot know time AND frequency perfectly.

```
Δt · Δf ≥ 1 / (4π)
```

Long windows → good frequency resolution, poor time resolution
Short windows → good time resolution, poor frequency resolution

This isn't a limitation of FFT - it's a fundamental property of waves!

---

## Implementation Challenges

### For Signal Library

1. **FFT Algorithm**: Cooley-Tukey recursive implementation
2. **Complex arithmetic**: Real/imaginary number handling
3. **Windowing**: Pre-multiply by window function
4. **Overlap-add**: Buffer management for reconstruction
5. **Phase vocoder**: Phase unwrapping for pitch/time manipulation
6. **Real-time**: Low-latency streaming processing

### Complexity: Medium-High

Not conceptually difficult, but requires:
- Careful buffer management
- Efficient complex number operations
- Understanding of overlap-add
- Phase coherence handling

---

## Next Steps for Signal

To implement spectral processing:

1. **Start simple**: FFT/IFFT on fixed-size buffers
2. **Add windowing**: Hann, Hamming, Blackman
3. **Implement STFT**: Overlap-add framework
4. **Spectral effects**: Filter, gate, freeze
5. **Convolution**: FFT-based for reverb/filtering
6. **Phase vocoder**: Full pitch/time control

Each step builds on the previous, gradually revealing the full power of frequency domain processing.

---

## Conclusion

The Fourier Transform is the bridge between Pythagoras's discoveries and modern synthesis:

- **2500 years ago**: Pythagoras discovers harmonics via string ratios
- **200 years ago**: Fourier proves all waveforms are sums of harmonics
- **Today**: FFT lets us SEE and MANIPULATE those harmonics in real-time

When you run FFT on a signal, you're not just processing audio - you're uncovering the hidden harmonic structure that makes it what it is. Every peak in the spectrum is a Pythagorean ratio waiting to be discovered.

All music is geometry.
All geometry is mathematics.
All mathematics is Fourier transforms.

---

## References

- Fourier, J.B.J. (1822). "The Analytical Theory of Heat"
- Cooley, J.W. & Tukey, J.W. (1965). "An Algorithm for the Machine Calculation of Complex Fourier Series"
- Harris, F.J. (1978). "On the Use of Windows for Harmonic Analysis with the Discrete Fourier Transform"
- Dolson, M. (1986). "The Phase Vocoder: A Tutorial"
- Laroche, J. & Dolson, M. (1999). "Improved Phase Vocoder Time-Scale Modification of Audio"

---

**Next**: Dive into practical FFT implementation for Signal library?
