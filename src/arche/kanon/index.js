// src/arche/kanon/index.js - The Kanon Paradigm (Abstract Ideal)
// ============================================================================
// "The Abstract Ideal" - Fire 🔥
// ============================================================================
// Pure functions of time: f(t) → [samples...]
// Simple, beautiful, but subject to discontinuities on hot-reload.
// Perfect for mathematical demonstrations, generative compositions, and
// use as modulation sources for other paradigms.
// ============================================================================

import { registry } from '../../aether.js';
import * as helpers from './helpers.js';

// ============================================================================
// Core Registration Function
// ============================================================================

/**
 * Register a Kanon signal (pure function of time).
 * @param {string} id - Unique identifier for this signal.
 * @param {Function} ft_function - (t) => sample - A pure function of time.
 * @returns {Object} - The signal object.
 */
function register(id, ft_function) {
  // Wrap f(t) in the standard signal interface
  // The mixer will pass context with { t, dt, sampleRate }
  const signal = {
    update: (context) => {
      const sample = ft_function(context.t);
      return [sample]; // Return as mono
    }
  };

  registry.set(id, signal);
  console.log(`[KANON] Registered signal: "${id}"`);

  return signal;
}

// ============================================================================
// Kanon Namespace Export
// ============================================================================

export const Kanon = {
  register,
  ...helpers  // All pure functional utilities
};
