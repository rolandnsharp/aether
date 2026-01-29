// src/audio_engine/compiler.js
// ============================================================================
// The "Surgical" Player Generator (Recursive AST Compiler V2)
//
// This version uses a multi-pass approach for robustness and clarity.
// Pass 1: Extract all oscillators and their frequency drivers from the ASTs.
// Pass 2: Generate the calculation code, referencing the pre-identified oscillators.
// ============================================================================

const { ringBuffer } = require('./storage.js');
const STRIDE = ringBuffer.stride;

// ============================================================================
// Pass 1: Oscillator Extraction
// ============================================================================

/**
 * Recursively traverses an AST to find all `sin` nodes (oscillators).
 * @param {object} node - The current AST node.
 * @param {Array<object>} oscillators - An array to collect oscillator definitions.
 */
function _extractOscillators(node, oscillators) {
  if (node.type === 'op' && node.op === 'sin') {
    // Found an oscillator. Add its frequency-driving AST to the list.
    oscillators.push({
      id: oscillators.length, // Stable ID based on discovery order
      freqAst: node.args[0],  // The AST that defines the frequency for this oscillator
    });
  }
  // Recurse into children
  if (node.args) {
    node.args.forEach(arg => _extractOscillators(arg, oscillators));
  }
}

// ============================================================================
// Pass 2: Code Generation
// ============================================================================

/**
 * Recursively generates JavaScript code for a given AST node.
 * @param {object} node - The current AST node.
 * @param {object} context - Compiler context, including the oscillator map.
 * @returns {string} The JavaScript code snippet for this node's calculation.
 */
function _generateNodeCode(node, context) {
  if (node.type === 'param') {
    return 'currentT'; // `t` is available for non-stateful calculations
  }
  if (node.type === 'literal') {
    return node.value.toString();
  }
  if (node.type === 'op') {
    const args = node.args.map(arg => _generateNodeCode(arg, context));
    switch (node.op) {
      case 'add': return `(${args.join(' + ')})`;
      case 'mul': return `(${args.join(' * ')})`;
      case 'pow': return `Math.pow(${args[0]}, ${args[1]})`;
      case 'sin':
        // Find the oscillator ID that corresponds to this exact AST node.
        const osc = context.oscillators.find(o => o.freqAst === node.args[0]);
        if (osc) {
          // This `sin` node is a stateful oscillator.
          // The generated code reads its phase from the global state array.
          return `Math.sin(state[baseIdx + ${osc.id}] * 2 * Math.PI)`;
        }
        // Fallback for complex/unhandled cases (e.g., sin not part of oscillator)
        return `Math.sin(${args[0]})`;
      default:
        context.warnings.push(`Unsupported operator: ${node.op}`);
        return '0';
    }
  }
  context.warnings.push('Unknown AST node type.');
  return '0';
}

// ============================================================================
// Main Compile Function
// ============================================================================

function compile(ast, baseStateIndex) {
  console.log('[Compiler-V2] Compiling N-Dimensional AST...');
  let asts = Array.isArray(ast) ? ast : [ast];
  if (asts.length === 1 && STRIDE > 1) {
    asts = Array(STRIDE).fill(asts[0]);
  }

  // --- Pass 1: Extract All Oscillators ---
  const oscillators = [];
  asts.forEach(channelAst => _extractOscillators(channelAst, oscillators));
  console.log(`[Compiler-V2] Found ${oscillators.length} oscillators.`);

  const context = {
    oscillators,
    warnings: [],
  };

  // --- Generate Phase Update Code ---
  const phaseUpdateCode = oscillators.map(osc => {
    // Generate code for the frequency calculation of this oscillator.
    const freqCode = _generateNodeCode(osc.freqAst, context);
    const deltaCode = `(${freqCode}) / globalThis.SAMPLE_RATE`;
    const phaseIndex = `baseIdx + ${osc.id}`;
    return `state[${phaseIndex}] = (state[${phaseIndex}] + ${deltaCode}) % 1.0;`;
  }).join('\n');

  // --- Pass 2: Generate Calculation Code for each channel ---
  const channelExpressionCodes = asts.map(channelAst => _generateNodeCode(channelAst, context));
  
  // --- Assemble Final Function Body ---
  const generatedFunctionBody = 
    `const state = globalState;\n` +
    `const baseIdx = baseStateIndex;\n` +
    `const currentT = globalThis.CHRONOS * globalThis.dt;\n` +
    `let output = new Array(${STRIDE});\n` +
    // 1. Calculate final output from each channel's expression
    channelExpressionCodes.map((code, i) => `output[${i}] = ${code};`).join('\n') + '\n' +
    // 2. Update all oscillator phases for the next sample
    phaseUpdateCode + '\n' +
    `return output;`;
  
  if (context.warnings.length > 0) {
    console.warn(`[Compiler-V2] Warnings: ${[...new Set(context.warnings)].join('; ')}`);
  }
  console.log(`[Compiler-V2] Generated Function Body:\n`, generatedFunctionBody);

  return new Function('globalState', 'baseStateIndex', 'dt', generatedFunctionBody);
}

module.exports = { compile };