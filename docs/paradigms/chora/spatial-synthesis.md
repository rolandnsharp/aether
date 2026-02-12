# Spatial Synthesis: The Chora Paradigm

> *"Sound is not placed in space. Space generates sound."*

## The Revolutionary Concept

The Chora (Aether) paradigm represents a fundamentally different approach to spatial audio. Instead of generating sound and then spatializing it, **sound emerges from the spatial field itself**.

### Traditional Spatialization

**SuperCollider and most systems:**

```
[Generate Signal] → [Spatialize] → [Decode for Speakers]
```

1. Create a sound source (oscillator, sample, etc.)
2. Apply spatialization (pan, ambisonics)
3. Decode for speaker array
4. Sound exists independently, then is "placed" in space

### Spatial Synthesis (Chora)

**Aether approach:**

```
[Listener Position] → [Field Evaluation] → [Sound Emerges]
```

1. Define a spatial field (function of position)
2. Listener queries the field at their position
3. Sound is **generated** based on where you are
4. Sound doesn't exist until the field is evaluated

**The key difference:** The sound doesn't exist until you ask "what is the sound at position (x, y, z)?"

---

## The `s.position` Interface

All Chora signals receive the listener's position in the universe state:

```javascript
s = {
  t: 0,           // Time
  dt: 1/48000,    // Time delta
  sr: 48000,      // Sample rate
  position: {     // Listener position in 3D space
    x: 0,
    y: 0,
    z: 0
  },
  state: Float64Array(...)  // State memory
}
```

---

## Basic Spatial Synthesis

### Distance Attenuation

Sound falls off with distance (inverse square law):

```javascript
register('point-source', s => {
  const { x, y, z } = s.position;
  const distance = Math.sqrt(x*x + y*y + z*z);

  // 1/r amplitude falloff
  const amplitude = 1 / (distance + 1);  // +1 prevents division by zero

  const sound = Math.sin(2 * Math.PI * 440 * s.t);
  return sound * amplitude;
});

// Move the listener:
setPosition({ x: 2, y: 1, z: 0 });  // Further away = quieter
```

### Wave Propagation

Sound travels at finite speed (343 m/s in air):

```javascript
register('propagating-wave', s => {
  const { x, y, z } = s.position;
  const distance = Math.sqrt(x*x + y*y + z*z);
  const speedOfSound = 343;  // m/s

  // Time it takes for sound to reach this position
  const travelTime = distance / speedOfSound;
  const delayedTime = s.t - travelTime;

  // Wave hasn't arrived yet
  if (delayedTime < 0) return 0;

  // Combine propagation delay with amplitude falloff
  return Math.sin(2 * Math.PI * 440 * delayedTime) / (distance + 1);
});
```

**Result:** As you move away from the source, you hear both the delay and attenuation of the wave.

---

## Advanced Spatial Phenomena

### Interference Patterns

Multiple sources create standing waves:

```javascript
register('interference', s => {
  const { x, y, z } = s.position;

  // Two sound sources at different locations
  const source1 = { x: -2, y: 0, z: 0 };
  const source2 = { x: 2, y: 0, z: 0 };

  // Distance to each source
  const d1 = Math.sqrt(
    (x - source1.x)**2 +
    (y - source1.y)**2 +
    (z - source1.z)**2
  );
  const d2 = Math.sqrt(
    (x - source2.x)**2 +
    (y - source2.y)**2 +
    (z - source2.z)**2
  );

  const freq = 440;
  const c = 343;  // Speed of sound

  // Wave from each source
  const wave1 = Math.sin(2 * Math.PI * (freq * s.t - d1 / c)) / (d1 + 1);
  const wave2 = Math.sin(2 * Math.PI * (freq * s.t - d2 / c)) / (d2 + 1);

  // Interference: constructive and destructive
  return (wave1 + wave2) * 0.5;
});

// Move through the field - hear nodes and antinodes!
```

