# KANON - A Headless Live-Coding Environment

This project is a minimal, headless live-coding environment for audio synthesis. It uses Bun, Playwright, and genish.js to create a system where you can edit a JavaScript file and have the changes instantly reflected in the audio output.

## Architecture

- **`host.ts`**: The main server process, powered by Bun. It launches a headless Chromium instance using Playwright and runs a WebSocket server.
- **`client/engine.js`**: The audio engine that runs in the headless browser. It uses `genish.js` for synthesis and an `AudioWorklet` for performance.
- **`wave-dsp.js`**: A user-facing library of DSP functions.
- **`eval.ts`**: A CLI script to send code from your editor to the audio engine.
- **`signal.js`**: A sample file with musical ideas.

## How to Use: Two Live-Coding Workflows

This environment supports two distinct workflows for updating the sound.

### Workflow 1: Automatic Reloading (Recommended for most editors)

The host server automatically watches `signal.js` for changes.

1.  Start the host server: `bun run host.ts`.
2.  Open `signal.js` in your favorite text editor (VS Code, Sublime Text, etc.).
3.  Make a change to the file (e.g., change `sin(440)` to `sin(880)`).
4.  **Simply save the file.**

The host will detect the change and instantly send the entire file's content to the audio engine. The engine will re-evaluate the code, updating any sound definitions.

### Workflow 2: Surgical Updates (Vim & Advanced CLI)

This workflow allows you to send and update specific, labeled blocks of code without disturbing others. This is ideal for performance or fine-grained control.

1.  Add the mappings from `vimrc_mapping.txt` to your Vim/Neovim configuration.
2.  Open `signal.js` in Vim.
3.  Place your cursor on a code block (like a single `wave(...)` call).
4.  Press `\p` (or your leader key + `p`).

Only that block of code is sent to the engine. If the label already exists (e.g., 'tone'), the engine will surgically crossfade to the new sound without affecting other active sounds (e.g., 'noise-perc').

You can also use this method from any terminal:
```bash
# Send just one part of the signal.js file
echo "wave('tone', pipe(sin(220), gain(0.2)));" | bun run eval.ts
```

## Building

If you modify `wave-dsp.js` or `client/worklet.js`, you need to rebuild the worklet bundle:

```bash
cat genish.js wave-dsp.js client/worklet.js > client/worklet-bundled.js
```

This concatenates the three files into a single bundle that runs in the AudioWorklet context.

## How It Works

The system has two pathways for code:
1.  **File Watching:** The `host.ts` server watches `signal.js`. When you save the file, its full content is sent over a WebSocket to the browser engine.
2.  **CLI/Vim:** The `eval.ts` script pipes code from the command line (or your editor) to the `host.ts` server, which relays it to the browser engine.

In both cases, the `client/engine.js` running in the browser receives the code as a string and `eval()`s it. This executes calls to the `wave()` function, which compiles the `genish.js` audio graph and hot-swaps it in the `AudioWorklet`, ensuring a smooth crossfade for any updated sounds.

## 🎼 KANON: Git-Performance Workflow

In the KANON environment, your Git repository acts as your **Musical Score**. A "Commit" is not just a code backup—it is a **Snapshot of the math that creates your sound**. This section explains how to treat your Git history as a musical timeline.

### 1. The Core Philosophy

- **Commits = Patterns**: Each commit represents a specific state of your audio math.
- **Branches = Movements**: Use branches to explore different musical directions (e.g., `git checkout -b heavy-techno`) without losing your original "ambient" set.
- **Checkout = Time Travel**: Switching commits instantly re-renders the audio to that historical state.

### 2. Setting Up the "Auto-Recorder"

Ensure your `host.ts` (the Bun engine launcher) is running the Git Logger. This script monitors successful evaluations and snapshots them.

**Automated Log Script (logger.ts)**
```typescript
import { execSync } from "child_process";

export function snapshotPerformance(label: string) {
  try {
    execSync('git add .');
    execSync(`git commit -m "PERF: ${label} at ${new Date().toISOString()}"`);
    console.log(`✅ Snapshot recorded to Git tree.`);
  } catch (e) {
    // Silently fail if no changes were made to avoid log spam
  }
}
```

