// ============================================================================
// FUNCTIONAL PROGRAMMING UTILITIES
// ============================================================================
// Pure function composition helpers for wave

/**
 * Compose functions left to right (data flows left → right)
 * pipe(f, g, h)(x) === h(g(f(x)))
 */
const pipe = (...fns) => x => fns.reduce((acc, fn) => fn(acc), x);

/**
 * Compose functions right to left (traditional math notation)
 * compose(f, g, h)(x) === f(g(h(x)))
 */
const compose = (...fns) => x => fns.reduceRight((acc, fn) => fn(acc), x);

/**
 * Identity function (useful for no-ops)
 */
const identity = x => x;

/**
 * Constant function (always returns the same value)
 */
const constant = x => () => x;

/**
 * Curry a function with 2 parameters
 */
const curry2 = fn => a => b => fn(a, b);

/**
 * Curry a function with 3 parameters
 */
const curry3 = fn => a => b => c => fn(a, b, c);

export {
  pipe,
  compose,
  identity,
  constant,
  curry2,
  curry3
};