### Room Modes (Standing Waves)

Simulate the natural resonances of a rectangular room:

```javascript
register('room-mode', s => {
  const { x, y, z } = s.position;

  // Room dimensions (meters)
  const Lx = 10;  // Width
  const Ly = 8;   // Depth
  const Lz = 3;   // Height

  // Mode numbers (which harmonic in each dimension)
  const nx = 1, ny = 1, nz = 0;  // Fundamental mode

  // Modal frequency
  const c = 343;
  const modalFreq = (c / 2) * Math.sqrt(
    (nx / Lx)**2 +
    (ny / Ly)**2 +
    (nz / Lz)**2
  );

  // Spatial pattern (where the mode is loud/quiet)
  const spatial =
    Math.sin(nx * Math.PI * x / Lx) *
    Math.sin(ny * Math.PI * y / Ly) *
    Math.cos(nz * Math.PI * z / Lz);

  // Temporal evolution (how it oscillates in time)
  const temporal = Math.sin(2 * Math.PI * modalFreq * s.t);

  // Room mode = spatial pattern × temporal oscillation
  return spatial * temporal * 0.5;
});

// Walk through the room - hear nodes (quiet spots) and antinodes (loud spots)
```

### Doppler Effect

Frequency shifts when moving through a field:

```javascript
register('doppler', s => {
  const { x, y, z } = s.position;

  // Sound source location
  const sourceX = 0, sourceY = 0, sourceZ = 0;

  // Current distance to source
  const distance = Math.sqrt(
    (x - sourceX)**2 +
    (y - sourceY)**2 +
    (z - sourceZ)**2
  );

  // Velocity towards source (approximate from state history)
  const prevDist = s.state[0] || distance;
  const velocity = (prevDist - distance) / s.dt;
  s.state[0] = distance;

  // Doppler shift
  const c = 343;  // Speed of sound
  const baseFreq = 440;
  const dopplerFreq = baseFreq * (c / (c - velocity));

  // Generate shifted frequency
  s.state[1] = (s.state[1] || 0) + dopplerFreq / s.sr;
  s.state[1] %= 1.0;

  const amplitude = 1 / (distance + 1);
  return Math.sin(s.state[1] * 2 * Math.PI) * amplitude * 0.5;
});

// Move towards/away from source - hear pitch shift!
```

---

## Combining with Other Paradigms

The power of Chora is that it composes with all other paradigms:

### Chora + Kanon

```javascript
// Pure time modulation in spatial field
register('modulated-field', s => {
  const { x, y, z } = s.position;
  const distance = Math.sqrt(x*x + y*y + z*z);

  // Kanon: Pure LFO
  const lfo = Math.sin(2 * Math.PI * 0.5 * s.t);

  // Chora: Spatial amplitude
  const amplitude = (1 / (distance + 1)) * (0.5 + lfo * 0.5);

  return Math.sin(2 * Math.PI * 440 * s.t) * amplitude;
});
```

### Chora + Physis

```javascript
// Physical spring responding to position in field
register('spatial-spring', s => {
  const { x, y, z } = s.position;

  // Physis: Spring oscillator
  const k = 100 + x * 50;  // Spring constant varies with x position
  s.state[0] = s.state[0] || 0.1;
  s.state[1] = s.state[1] || 0;

  const force = -k * s.state[0] - 0.1 * s.state[1];
  s.state[1] += force * s.dt;
  s.state[0] += s.state[1] * s.dt;

  // Chora: Spatial amplitude
  const distance = Math.sqrt(x*x + y*y + z*z);
  return s.state[0] / (distance + 1) * 0.5;
});
```

### Filtering Spatial Fields

**This is unique to Aether** - you can filter a spatial field like any other signal:

