# Kanon Surgery Guide

This document provides tips for live-coding and modifying sound recipes while Kanon is running (`bun --hot`).

## Phase Continuity and "The Snap"

The Phase 2 JIT compiler is designed to maintain phase continuity. When you change the frequency of an oscillator, the engine attempts to "snap" the new waveform to the phase and value of the old one, preventing clicks and pops.

To ensure this works reliably, it is recommended to keep your oscillators in the same order within your recipe function. The compiler assigns state slots based on the order of discovery, so maintaining this order helps the engine correctly map the state of the old oscillator to the new one.

## Vector Space (N-Dimensional Audio)

As of the "N-Dimensional" refactor, the audio engine now operates in Vector Space. Recipes can return a single value (for mono, which is auto-upmixed) or an array of values for multi-channel audio.

The `STRIDE` constant in `src/audio_engine/storage.js` defines the number of channels.

-   **STRIDE = 2 (Default):** Stereo
    -   Channel 0: Left / X
    -   Channel 1: Right / Y
-   **STRIDE = 4:** 4-Channel (e.g., for Quadraphonic or 3D vector synthesis)
    -   Channel 2: Z
    -   Channel 3: W

To expand to 4D sound, simply update the `STRIDE` constant. The engine's core mixing and transport layers will adapt automatically.
