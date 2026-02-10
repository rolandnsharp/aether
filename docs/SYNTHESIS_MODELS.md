# Kanon Synthesis Models: A Design Evolution

This document outlines the five fundamental synthesis paradigms discovered through the development of the Kanon engine. Each represents a different level of abstraction for modeling sound, creating a hierarchy that moves from pure mathematics to the simulation of entire sonic universes. Understanding these models is key to leveraging the full expressive power of the live coding environment.

## The Five Paradigms of Abstraction

| Paradigm | What it Models | Core Equation | Key Concept |
| :--- | :--- | :--- | :--- |
| **1. `f(t)`** | A single value over time | Algebraic | Time |
| **2. `f(state, rate)`** | A musical oscillator | Difference Eq. | Phase & Frequency |
| **3. `f(state, dt)`** | A discrete algorithm | Iteration | Manual Time Step |
| **4. `flow(state)`** | **Discrete Objects** | ODEs | **Forces & Time** |
| **5. `field(state)`** | **A Continuous Medium**| PDEs | **Neighbors & Space-Time**|

---

### Style 1: `f(t)` - Function of Time (The Platonic Ideal)

This is the purest mathematical representation of sound, where a sample is a timeless function of a time variable `t`.

-   **Core Idea:** `sample = f(t)`
-   **Analogy:** An infinitely detailed vinyl record. The sound at any point in time exists independently and can be accessed by "dropping the needle" at that exact `t`.
-   **Limitation:** Unsuitable for live coding. Lacks state, meaning any change to the function causes a phase discontinuity (a "click"). It cannot "flow."

---

### Style 2: `f(state, sampleRate)` - Phase Accumulation (The Musical Clock)

This is the standard, efficient method for generating stable musical tones.

-   **Core Idea:** The next state is derived from the previous using a `phaseIncrement` calculated from the project's global `sampleRate`.
-   **Analogy:** A precision digital clock. The `sampleRate` is the universal, unchangeable speed of the clock's ticking. We control the speed of the hands by calculating the exact angle they must move on each tick to match a desired musical frequency (Hz).
-   **Strength:** Extremely efficient, phase-continuous, and musically intuitive (control is in Hz). The professional standard for digital oscillators.

---

### Style 3: `f(state, dt)` - Manual Simulation (The Virtual Algorithm)

This paradigm shifts from musical prescription to algorithmic simulation.

-   **Core Idea:** We define a small, internal time step, `dt`, and write an `update` loop that calculates the next state based on the current state and `dt`.
-   **Analogy:** A manual physics simulation. We are the computer, responsible for calculating `newState = currentState + velocity * dt` on every frame.
-   **Strength:** Excellent for generative and chaotic systems where control is indirect, leading to exploration and "happy accidents."

---

### Style 4: `flow(state)` - Physics Simulation (The Virtual World)

This is a major leap in abstraction, moving beyond manual simulation to a declarative, physics-based model for **discrete objects**.

-   **Core Idea:** We stop manually calculating the next state. Instead, we describe the **physical forces** acting on a system (the derivatives), and we let the engine handle the integration (the "flow" of time).
-   **Analogy:** A true virtual world of objects. We are physicists defining the laws of our universe. We place a virtual object (a mass on a spring) in our world, define its properties (`tension`, `friction`, `mass`), and then simply listen to the sound it makes as it behaves according to those laws.
-   **Strength:** Highly intuitive and organic. Live coding becomes about manipulating physical properties, not algorithms. It hides the underlying digital clock (`sampleRate` and `dt`), creating a seamless experience of interacting with a flowing, living object.

---

### Style 5: `field(state)` - Field Simulation (The Sonic Universe)

This is the most profound paradigm, moving beyond discrete objects to the simulation of a **continuous medium**. This is the key to modeling phenomena like wave propagation, fluid dynamics, and reaction-diffusion systems.

-   **Core Idea:** The state memory (`mem`) is no longer a bucket of variables; it becomes the **physical medium itself**. The state of any single point depends on the state of its immediate **neighbors**. This is the world of Partial Differential Equations (PDEs).
-   **Analogy:** From a virtual world to a virtual universe. We are no longer just placing objects in space; we are defining the very fabric of space-time itself. We can define the properties of a 1D string, a 2D membrane, or a 3D volume of air, then "excite" it and listen to how the energy propagates through it.
-   **Proposed Code (1D Vibrating String):**
    ```javascript
    field('vibrating-string', (mem) => {
      const params = { wave_speed: 0.5, damping: 0.001 };
      return {
        derivatives: (state_at_i, neighbors) => {
          const { position, velocity } = state_at_i;
          const { left, right } = neighbors;
          // The force is based on the "curvature" between neighbors (the wave equation)
          const laplacian = (left.position - 2 * position + right.position);
          const acceleration = (params.wave_speed * laplacian) - (params.damping * velocity);
          return { d_velocity: acceleration };
        },
        output: (state) => state.positions[128] // Listen to one point in the field
      };
    });
    ```
-   **Strength:** Unlocks the simulation of true physical sound phenomena: wave propagation, reflection, standing waves, resonance, and diffusion. This is the ultimate paradigm for creating truly emergent, complex, and physically realistic sonic environments.

## The Unified Vision

The ultimate goal for Kanon is not to choose one style, but to allow them all to coexist as interoperable layers of abstraction. A live coder should be able to:
-   Lay down a perfectly stable bassline using the **`sampleRate`** style.
-   Add an evolving, textural pad using the **`dt`** style.
-   Introduce a lead voice that feels like a physical object using the **`flow`** style.
-   Simulate the resonance of that voice in a virtual room using the **`field`** style.

By providing this complete hierarchy, Kanon can become a powerful instrument for both musical composition and the exploration of entire sonic universes. The `flow` and `field` paradigms represent the next major steps in achieving this vision.
