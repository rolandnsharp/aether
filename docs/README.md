# Aether Documentation Wiki

> *"All things are number. All things flow."* — The Five Elements of Sound

Welcome to the Aether multi-paradigm audio synthesis documentation. This is a comprehensive wiki covering pure functional synthesis, mathematical foundations, esoteric sound theory, and the profound connections between music, physics, and philosophy.

## Quick Navigation

### 🚀 Getting Started
- **[Getting Started Guide](guides/getting-started.md)** - Your first sounds in 5 minutes
- **[Philosophy](PHILOSOPHY.md)** - Understanding the Five Elements
- **[Live Coding Workflow](guides/live-coding-workflow.md)** - Hot-reload and surgical editing

### 🌟 The Five Paradigms (Arche)

| Paradigm | Element | Focus | Status |
|----------|---------|-------|--------|
| **[Rhythmos](paradigms/rhythmos/overview.md)** | Earth 🌍 | Explicit state, phase continuity | ✅ Implemented |
| **[Kanon](paradigms/kanon/overview.md)** | Fire 🔥 | Pure `f(t)`, mathematical beauty | ✅ Implemented |
| **[Atomos](paradigms/atomos/coming-soon.md)** | Air 💨 | Discrete events, emergent textures | 🚧 Coming Soon |
| **[Physis](paradigms/physis/coming-soon.md)** | Water 💧 | Physics simulation, organic sounds | 🚧 Coming Soon |
| **[Chora](paradigms/chora/coming-soon.md)** | Aether ✨ | Spatial fields, resonance | 🚧 Coming Soon |

### 🎛️ Synthesis Techniques
- [Additive Synthesis](synthesis-techniques/additive-synthesis.md)
- [Delay & Feedback](synthesis-techniques/delay-and-feedback.md)
- [Modulation (AM/FM/PM)](synthesis-techniques/modulation.md)
- [Envelopes & Control](synthesis-techniques/envelopes.md)
- [Filters & Spectral Processing](synthesis-techniques/filters.md)

### 📐 Mathematical Foundations
- [Fourier Transform & Spectral Analysis](mathematical-foundations/fourier-transform.md)
- [Category Theory & Plotinus](mathematical-foundations/category-theory-plotinus.md)
- [Harmonic Series & Ratios](mathematical-foundations/harmonic-series.md)
- [Wave Equation & Physics](mathematical-foundations/wave-equation.md)

### ✨ Esoteric & Advanced Topics

*The profound connections between music, physics, and ancient wisdom*

