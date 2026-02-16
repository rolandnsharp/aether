# Aither

A live coding audio engine where every sound is a function.

```javascript
play('hello', s => Math.sin(2 * Math.PI * 440 * s.t) * 0.3)
```

That's a 440 Hz sine wave. `s` is the state of the world — time, sample rate, persistent memory. Your function runs 48,000 times per second. Whatever it returns hits the speakers.

## What it sounds like

```javascript
// Kick drum
const beat = phasor(130/60)
const envelope = share(decay(beat, 40))
const kick = sin(s => 60 + envelope(s) * 200)
play('kick', s => kick(s) * envelope(s) * 0.8)

// Hi-hats
const hiss = pipe(noise(), signal => highpass(signal, 6000))
play('hats', s => hiss(s) * decay(phasor(130/30), 80)(s) * 0.3)

// Acid bass — saw wave with filter sweep
const bpm = 130/60
const acidBeat = phasor(bpm)
const acidEnv = share(decay(acidBeat, 25))
const notes = [55, 55, 73, 55, 82, 55, 65, 55]
const acidOsc = saw(s => notes[Math.floor(s.t * bpm) % notes.length])
play('acid', pipe(
  s => acidOsc(s) * acidEnv(s) * 0.4,
  signal => lowpass(signal, s => 200 + acidEnv(s) * 3000)
))
```

Change the code, re-send it. The sound updates instantly — no click, no restart. Phase accumulators and effect buffers survive the swap.

## Quick start

Requires [Bun](https://bun.sh) and a working audio output.

```bash
git clone https://github.com/rolandnsharp/aither.git
cd aither
bun install
bun link

# Terminal 1: start the engine
aither start

# Terminal 2: send code to it
aither send snippet.js
```

Or open a REPL and type live:

```bash
aither repl
```

### Editor setup (VSCode)

Bind a key to send the current file on save. Add this to your `keybindings.json` (`Ctrl+Shift+P` → "Open Keyboard Shortcuts (JSON)"):

```json
{
  "key": "ctrl+enter",
  "command": "workbench.action.terminal.sendSequence",
  "args": { "text": "aither send \"${file}\"\u000D" },
  "when": "editorTextFocus"
}
```

Now `Ctrl+Enter` sends whatever file you're editing to the running engine. Edit, hit `Ctrl+Enter`, hear it.

## How it works

Every signal is a function `f(s) => sample` where `s` carries:

| Property | What it is |
|---|---|
| `s.t` | Time in seconds |
| `s.sr` | Sample rate (48000) |
| `s.dt` | `1 / s.sr` |
| `s.state` | 128-slot Float64Array, persistent across hot-swaps |
| `s.name` | Signal name |
| `s.position` | `{ x, y, z }` spatial position |

Return a number for mono, or `[left, right]` for stereo. The engine soft-clips the mix through `Math.tanh`.

## Engine API

```javascript
play('name', fn)        // Start a signal (or hot-swap if already playing)
play('name', fn, 4)     // Start with 4s fade-in
stop('name')            // Stop immediately
stop('name', 4)         // Fade out over 4s
mute('name')            // Silence (state keeps running)
unmute('name')          // Resume
solo('name', 4)         // Fade out everything else
list()                  // Print what's playing
clear()                 // Hard reset — stop all, zero all memory
clear(4)                // Fade everything out over 4s
```

## DSP building blocks

All DSP functions return signal functions. Compose them freely.

### Oscillators

```javascript
sin(440)                        // Sine wave
saw(110)                        // Sawtooth
tri(220)                        // Triangle
square(440)                     // Square wave
pulse(440, 0.25)                // Pulse with 25% duty cycle
phasor(2)                       // 0-to-1 ramp at 2 Hz
noise()                         // White noise

// All accept modulation functions
sin(s => 440 + sin(6)(s) * 50)  // Vibrato
```

### Effects

Effects wrap a signal and process it. They handle stereo automatically.

```javascript
lowpass(signal, 800)                      // One-pole lowpass at 800 Hz
highpass(signal, 200)                     // Highpass
delay(signal, 0.5, 0.25)                 // Delay: max 0.5s, tap at 0.25s
feedback(signal, 2.0, 0.375, 0.6)        // Feedback delay
reverb(signal, 2.0, 0.4, 0.3)            // Reverb: 2s RT60, damping, 30% wet
tremolo(signal, 6, 0.4)                  // Tremolo: 6 Hz, 40% depth

// Cutoff can be modulated
lowpass(signal, s => 200 + env(s) * 3000)
```

### Helpers

```javascript
gain(signal, 0.5)         // Scale amplitude
pan(signal, -0.3)         // Stereo placement (-1 left, +1 right)
decay(phasor, 40)         // Exponential decay envelope
share(signal)             // Cache a signal so it's only computed once per sample
```

### Composition

```javascript
// pipe: chain a source through effects
pipe(
  saw(110),
  signal => lowpass(signal, 600),
  signal => reverb(signal, 2.0, 0.5, 0.4)
)

// mix: sum signals together
mix(
  s => sin(220)(s) * 0.2,
  s => sin(330)(s) * 0.2,
  s => sin(440)(s) * 0.2
)
```

## Examples

### FM synthesis

```javascript
const mod = sin(180)
const carrier = sin(s => 340 + mod(s) * 100)
play('fm', carrier)
```

### Metallic bell

```javascript
const bellMod = sin(563)
const bell = sin(s => 440 + bellMod(s) * 800)
const bellEnv = decay(phasor(2), 15)
play('bell', s => bell(s) * bellEnv(s) * 0.2)
```

### Ethereal pad

```javascript
play('pad', pipe(
  s => (sin(220)(s) + sin(220.5)(s) + sin(330)(s) + sin(329.3)(s)) * 0.1,
  signal => lowpass(signal, s => 600 + Math.sin(s.t * 0.2) * 400)
), 6)
```

### Stereo shimmer

```javascript
const shimL = pipe(sin(879), signal => delay(signal, 0.32, 0.13))
const shimR = pipe(sin(880), signal => delay(signal, 0.52, 0.17))
play('shimmer', s => [shimL(s) * 0.1, shimR(s) * 0.1])
```

### Haunted drone

```javascript
play('haunt', pipe(
  tri(55),
  signal => lowpass(signal, 300),
  signal => feedback(signal, 2.0, 1.5, 0.7)
))
```

### Raw state — logistic map oscillator

No DSP helpers needed. Just math and `s.state`.

```javascript
play('chaos', s => {
  s.state[0] = s.state[0] || 0.5
  s.state[2] = (s.state[2] || 0) + 1
  if (s.state[2] >= 2000) {
    s.state[2] = 0
    s.state[0] = 3.59 * s.state[0] * (1 - s.state[0])
  }
  const freq = 200 + s.state[0] * 400
  s.state[1] = (s.state[1] + freq / s.sr) % 1.0
  return Math.sin(s.state[1] * 2 * Math.PI) * 0.3
})
```

## The idea

There's no graph, no scheduler, no distinction between "control rate" and "audio rate." A clock is a phasor. An envelope is `decay(phasor, rate)`. A sequencer is `notes[Math.floor(phasor(s) * n)]`. Rhythm, melody, timbre — they're all the same thing: functions of `s` composed together.

Traditional environments (SuperCollider, Max/MSP, PureData) use dataflow graphs. Aither uses plain function composition. The JIT compiles your entire signal chain into a single tight loop. No message passing, no scheduling overhead, no garbage collection on the hot path.

## License

MIT