```javascript
// Spatial field
const field = s => {
  const { x, y, z } = s.position;
  const dist = Math.sqrt(x*x + y*y + z*z);
  return Math.sin(2 * Math.PI * 440 * s.t) / (dist + 1);
};

// Filter the spatial field!
register('filtered-field',
  pipe(
    field,
    lowpass(800),
    tremolo(3, 0.5),
    gain(0.5)
  )
);
```

---

## Musical Applications

### Spatial Reverb

Simulate a reverberant space with multiple reflections:

```javascript
register('spatial-reverb', s => {
  const { x, y, z } = s.position;
  const source = { x: 0, y: 0, z: 0 };

  let sum = 0;

  // Direct sound
  const directDist = Math.sqrt(x*x + y*y + z*z);
  sum += Math.sin(2 * Math.PI * 440 * s.t) / (directDist + 1);

  // Reflections from walls (simplified)
  const reflections = [
    { x: 10, y: 0, z: 0, damping: 0.7 },   // Right wall
    { x: -10, y: 0, z: 0, damping: 0.7 },  // Left wall
    { x: 0, y: 10, z: 0, damping: 0.6 },   // Back wall
    { x: 0, y: -10, z: 0, damping: 0.6 },  // Front wall
  ];

  for (const wall of reflections) {
    // Distance to wall and back
    const wallDist = Math.sqrt(
      (x - wall.x)**2 +
      (y - wall.y)**2 +
      (z - wall.z)**2
    );
    const reflectDist = directDist + wallDist;
    const delay = reflectDist / 343;

    sum += Math.sin(2 * Math.PI * 440 * (s.t - delay))
           * wall.damping / (reflectDist + 1);
  }

  return sum * 0.2;
});
```

### Spatial Granular Field

Each position in space has different grain density:

```javascript
register('grain-field', s => {
  const { x, y, z } = s.position;

  // Grain density varies with x position
  const grainRate = 20 + Math.abs(x) * 10;  // 20-50 grains/sec
  const grainDur = 0.05;

  const grainPhase = (s.t * grainRate) % 1.0;
  const env = Math.sin(Math.PI * grainPhase);

  // Grain pitch varies with y position
  const freq = 220 + y * 100;

  // Grain amplitude varies with distance
  const distance = Math.sqrt(x*x + y*y + z*z);
  const amplitude = 1 / (distance + 1);

  return Math.sin(2 * Math.PI * freq * s.t) * env * amplitude * 0.3;
});
```

### Waveguide (1D Space)

Simulate a vibrating string or tube in 1D:

```javascript
register('waveguide', s => {
  // Use only x position (1D waveguide)
  const { x } = s.position;
  const length = 1.0;  // 1 meter

  // Fundamental and harmonics
  let sum = 0;
  for (let n = 1; n <= 8; n++) {
    const freq = (n * 343) / (2 * length);  // Harmonic series
    const amplitude = 1 / n;  // Harmonics decay

    // Standing wave pattern
    sum += Math.sin(n * Math.PI * x / length)
           * Math.sin(2 * Math.PI * freq * s.t)
           * amplitude;
  }

  return sum * 0.2;
});
```

---

## Why Spatial Synthesis Matters

Traditional spatialization is **post-processing**. You make sound, then position it.

Spatial synthesis is **generative**. Position determines the sound itself.

This enables:
- ✨ Physically accurate wave propagation
- ✨ Natural interference and room modes
- ✨ Distance-dependent synthesis
- ✨ Exploration through sonic space
- ✨ True wavefield synthesis

**No other live coding system treats space as a first-class synthesis parameter.**

---

## Further Reading

- [Chora Overview](overview.md) - Introduction to the paradigm
- [Wave Physics](../../mathematical-foundations/wave-physics.md) - Mathematical foundations
- [Helpers](../../HELPERS.md) - Using helpers with spatial fields
- [Tesla Longitudinal Waves](../../esoteric/tesla-longitudinal-waves.md) - Esoteric wave theory

---

*"In Chora, you don't hear sounds in space. You hear the space itself."* — Aether
