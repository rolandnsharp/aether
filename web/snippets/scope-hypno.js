// Hypno — concentric pulsing rings
// X-Y mode: amplitude pulsing draws rings at different radii on the phosphor
const f = 90
const x1 = sin(s => f), y1 = sin(s => f + 0.5)
const x2 = sin(s => f * 2), y2 = sin(s => f * 2 + 0.7)
const pulse = sin(s => 1.5)
const drift = sin(s => 0.02)
play('hypno', s => {
  const r = 0.4 + Math.abs(pulse(s)) * 0.45
  const d = drift(s) * 0.12
  const L = x1(s) * r + x2(s) * d
  const R = y1(s) * r + y2(s) * d
  return [L, R]
})