- **[Tesla's Longitudinal Waves](esoteric/tesla-longitudinal-waves.md)** - How Tesla's "suppressed" wave physics is actually acoustics!
- **[EM Fields & Music](esoteric/em-fields-music.md)** - Maxwell's equations, light & sound unified
- **[Steinmetz Conjugate Synthesis](esoteric/steinmetz-conjugate-synthesis.md)** - Complex numbers & AC power applied to audio
- **[Chaos & Strange Attractors](esoteric/chaos-attractors.md)** - Deterministic chaos for organic patterns
- Quantum Acoustics - *Coming soon*

### 🌀 Generative Music & Algorithms
- **[Y-Combinator Music](paradigms/kanon/generative/y-combinator.md)** - Anonymous recursion, fractals, self-similarity
- [L-Systems](paradigms/kanon/generative/l-systems.md) - Lindenmayer grammars for musical structures
- [Musical Fractals](paradigms/kanon/generative/fractals.md) - Self-similar patterns at all scales
- [Constraint-Based Composition](paradigms/kanon/generative/constraint-based.md) - Rule-based music generation

### ⚡ Advanced Topics
- [State vs Recursion](advanced/state-vs-recursion.md) - Pure functional vs stateful approaches
- [Cross-Paradigm Composition](advanced/cross-paradigm-composition.md) - Mixing the Five Elements
- [Performance Optimization](advanced/performance-optimization.md) - Speed and efficiency
- [Memoization Techniques](advanced/memoization.md) - Caching for recursive functions

---

## Learning Paths

### Path 1: Practical Synthesis (Beginner)
1. [Getting Started](guides/getting-started.md)
2. [Rhythmos Quick Start](paradigms/rhythmos/quick-start.md)
3. [Basic Synthesis Techniques](synthesis-techniques/additive-synthesis.md)
4. [Live Coding Workflow](guides/live-coding-workflow.md)

### Path 2: Pure Functional Approach (Intermediate)
1. [Kanon Overview](paradigms/kanon/overview.md)
2. [Pure Functions & Composition](paradigms/kanon/pure-functions.md)
3. [State vs Recursion](advanced/state-vs-recursion.md)
4. [Y-Combinator Music](paradigms/kanon/generative/y-combinator.md)

### Path 3: Mathematical Exploration (Advanced)
1. [Philosophy - The Five Elements](PHILOSOPHY.md)
2. [Fourier Transform](mathematical-foundations/fourier-transform.md)
3. [Harmonic Series](mathematical-foundations/harmonic-series.md)
4. [Category Theory & Plotinus](mathematical-foundations/category-theory-plotinus.md)

### Path 4: Esoteric & Profound (Deep Dive)
1. [Tesla's Longitudinal Waves](esoteric/tesla-longitudinal-waves.md)
2. [EM Fields & Music](esoteric/em-fields-music.md)
3. [Steinmetz Conjugate Synthesis](esoteric/steinmetz-conjugate-synthesis.md)
4. [Category Theory & Plotinus](mathematical-foundations/category-theory-plotinus.md)
5. [Chaos & Attractors](esoteric/chaos-attractors.md)

---

## Philosophy

**Aether** embodies the Pythagorean approach to sound synthesis:
- **Sound as eternal geometry** that exists timelessly
- **Functions of time** reveal crystalline structures
- **Divine proportions**: Golden Ratio (φ), perfect ratios (3:2, 4:3)
- **"All is Number"** - the universe as pre-existing mathematical perfection

But Aether also acknowledges Heraclitus:
- **"Everything flows"** - sound as a living process
- **State and momentum** - phase continuity through hot-reload
- **The river of fire** - signals with memory and inertia

**Five paradigms**, each with its own relationship to time, state, and synthesis. Choose the one that matches your musical idea, or combine them all.

See [PHILOSOPHY.md](PHILOSOPHY.md) for the complete vision.

---

## Core Concepts

### Multi-Paradigm Architecture

Aether doesn't force you into a single way of thinking. It provides five complementary paradigms:

- **Rhythmos (Earth 🌍)**: `f(state, sr)` - Solid, predictable, phase-continuous
- **Kanon (Fire 🔥)**: `f(t)` - Pure, eternal, mathematically beautiful
- **Atomos (Air 💨)**: `f(state, dt)` - Discrete, emergent, stochastic
- **Physis (Water 💧)**: `flow(state)` - Physical, organic, resonant
- **Chora (Aether ✨)**: `field(state)` - Spatial, holistic, reverberant

Each paradigm maintains **conceptual purity** while enabling **cross-paradigm composition**.

### The Monochord Philosophy

Pythagoras discovered harmony using the monochord - a single vibrating string. In Aether:
- Your **state array is the string**
- **Phase accumulation** is continuous vibration
- **Hot-reload** adjusts tension while the string plays
- **The monochord never stops**

But the ratios (Kanon) are eternal, while the string (Rhythmos) manifests them.

---

## API Reference

### Rhythmos (Earth 🌍)
```javascript
import { Rhythmos } from './src/arche/rhythmos/index.js';

Rhythmos.register('carrier',
  Rhythmos.pipe(
    Rhythmos.sin(440),
    Rhythmos.gain(0.3)
  )
);
```

### Kanon (Fire 🔥)
```javascript
import { Kanon } from './src/arche/kanon/index.js';

const sine440 = t => Math.sin(2 * Math.PI * 440 * t);

Kanon.register('pure-tone',
  Kanon.pipe(
    sine440,
    Kanon.gain(0.3)
  )
);
```

See paradigm-specific documentation for complete API reference.

---

## Contributing

Found an error or have an improvement? This is a living document that grows with the community's exploration of sound.

---

## Table of Contents

### Paradigms
- [Rhythmos (Earth)](paradigms/rhythmos/overview.md)
- [Kanon (Fire)](paradigms/kanon/overview.md)
- [Atomos (Air)](paradigms/atomos/coming-soon.md) - *Coming soon*
- [Physis (Water)](paradigms/physis/coming-soon.md) - *Coming soon*
- [Chora (Aether)](paradigms/chora/coming-soon.md) - *Coming soon*

### Synthesis Techniques
- [Additive Synthesis](synthesis-techniques/additive-synthesis.md)
- [Delay & Feedback](synthesis-techniques/delay-and-feedback.md)
- [Modulation](synthesis-techniques/modulation.md)
- [Envelopes](synthesis-techniques/envelopes.md)
- [Filters](synthesis-techniques/filters.md)

### Mathematical Foundations
- [Fourier Transform](mathematical-foundations/fourier-transform.md)
- [Category Theory & Plotinus](mathematical-foundations/category-theory-plotinus.md)
- [Harmonic Series](mathematical-foundations/harmonic-series.md)
- [Wave Equation](mathematical-foundations/wave-equation.md)

### Esoteric Topics
- [Tesla's Longitudinal Waves](esoteric/tesla-longitudinal-waves.md)
- [EM Fields & Music](esoteric/em-fields-music.md)
- [Steinmetz Conjugate Synthesis](esoteric/steinmetz-conjugate-synthesis.md)
- [Chaos & Attractors](esoteric/chaos-attractors.md)

### Advanced Topics
- [State vs Recursion](advanced/state-vs-recursion.md)
- [Cross-Paradigm Composition](advanced/cross-paradigm-composition.md)
- [Performance Optimization](advanced/performance-optimization.md)
- [Memoization](advanced/memoization.md)

### Guides
- [Getting Started](guides/getting-started.md)
- [Live Coding Workflow](guides/live-coding-workflow.md)
- [Surgery Guide](guides/surgery-guide.md)

---

**Welcome to the exploration of eternal harmonic truth.** 🎵

*"The monochord never stopped vibrating. It just evolved."* - Aether Engineering Principle
