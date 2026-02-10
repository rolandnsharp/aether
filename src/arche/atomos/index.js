/**
 * Atomos (Air 💨) - Discrete Generative Synthesis
 *
 * Paradigm: f(state, dt) → value
 *
 * Philosophy:
 * Atomos operates in discrete time steps, perfect for:
 * - Generative sequences
 * - L-systems and fractals
 * - Cellular automata
 * - Particle systems
 * - Event-based synthesis
 * - Stochastic processes
 *
 * Unlike Rhythmos (sample-rate locked), Atomos is time-step based
 * and can run at any rate (1Hz, 60fps, audio rate, etc.)
 */

/**
 * Registry for Atomos generators
 */
const generators = new Map();

/**
 * Register an Atomos generator
 *
 * @param {string} name - Generator name
 * @param {Function} fn - Generator function: (state, dt) => value
 * @param {Object} options - Configuration options
 * @returns {Object} Generator instance
 */
export function register(name, fn, options = {}) {
  const generator = {
    name,
    fn,
    options,
    state: options.initialState || {},
  };

  generators.set(name, generator);
  return generator;
}

/**
 * Get a registered generator
 *
 * @param {string} name - Generator name
 * @returns {Object|undefined} Generator instance
 */
export function get(name) {
  return generators.get(name);
}

/**
 * Unregister a generator
 *
 * @param {string} name - Generator name
 * @returns {boolean} Success
 */
export function unregister(name) {
  return generators.delete(name);
}

/**
 * Create a discrete-time generator instance
 *
 * @param {Function} fn - Generator function (state, dt) => value
 * @param {Object} initialState - Initial state
 * @returns {Object} Generator instance with step() method
 */
export function create(fn, initialState = {}) {
  const state = { ...initialState, t: 0 };

  return {
    state,

    /**
     * Step forward in time
     * @param {number} dt - Time delta (in seconds)
     * @returns {*} Generated value
     */
    step(dt = 1/60) {
      const value = fn(state, dt);
      state.t += dt;
      return value;
    },

    /**
     * Reset to initial state
     */
    reset() {
      Object.assign(state, initialState);
      state.t = 0;
    },

    /**
     * Get current state (read-only copy)
     */
    getState() {
      return { ...state };
    }
  };
}

/**
 * Run a generator for N steps
 *
 * @param {Function} fn - Generator function
 * @param {number} steps - Number of steps
 * @param {number} dt - Time delta per step
 * @param {Object} initialState - Initial state
 * @returns {Array} Generated values
 */
export function generate(fn, steps, dt = 1/60, initialState = {}) {
  const gen = create(fn, initialState);
  const values = [];

  for (let i = 0; i < steps; i++) {
    values.push(gen.step(dt));
  }

  return values;
}

/**
 * Convert Atomos generator to audio-rate stream
 *
 * @param {Function} fn - Generator function
 * @param {number} sampleRate - Audio sample rate
 * @param {Object} initialState - Initial state
 * @returns {Function} Audio-rate function (state, idx, sr) => sample
 */
export function toAudioRate(fn, sampleRate = 48000, initialState = {}) {
  const state = { ...initialState, t: 0, lastSample: 0 };

  return (audioState, idx, sr) => {
    const dt = 1 / sr;
    const value = fn(state, dt);
    state.t += dt;
    state.lastSample = value;
    return value;
  };
}

/**
 * Convert Atomos generator to visual-rate stream (60fps)
 *
 * @param {Function} fn - Generator function
 * @param {number} fps - Frames per second
 * @param {Object} initialState - Initial state
 * @returns {Object} Generator with step() method
 */
export function toVisualRate(fn, fps = 60, initialState = {}) {
  return create(fn, initialState);
}

/**
 * Compose multiple generators
 *
 * @param {...Function} generators - Generator functions
 * @returns {Function} Composed generator
 */
export function compose(...generators) {
  return (state, dt) => {
    let result = null;
    for (const gen of generators) {
      result = gen(state, dt);
    }
    return result;
  };
}

/**
 * Map a generator's output
 *
 * @param {Function} fn - Generator function
 * @param {Function} mapper - Mapping function (value, state, dt) => newValue
 * @returns {Function} Mapped generator
 */
