# Oscilloscope Art

Oscilloscope art turns audio signals into geometry. In X-Y mode the left channel drives the horizontal axis and the right channel drives the vertical. Whatever your function returns as `[L, R]` becomes a point on a 2D plane, drawn 48,000 times per second.

The Aither scope has phosphor persistence and bloom — traces linger and glow like a real CRT. Every DSP technique you already know for shaping sound also shapes light.

## The basics: Lissajous figures

Two sine waves at a frequency ratio create a closed curve.

```javascript
const xOsc = sin(s => 100)
const yOsc = sin(s => 150)      // 2:3 ratio
play('lissajous', s => [xOsc(s), yOsc(s)])
```

Simple ratios make recognizable shapes:

| Ratio | Shape |
|-------|-------|
| 1:1   | Circle / diagonal line |
| 1:2   | Figure-eight |
| 2:3   | Pretzel |
| 3:4   | Braided loop |

The ratio determines the topology. The phase relationship determines the orientation.

## Rotation via detune

A perfect frequency ratio locks the figure in place. Detune one oscillator by a fraction of a Hertz and the figure rotates — the phase relationship drifts continuously.

```javascript
const yOsc = sin(s => 150 + 0.5)  // +0.5 Hz → slow spin
```

On a phosphor display, the rotating trace paints every possible phase orientation, filling out the full Lissajous family. Higher detune = faster rotation. Sub-Hertz detune gives meditative drift.

## Additive harmonics: the spirograph

A spirograph works by meshing gears of different sizes. In signal terms, that's adding sine waves at integer multiples of a base frequency. Each harmonic adds loops to the pattern.

```javascript
const f = 55
const r1x = sin(s => f),       r1y = sin(s => f + 0.3)
const r2x = sin(s => f * 5),   r2y = sin(s => f * 5 + 0.5)
const r3x = sin(s => f * 13),  r3y = sin(s => f * 13 + 0.7)
const breathe = sin(s => 0.06)
play('spirograph', s => {
  const b = breathe(s)
  const L = r1x(s) * 0.55 + r2x(s) * 0.3 + r3x(s) * (0.1 + b * 0.08)
  const R = r1y(s) * 0.55 + r2y(s) * 0.3 + r3y(s) * (0.1 + b * 0.08)
  return [L, R]
})
```

Each pair (r1x/r1y, r2x/r2y, r3x/r3y) is a "gear" rotating at its own speed. The small detune between X and Y of each pair gives each gear independent rotation. A slow LFO breathing the third harmonic's amplitude morphs the tooth depth over time.

Odd harmonic numbers (1, 5, 13) tend toward radial symmetry. Even harmonics break it.

## Amplitude modulation: knots and roses

Multiplying two signals (ring modulation) creates patterns that fold through themselves — the topology of knots.

```javascript
const f = 90
const cx = sin(s => f)
const cy = sin(s => f + 0.4)
const mod = sin(s => f * 2 / 3)
play('knot', s => {
  const m = 0.4 + mod(s) * 0.6
  const L = cx(s) * m
  const R = cy(s) * m
  return [L, R]
})
```

The modulator scales the carrier's amplitude, pinching the orbit at regular intervals. The ratio between carrier and modulator frequencies determines how many crossings the knot has. A 3:2 ratio (carrier:mod) gives a trefoil-like pattern.

### Rose curves

A rose curve is a special case of AM where the modulator frequency is an integer multiple of the carrier.

```javascript
const f = 55, k = 3
const petals = tri(s => f * k)    // tri → angular petals
const xSpin = sin(s => f)
const ySpin = sin(s => f + 0.15)
play('bloom', s => {
  const r = petals(s)
  const L = r * xSpin(s) * 0.9
  const R = r * ySpin(s) * 0.9
  return [L, R]
})
```

The "radius" oscillator (`petals`) runs at `k` times the spin frequency, creating `k` petals (or `2k` if `k` is even). Using `tri` instead of `sin` for the radius gives the petals angular, crystalline edges rather than smooth lobes.

## Waveform choice

The waveform of each oscillator directly shapes the geometry:

- **`sin`** — Smooth, continuous curves. The default for organic, flowing patterns.
- **`tri`** — Linear ramps create angular, faceted geometry. Crystalline.
- **`saw`** — Asymmetric ramp produces sharp directional edges. One side smooth, one side snapping back.
- **`square`** — Jumps between extremes. Creates rectangular traces and hard corners.

Mixing waveforms creates contrast. A `sin` base with `tri` harmonics gives smooth curves with angular detail.

## Damping: the harmonograph

A harmonograph is a mechanical drawing machine — two pendulums coupled together, tracing patterns as they lose energy. The figure spirals inward as amplitude decays.

```javascript
const cycle = phasor(s => 1 / 10)   // 10-second cycle
const env = decay(cycle, 4)          // exponential dampening
const xPend = sin(s => 85)
const yPend = sin(s => 85 * 3 / 2 + 0.3)
const xOver = tri(s => 85 * 2)
const yOver = tri(s => 85 * 3)
play('harmonograph', s => {
  const a = env(s)
  const L = (xPend(s) * 0.7 + xOver(s) * 0.2) * a
  const R = (yPend(s) * 0.7 + yOver(s) * 0.2) * a
  return [L, R]
})
```

`phasor` ramps from 0 to 1, then wraps. `decay(phasor, 4)` converts that ramp into `exp(-phase * 4)` — the amplitude falls to near zero over 10 seconds, then snaps back to full when the phasor resets. On the phosphor display, you see the spiral collapse and then bloom outward again.

Adding `tri` overtones to each pendulum gives the trace angular facets that emerge as the pattern tightens.

## Design principles

**Keep frequencies low.** 50–200 Hz gives the scope enough samples per cycle to draw smooth curves. Higher frequencies create denser patterns but can look noisy.

**Detune everything slightly.** Perfect ratios make static figures. Fractional-Hz offsets create life — slow rotation, phase drift, evolving structure. Different detune amounts per oscillator pair give each layer independent motion.

**Modulate the mix.** A sub-Hertz LFO (0.03–0.1 Hz) breathing an amplitude or mix parameter creates patterns that evolve over tens of seconds. The phosphor persistence means the eye sees the current state and the recent past simultaneously.

**Think in ratios.** The visual pattern is determined by the frequency relationships between L and R, not the absolute frequencies. Doubling all frequencies produces the same shape (just drawn faster and at higher pitch).

**Layer deliberately.** Start with one oscillator pair for the base figure. Add a second pair at a higher harmonic for detail. Add a third for fine texture. Each layer should be quieter than the last — the base provides structure, harmonics provide ornamentation.

## Snippets

| Snippet | Technique | What you see |
|---------|-----------|-------------|
| `scope` | Lissajous + harmonic morph | Braided loop with evolving detail |
| `scope-spirograph` | Additive harmonics (3 layers) | Multi-lobed gear-tooth geometry |
| `scope-knot` | Ring modulation | Self-crossing torus knot |
| `scope-bloom` | AM with tri-wave radius | Angular flower petals |
| `scope-harmonograph` | Decay envelope | Spiral collapsing inward, then resetting |