### 3. Performing in Vim

**The "Snapshot" Hotkey**

Add this to your `init.lua` (or `.vimrc`). This allows you to manually tag "Sweet Spots" in your math while you are playing.

```lua
-- Save and tag a specific musical moment as a 'Snapshot'
vim.keymap.set('n', '<leader>gs', ':!git commit -am "SNAPSHOT: Sweet Spot"<CR>', { desc = "Manual Musical Snapshot" })
```

### 4. Time-Traveling (The Jog Wheel)

When you turn your **Physical Jog Wheel**, the `eval.ts` script translates the MIDI rotation into a `git checkout` command.

- **Turn Left (Rewind)**: The engine runs `git checkout HEAD~1`. The headless browser detects the file change, recompiles the old math, and the sound "reverts" to the previous state.
- **Turn Right (Fast Forward)**: The engine runs `git checkout <next_hash>`.
- **Visualizing the Tree**: Keep a terminal pane open running `tig` or `git log --graph`. You will see the "HEAD" marker move up and down the tree as you turn the wheel.

### 5. Collaborative Performance (Remote Devs)

Because this is standard Git, other developers can follow your live set in real-time.

- **Pushing Live**: Run a background process: `while true; do git push origin main; sleep 10; done`.
- **Developer View**: Other coders can `git clone` your set while you are playing. They can see exactly which `genish.js` math you are using and even send a Pull Request with a new synth patch that you can merge into your live set.

### 6. The "Emergency Reset"

If you experiment your way into a "digital scream" or a crash:

1. Reach for your terminal.
2. Type: `git reset --hard HEAD~1`.
3. The engine instantly restores the last known good audio state.

**KANON turns the terminal into a time-machine. You aren't just coding; you are curating a history of vibrations.**

## TODO / Future Enhancements

- [ ] **Zero-Crossing Hot-Swap**: Implement glitch-free signal switching
  ```js
  // In engine.js's updateAudio function, wait for zero-crossing before switching
  // This prevents clicks/pops during live surgery
  function waitForZeroCrossing(signal) {
    let prevSample = signal[0];
    for (let i = 1; i < signal.length; i++) {
      // Detect zero crossing (sign change)
      if ((prevSample >= 0 && signal[i] < 0) || (prevSample < 0 && signal[i] >= 0)) {
        return i; // Switch at this sample index
      }
      prevSample = signal[i];
    }
    return 0; // Fallback if no crossing found
  }
  ```
  **Result**: All "Live Surgery" will be perfectly silent and sound professional. No more audio clicks when hot-swapping signals during performance.

- [ ] **Wrapping Time (The "Kanonical" Fix)**: Prevent floating-point precision loss during long sessions
  ```js
  // Instead of t = 0 to Infinity, use T = t % (Large Prime or Power of Two)
  // This keeps precision perfect even 10 hours into a performance
  const T = genish.mod(genish.accum(1/44100), 1024);

  // Example: "Immortal" drone that never loses precision
  wave('drone-safe', T => {
    // T wraps at 1024, but the math remains a pure function of time
    const root = sin(216 * T);
    const fifth = sin(216 * 1.5 * T);
    return mul(add(root, fifth), 0.1);
  });

  // Example: Boolean logic with wrapped time
  wave('logic-safe', T => {
    // Create a rhythm that cycles every 4 beats
    const kick = gt(sin(Math.PI * T), 0.9);
    return mul(sin(60 * T), kick);
  });
  ```
  **Why this works**: Sine waves are periodic, so wrapping T at a cycle point sounds identical to infinite time. Precision remains perfect because T never grows larger than 1024. Time-travel (jog wheel) still works - you scrub through a cycle rather than a line.

- [ ] **Snapshot Branching**: Use Git for performance tracking and "musical landmarks"
  ```vim
  " Vim alias for instant musical snapshots
  nnoremap <leader>s :!git commit -am "SNAPSHOT: [Manual Marker]"<CR>
  ```
  **The Workflow**: When you find a "sweet spot" in the math, hit `<leader>s` to create a landmark in the Git tree. If experimentation results in a sonic issue, use the jog wheel to instantly "teleport" back to that specific commit hash. This creates a non-linear performance workflow where you can branch, explore, and return to known-good states.