export function map(fn, mapper) {
  return (state, dt) => {
    const value = fn(state, dt);
    return mapper(value, state, dt);
  };
}

/**
 * Filter generator output (skip when predicate is false)
 *
 * @param {Function} fn - Generator function
 * @param {Function} predicate - Filter function (value, state, dt) => boolean
 * @returns {Function} Filtered generator
 */
export function filter(fn, predicate) {
  return (state, dt) => {
    const value = fn(state, dt);
    return predicate(value, state, dt) ? value : null;
  };
}

/**
 * Accumulate/fold over time
 *
 * @param {Function} fn - Generator function
 * @param {Function} reducer - (acc, value, state, dt) => newAcc
 * @param {*} initial - Initial accumulator value
 * @returns {Function} Accumulating generator
 */
export function fold(fn, reducer, initial) {
  return (state, dt) => {
    if (!state.__acc) state.__acc = initial;
    const value = fn(state, dt);
    state.__acc = reducer(state.__acc, value, state, dt);
    return state.__acc;
  };
}

/**
 * Take only N values from generator
 *
 * @param {Function} fn - Generator function
 * @param {number} n - Number of values to take
 * @returns {Function} Limited generator
 */
export function take(fn, n) {
  return (state, dt) => {
    if (!state.__count) state.__count = 0;
    if (state.__count >= n) return null;
    state.__count++;
    return fn(state, dt);
  };
}

/**
 * Repeat a pattern indefinitely
 *
 * @param {Array} pattern - Pattern to repeat
 * @returns {Function} Repeating generator
 */
export function cycle(pattern) {
  return (state, dt) => {
    if (!state.__idx) state.__idx = 0;
    const value = pattern[state.__idx % pattern.length];
    state.__idx++;
    return value;
  };
}

/**
 * Random choice from array
 *
 * @param {Array} choices - Possible values
 * @returns {Function} Random generator
 */
export function choose(choices) {
  return (state, dt) => {
    return choices[Math.floor(Math.random() * choices.length)];
  };
}

/**
 * Weighted random choice
 *
 * @param {Array} weightedChoices - [{value, weight}, ...]
 * @returns {Function} Weighted random generator
 */
export function weighted(weightedChoices) {
  const totalWeight = weightedChoices.reduce((sum, c) => sum + c.weight, 0);

  return (state, dt) => {
    let rand = Math.random() * totalWeight;
    for (const choice of weightedChoices) {
      rand -= choice.weight;
      if (rand <= 0) return choice.value;
    }
    return weightedChoices[weightedChoices.length - 1].value;
  };
}

/**
 * Markov chain generator
 *
 * @param {Object} transitions - {state: [{next, probability}, ...]}
 * @param {string} initialState - Starting state
 * @returns {Function} Markov generator
 */
export function markov(transitions, initialState) {
  return (state, dt) => {
    if (!state.__markovState) state.__markovState = initialState;

    const currentState = state.__markovState;
    const choices = transitions[currentState] || [];

    if (choices.length === 0) return currentState;

    let rand = Math.random();
    for (const choice of choices) {
      rand -= choice.probability;
      if (rand <= 0) {
        state.__markovState = choice.next;
        return choice.next;
      }
    }

    return currentState;
  };
}

/**
 * L-System generator
 *
 * @param {Object} rules - {symbol: replacement}
 * @param {string} axiom - Starting string
 * @param {number} iterations - Number of iterations per step
 * @returns {Function} L-System generator
 */
export function lsystem(rules, axiom, iterations = 1) {
  return (state, dt) => {
    if (!state.__lsystemString) state.__lsystemString = axiom;

    let result = state.__lsystemString;

    for (let i = 0; i < iterations; i++) {
      let next = '';
      for (const char of result) {
        next += rules[char] || char;
      }
      result = next;
    }

    state.__lsystemString = result;
    return result;
  };
}

// Export all functions as Atomos namespace
export const Atomos = {
  register,
  get,
  unregister,
  create,
  generate,
  toAudioRate,
  toVisualRate,
  compose,
  map,
  filter,
  fold,
  take,
  cycle,
  choose,
  weighted,
  markov,
  lsystem,
};

export default Atomos;
