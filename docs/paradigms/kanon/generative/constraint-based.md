[Home](../Home.md) > [Generative Music](#) > Constraint-Based

# Constraint-Based Musical Composition: Symbolic AI for Live Coding

## Overview

This document explores **constraint satisfaction problems (CSP)** applied to musical composition - a form of symbolic AI that predates neural networks and has deep roots in Lisp/functional programming tradition.

Instead of training models on data, we define **logical rules and relationships** that music must satisfy, then use search algorithms to find solutions. This is how AI worked from 1960-1990, and it's particularly elegant for mathematical music.

---

## What is Constraint-Based Composition?

### The Basic Idea

**Traditional composition:**
```javascript
// You manually specify every note
const melody = [220, 247, 277, 330, 370, 415, 440];
```

**Constraint-based composition:**
```javascript
// You specify WHAT you want, not HOW
const constraints = {
  scale: 'A minor',
  harmonicRelation: 'only primes',
  goldenRatio: true,
  length: 16
};

const melody = solve(constraints);  // AI finds satisfying solution
```

You describe the **properties** music should have, and the solver finds notes that satisfy all constraints.

### Real-World Example

**Problem:** "Create a melody where:
- Each note is a prime harmonic of 110 Hz
- Adjacent notes have golden ratio relationship
- Follows natural minor scale"

**Human approach:** Trial and error, takes hours

**Constraint solver:** Systematic search, finds solution in milliseconds

---

## Historical Context: Lisp, AI, and Music

### The Lisp Connection

**Why this matters for your Signal project:**

1. **Lisp invented for AI** (John McCarthy, 1958)
   - Symbolic reasoning
   - Code as data (homoiconicity)
   - Recursive problem solving

2. **Your code is already Lisp-influenced:**
   ```javascript
   // Y-combinator (pure λ-calculus)
   const Y = f => (x => f(y => x(x)(y)))(x => f(y => x(x)(y)));

   // This IS the foundation of functional AI
   // Church encoding, recursion theory
   ```

3. **Functional programming = AI-friendly:**
   - Pure functions (no side effects)
   - Composability
   - Recursive search naturally expressed

### Classic AI Music Systems

**1. CHORAL (Ebcioglu, 1988)** - Bach chorale harmonization
- 350+ rules encoding music theory
- Constraint logic programming
- Generated indistinguishable-from-Bach harmonies

**2. OpenMusic (IRCAM, 1990s)** - Visual Lisp for composition
```lisp
; Real OpenMusic code
(om-loop
  for pitch in (arithm-ser 60 12 1)
  when (prime? pitch)
  collect (make-note pitch 500))
```

**3. PWConstraints (Sandred, 2000s)** - Powerful CSP for music
- Composers specify high-level intentions
- System finds concrete note sequences

---

## Mathematical Foundation

### Constraint Satisfaction Problems (CSP)

A CSP consists of:

1. **Variables:** Musical elements to determine
   ```javascript
   variables = [note1, note2, note3, note4];
   ```

2. **Domains:** Possible values for each variable
   ```javascript
   domain = {
     note1: [110, 220, 330, 440],  // Allowed frequencies
     note2: [110, 220, 330, 440],
     // ...
   };
   ```

3. **Constraints:** Rules that must be satisfied
   ```javascript
   constraints = [
     (n1, n2) => isPrimeRatio(n1, n2),
     (n1, n2) => isConsonant(n1, n2),
     (n1, n2, n3) => formsTonic(n1, n2, n3)
   ];
   ```

### Search Algorithms

**Backtracking Search** (classic AI technique):

```
function BACKTRACK(assignment, csp):
  if assignment is complete:
    return assignment

  var = SELECT-UNASSIGNED-VARIABLE(csp)

  for each value in ORDER-DOMAIN-VALUES(var, csp):
    if value is consistent with assignment:
      add {var = value} to assignment
      result = BACKTRACK(assignment, csp)

      if result ≠ failure:
        return result

      remove {var = value} from assignment

  return failure
```

**This is recursive search** - perfect for functional programming!

### Heuristics (Smart Search)

**1. Variable Selection:**
- **MRV** (Minimum Remaining Values) - choose variable with fewest legal values
- **Degree heuristic** - choose variable involved in most constraints

**2. Value Ordering:**
- **Least Constraining Value** - choose value that rules out fewest choices

**3. Constraint Propagation:**
- **Forward Checking** - eliminate inconsistent values early
- **Arc Consistency** - ensure all constraint arcs are satisfied

---

## Musical Constraints: A Catalog

### Harmonic Constraints

**1. Scale Membership**
```javascript
const scaleConstraint = (note, scale) => scale.includes(note % 12);

// Ensures all notes in A minor: [A, B, C, D, E, F, G]
```

**2. Consonance**
```javascript
const consonanceConstraint = (note1, note2) => {
  const interval = Math.abs(note1 - note2) % 12;
  return [0, 3, 4, 5, 7, 8, 9, 12].includes(interval); // Consonant intervals
};
```

**3. Prime Harmonic Relationships**
```javascript
const primeHarmonicConstraint = (fundamental, harmonic) => {
  const ratio = harmonic / fundamental;
  return isPrime(ratio); // Only 2, 3, 5, 7, 11, 13...
};
```

**4. Golden Ratio (φ = 1.618...)**
```javascript
const goldenRatioConstraint = (freq1, freq2) => {
  const ratio = freq2 / freq1;
  return Math.abs(ratio - 1.618) < 0.01; // Within tolerance
};
```

### Melodic Constraints

**5. Contour (Shape)**
```javascript
const contourConstraint = (notes, targetContour) => {
  const actualContour = notes.map((n, i) =>
    i === 0 ? 0 : Math.sign(n - notes[i-1])
  );
  return arraysEqual(actualContour, targetContour);
};

// Example: [0, +1, +1, -1, 0, +1] = ascending then descending
```

**6. Maximum Leap**
```javascript
const maxLeapConstraint = (note1, note2, maxSemitones) => {
  return Math.abs(note2 - note1) <= maxSemitones;
};
```

**7. No Repetition**
```javascript
const noRepetitionConstraint = (note1, note2) => note1 !== note2;
```

### Rhythmic Constraints

**8. Total Duration**
```javascript
const durationConstraint = (durations, totalBeats) => {
  return durations.reduce((sum, d) => sum + d, 0) === totalBeats;
};
```

**9. Euclidean Rhythm**
```javascript
const euclideanConstraint = (hits, total) => {
  // Distribute hits evenly across total steps (Björk's algorithm)
  return generateEuclideanRhythm(hits, total);
};
```

### Tesla/Physics Constraints

**10. Quarter-Wave Modes (Odd Harmonics Only)**
```javascript
const quarterWaveConstraint = (fundamental, harmonics) => {
  return harmonics.every(h => {
    const ratio = h / fundamental;
    return ratio % 2 === 1; // 1, 3, 5, 7, 9...
  });
};
```

**11. Fourier Completeness**
```javascript
const fourierConstraint = (harmonics, minCount) => {
  // Ensure enough harmonics for rich spectrum
  return harmonics.length >= minCount;
};
```

### Meta-Constraints (Constraints on Constraints)

**12. Minimal Tension**
```javascript
const tensionConstraint = (notes) => {
  const dissonance = calculateDissonance(notes);
  return dissonance < threshold;
};
```

**13. Maximal Surprise (Information Theory)**
```javascript
const entropyConstraint = (notes) => {
  const entropy = calculateEntropy(notes);
  return entropy > minEntropy; // Want unpredictability
};
```

---

## Implementation: Functional Constraint Solver

### Basic Structure

```javascript
// constraint-solver.js
const { Y } = require('../src/functional');

class ConstraintSolver {
  constructor(variables, domains, constraints) {
    this.variables = variables;
    this.domains = domains;
    this.constraints = constraints;
  }

  // Backtracking search (recursive, Lisp-style)
  solve() {
    return this.backtrack({});
  }

  backtrack = Y(recurse => (assignment) => {
    // Base case: complete assignment
    if (this.isComplete(assignment)) {
      return assignment;
    }

    // Choose unassigned variable (heuristic: MRV)
    const variable = this.selectUnassignedVariable(assignment);

    // Try each value in domain (heuristic: LCV)
    for (const value of this.orderDomainValues(variable, assignment)) {
      if (this.isConsistent(variable, value, assignment)) {
        // Recursive descent
        const newAssignment = { ...assignment, [variable]: value };
        const result = recurse(newAssignment);

        if (result !== null) {
          return result; // Solution found!
        }
        // Implicit backtrack (try next value)
      }
    }

    return null; // No solution
  });

  isComplete(assignment) {
    return Object.keys(assignment).length === this.variables.length;
  }

  selectUnassignedVariable(assignment) {
    // MRV heuristic: choose variable with smallest domain
    const unassigned = this.variables.filter(v => !(v in assignment));

    return unassigned.reduce((best, variable) => {
      const domainSize = this.getRemainingDomain(variable, assignment).length;
      const bestSize = this.getRemainingDomain(best, assignment).length;
      return domainSize < bestSize ? variable : best;
    });
  }

  orderDomainValues(variable, assignment) {
    // LCV heuristic: least constraining value first
    const domain = this.getRemainingDomain(variable, assignment);

    return domain.sort((a, b) => {
      const aConstrains = this.countConstrainedValues(variable, a, assignment);
      const bConstrains = this.countConstrainedValues(variable, b, assignment);
      return aConstrains - bConstrains;
    });
  }

  isConsistent(variable, value, assignment) {
    // Check all constraints involving this variable
    return this.constraints.every(constraint =>
      constraint.isSatisfied(variable, value, assignment)
    );
  }

  getRemainingDomain(variable, assignment) {
    // Forward checking: eliminate inconsistent values
    return this.domains[variable].filter(value =>
      this.isConsistent(variable, value, assignment)
    );
  }

  countConstrainedValues(variable, value, assignment) {
    // How many future options does this choice eliminate?
    const tempAssignment = { ...assignment, [variable]: value };
    let count = 0;

    for (const otherVar of this.variables) {
      if (!(otherVar in tempAssignment)) {
        const before = this.domains[otherVar].length;
        const after = this.getRemainingDomain(otherVar, tempAssignment).length;
        count += (before - after);
      }
    }

    return count;
  }
}

// Constraint class
class Constraint {
  constructor(variables, predicate) {
    this.variables = variables;  // Which variables does this involve?
    this.predicate = predicate;  // Function that returns true/false
  }

  isSatisfied(variable, value, assignment) {
    // Only check if all involved variables are assigned
    const allAssigned = this.variables.every(v =>
      v === variable || v in assignment
    );

    if (!allAssigned) return true; // Can't check yet

    // Get values for all variables
    const values = this.variables.map(v =>
      v === variable ? value : assignment[v]
    );

    return this.predicate(...values);
  }
}

module.exports = { ConstraintSolver, Constraint };
```

---

## Example: Generate Prime Harmonic Melody

```javascript
const { ConstraintSolver, Constraint } = require('./constraint-solver');
const { scales, freq } = require('../src/index');

// Helper: check if ratio is prime
function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) return false;
  }
  return true;
}

// Define the problem
function generatePrimeMelody() {
  // Variables: 8 notes in the melody
  const variables = ['note0', 'note1', 'note2', 'note3',
                     'note4', 'note5', 'note6', 'note7'];

  // Domain: frequencies in A minor scale
  const fundamentals = [110, 220, 330, 440];
  const domains = {};
  variables.forEach(v => {
    domains[v] = fundamentals;
  });

  // Constraints
  const constraints = [
    // 1. Adjacent notes have prime harmonic relationship
    ...variables.slice(0, -1).map((v, i) =>
      new Constraint([v, variables[i + 1]], (f1, f2) => {
        const ratio = Math.max(f1, f2) / Math.min(f1, f2);
        return isPrime(Math.round(ratio)) || Math.abs(ratio - 1) < 0.01;
      })
    ),

    // 2. No consecutive repetitions
    ...variables.slice(0, -1).map((v, i) =>
      new Constraint([v, variables[i + 1]], (f1, f2) => f1 !== f2)
    ),

    // 3. Start and end on tonic (110 Hz)
    new Constraint(['note0'], f => f === 110),
    new Constraint(['note7'], f => f === 110),

    // 4. Maximum leap (one octave)
    ...variables.slice(0, -1).map((v, i) =>
      new Constraint([v, variables[i + 1]], (f1, f2) =>
        Math.max(f1, f2) / Math.min(f1, f2) <= 2
      )
    )
  ];

  // Solve!
  const solver = new ConstraintSolver(variables, domains, constraints);
  return solver.solve();
}

// Use in performance
const solution = generatePrimeMelody();
console.log('Generated melody:', solution);

// Output might be:
// { note0: 110, note1: 220, note2: 330, note3: 220,
//   note4: 110, note5: 330, note6: 220, note7: 110 }

// Convert to Signal synthesis
const melody = Object.values(solution);
kanon('prime-melody', t => {
  const rate = 2; // 2 notes per second
  const index = Math.floor(t * rate) % melody.length;
  const phase = (t * rate) % 1;
  const freq = melody[index];

  return Math.sin(2 * Math.PI * freq * t) * Math.exp(-phase * 4);
});
```

---

## Advanced: Golden Ratio Chord Progression

```javascript
function generateGoldenChordProgression() {
  const φ = 1.618033988749;

  // Variables: 4 chords, each chord has 3 notes
  const chordVars = ['c0n0', 'c0n1', 'c0n2',  // Chord 0
                     'c1n0', 'c1n1', 'c1n2',  // Chord 1
                     'c2n0', 'c2n1', 'c2n2',  // Chord 2
                     'c3n0', 'c3n1', 'c3n2']; // Chord 3

  // Domain: natural minor scale frequencies
  const baseFreqs = [110, 123.5, 130.8, 146.8, 164.8, 174.6, 196];
  const domains = {};
  chordVars.forEach(v => {
    domains[v] = baseFreqs;
  });

  const constraints = [
    // 1. Within each chord: notes form triads
    ...[0, 1, 2, 3].map(c =>
      new Constraint(
        [`c${c}n0`, `c${c}n1`, `c${c}n2`],
        (f1, f2, f3) => {
          // Check if forms valid minor triad
          const sorted = [f1, f2, f3].sort((a, b) => a - b);
          const i1 = freqToSemitone(sorted[1] / sorted[0]);
          const i2 = freqToSemitone(sorted[2] / sorted[1]);
          return (i1 === 3 && i2 === 4) || // Minor triad
                 (i1 === 4 && i2 === 3);    // Major triad
        }
      )
    ),

    // 2. Between chords: root notes have golden ratio relationship
    ...[0, 1, 2].map(c =>
      new Constraint(
        [`c${c}n0`, `c${c+1}n0`],
        (f1, f2) => {
          const ratio = f2 / f1;
          return Math.abs(ratio - φ) < 0.1 ||
                 Math.abs(ratio - (1/φ)) < 0.1;
        }
      )
    ),

    // 3. First and last chord same (cyclical)
    ...[0, 1, 2].map(n =>
      new Constraint(
        [`c0n${n}`, `c3n${n}`],
        (f1, f2) => f1 === f2
      )
    )
  ];

  const solver = new ConstraintSolver(chordVars, domains, constraints);
  return solver.solve();
}

function freqToSemitone(ratio) {
  return Math.round(12 * Math.log2(ratio));
}
```

---

## Integration with Signal Library

### Add to Signal API

```javascript
// src/index.js

const { ConstraintSolver, Constraint } = require('./ai/constraint-solver');

// New Signal method
signal.constrain = function(constraints) {
  return new ConstraintComposer(constraints);
};

class ConstraintComposer {
  constructor(constraints) {
    this.constraints = constraints;
    this.solution = null;
  }

  solve() {
    // Convert high-level constraints to CSP
    const csp = this.buildCSP();
    this.solution = csp.solve();
    return this;
  }

  toSignal(name) {
    if (!this.solution) this.solve();

    // Convert solution to Signal synthesis function
    const melody = Object.values(this.solution);

    return kanon(name, t => {
      const rate = this.constraints.tempo || 2;
      const index = Math.floor(t * rate) % melody.length;
      const phase = (t * rate) % 1;
      const freq = melody[index];

      return oddHarmonics(freq, t, 5) * env.exp(phase, 4);
    });
  }

  buildCSP() {
    // Build variables, domains, constraints from high-level spec
    // ... implementation details ...
  }
}

// Usage
signal.constrain({
  length: 16,
  scale: scales.minor,
  baseFreq: 220,
  harmonicRelation: 'prime',
  goldenRatio: true
}).solve().toSignal('ai-melody');
```

---

## Performance Considerations

### Complexity

**Worst case:** O(d^n) where:
- d = domain size
- n = number of variables

**Example:**
- 8 notes
- 10 possible frequencies each
- 10^8 = 100 million possible melodies

**With heuristics:** Often reduces to 10^3 or less checks!

### Optimization Strategies

**1. Pre-compute Compatible Values**
```javascript
// Build lookup table of compatible note pairs
const compatible = {};
for (const n1 of domain) {
  compatible[n1] = domain.filter(n2 => isPrimeRatio(n1, n2));
}
```

**2. Constraint Ordering**
```javascript
// Check cheapest constraints first
constraints.sort((a, b) => a.cost - b.cost);
```

**3. Parallel Search**
```javascript
// Try multiple starting points in parallel
const solutions = await Promise.all(
  startingPoints.map(start => solver.solve(start))
);
```

**4. Incremental Solving**
```javascript
// Solve first 4 notes, then extend
const partial = solver.solve({ maxVariables: 4 });
const full = solver.extend(partial, 8);
```

---

## Live Coding Workflow

### Preparation (Before Performance)

```javascript
// Generate solution space offline
const solutions = [];
for (let i = 0; i < 100; i++) {
  const constraints = randomizeConstraints();
  const solution = solver.solve(constraints);
  if (solution) solutions.push(solution);
}

// Save for live use
fs.writeFileSync('solution-space.json', JSON.stringify(solutions));
```

### During Performance

```javascript
// Load pre-computed solutions
const solutions = JSON.parse(fs.readFileSync('solution-space.json'));

// Navigate solution space in real-time
let currentIndex = 0;

kanon('live-ai', t => {
  const solution = solutions[currentIndex];
  const melody = Object.values(solution);
  // ... synthesis ...
});

// MIDI controller or keyboard changes currentIndex
// No computation during performance - instant!
```

---

## Philosophical Implications

### Symbolic AI vs. Neural Networks

**Symbolic AI (Constraint Solving):**
- ✅ **Explainable:** You know WHY a solution works
- ✅ **Deterministic:** Same constraints → same solution
- ✅ **Controllable:** Precisely specify what you want
- ✅ **Musical theory:** Encodes actual music knowledge
- ❌ **Manual encoding:** Someone must define rules

**Neural Networks:**
- ✅ **Learn patterns:** From data, not rules
- ✅ **Emergent behavior:** Discover non-obvious patterns
- ❌ **Black box:** Can't explain decisions
- ❌ **Unpredictable:** May generate nonsense
- ❌ **Training required:** Need large datasets

**For live performance:** Symbolic AI is SAFER and more MUSICAL

### The Lisp Philosophy

**"Code is Data, Data is Code"**

In constraint-based composition:
```javascript
// Musical constraints ARE the composition
const composition = {
  constraints: [
    isPrime,
    isConsonant,
    hasGoldenRatio
  ]
};

// The constraint system generates the actual notes
// The PROCESS is the art, not just the OUTPUT
```

This is very Lisp: **programs that write programs**.

---

## Further Reading

### Papers

1. **"CHORAL: An Expert System for Harmonic Analysis"** - Ebcioglu (1988)
   - Classic constraint-based Bach harmonization

2. **"Constraint Programming Systems for Modeling Music Theories"** - Laurson & Kuusk (2009)
   - Modern overview of CSP in music

3. **"Composing Music with Constraint Programming"** - Pachet & Roy (2001)
   - Musical constraint satisfaction in practice

### Books

1. **"Artificial Intelligence: A Modern Approach"** - Russell & Norvig
   - Chapter 6: Constraint Satisfaction Problems

2. **"The Art of Prolog"** - Sterling & Shapiro
   - Logic programming for constraints

3. **"Readings in Music and Artificial Intelligence"** - Roads (1992)
   - Historical context of AI music research

### Software

1. **OpenMusic** - http://repmus.ircam.fr/openmusic/
   - Visual Lisp for composition (free)

2. **PWConstraints** - http://www.sapp.org/
   - Powerful CSP library for music

3. **MiniZinc** - https://www.minizinc.org/
   - General constraint modeling language

---

## Next Steps

Want to implement this in Signal? Here's the roadmap:

**Phase 1: Basic Solver** (4-6 hours)
- [ ] Implement ConstraintSolver class
- [ ] Backtracking search with Y-combinator
- [ ] Basic heuristics (MRV, LCV)

**Phase 2: Musical Constraints** (2-3 hours)
- [ ] Scale membership
- [ ] Prime harmonic relationships
- [ ] Golden ratio
- [ ] Consonance rules

**Phase 3: Integration** (2-3 hours)
- [ ] `signal.constrain()` API
- [ ] Convert solutions to synthesis
- [ ] Pre-computation for live use

**Phase 4: Documentation** (1-2 hours)
- [ ] Examples and tutorials
- [ ] Performance benchmarks
- [ ] Best practices guide

**Total:** ~10-14 hours for full implementation

---

## Conclusion

Constraint-based composition is:
- **True AI** (symbolic reasoning, not just pattern matching)
- **Musically intelligent** (encodes actual theory)
- **Performance-safe** (deterministic, fast)
- **Functionally elegant** (recursive search, pure functions)
- **Historically rich** (Lisp tradition, McCarthy's vision)

It's a perfect fit for your Signal project: **mathematical, functional, and profound**.

Ready to build this? 🎵🤖

---

**Document Version:** 1.0
**Last Updated:** January 2026
**Author:** Signal Project
**License:** ISC