- [ ] **Audio Oscilloscope**: Use the browser window to visualize the audio waveform in real-time using Canvas/WebGL
  - Design inspired by **socci** (realistic analogue oscilloscope written in Lua)
  - Features to mimic:
    * Authentic phosphor glow and persistence
    * X-Y mode for Lissajous figures
    * Adjustable timebase and voltage scales
    * Trigger controls (edge, level, holdoff)
    * Classic green/amber CRT aesthetic
    * Beam intensity and focus controls
  - Implementation: Use Canvas 2D or WebGL for authentic CRT rendering with bloom/glow effects
- [ ] **Stereo Support**: Add stereo output with left/right channel helpers for binaural and spatial effects
  ```js
  // Example: Binaural "time-travel" explorer for jog wheel control
  wave('binaural-shift', t => {
    // 5Hz difference creates spatial rotation as you scrub time
    const left = sin(440 * t);
    const right = sin(445 * t);

    // Slow sweeping filter governed by t
    const cutoff = add(1000, mul(sin(0.2 * t), 800));

    return [
      lp(left, cutoff),  // Left channel
      lp(right, cutoff)  // Right channel
    ];
  });
  ```
- [ ] **Stateful Synthesis**: Implement state bridge for phase-continuous live updates ("surgical" edits)
  ```js
  // Example: Change waveform shape without restarting phase
  wave('surgical-lead', (t, state) => {
    const freq = 330;
    const p = state(0, add(state(0), freq / 44100));
    // Change 'sin' to 'tri' or 'sqr' in Vim and save
    // The phase 'p' continues uninterrupted
    return mul(sin(p * 2 * Math.PI), 0.2);
  });
  ```
- [ ] **Time-Travel Explorer**: Physical jog wheel control for scrubbing through phase/time
  ```js
  // Example: Using an external 'offset' parameter for jog wheel scrubbing
  // By mapping the wheel to a timeOffset, you can physically scrub through
  // the phase of the interference patterns
  const offset = param('jog_wheel', 0); // MIDI mapped
  const T = add(t, offset);             // Resultant Time

  wave('phase-warp', T => {
    // As T moves backward via the wheel,
    // the phase of these oscillators reverses in real-time.
    return stereo(
      sin(110 * T),
      sin(111 * T)
    );
  });
  ```
- [ ] **Conditional Logic**: Add genish comparison operators (gt, lt, selector) for algorithmic patterns
  ```js
  // Example: Rhythmic pulses using genish logic (no sequencer needed)
  wave('pulses', t => {
    // Create a trigger that fires every 0.5 seconds
    const beat = gt(sin(mul(2 * Math.PI * 2, t)), 0.95);

    // Pitch varies over time
    const slidingFreq = add(440, mul(sin(mul(0.1, t)), 200));

    return mul(sin(mul(slidingFreq, t)), beat, 0.3);
  });
  ```
- [ ] **FM/AM Synthesis**: Add modulation helpers for complex timbres
  ```js
  // Example: FM bell with amplitude envelope
  wave('fm-bell', t => {
    const carrierFreq = 880;
    const modFreq = 220;
    const index = 50; // Modulation depth

    // Frequency modulation
    const modulator = mul(sin(mul(modFreq, t)), index);
    const bell = sin(mul(add(carrierFreq, modulator), t));

    // Amplitude envelope
    const envelope = add(0.5, mul(sin(mul(0.5, t)), 0.5));

    return mul(bell, envelope, 0.1);
  });
  ```
- [ ] **Algorithmic Rhythms**: Use time-based Boolean logic for percussion and patterns without sequencers
  ```js
  // Example: Percussion using time modulo arithmetic
  wave('percussion', t => {
    const kick = gt(sin(1.5 * Math.PI * t), 0.98);
    const snare = gt(sin(3.0 * Math.PI * t), 0.99);
    const kick_snd = mul(sin(50 * t), kick);
    const snare_snd = mul(noise(), snare, 0.2);
    return add(kick_snd, snare_snd);
  });
  ```
- [ ] Add more DSP helpers (filters, envelopes, sequencing)
- [ ] Support for MIDI input
- [ ] Audio recording/export
