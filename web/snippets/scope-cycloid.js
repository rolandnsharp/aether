// Cycloid — epicycloid with k = π−1, an irrational gear ratio
// X-Y mode: the curve never closes, tracing a perpetual near-miss orbit
const f = 60
const k = Math.PI - 1
const phase = phasor(s => f)
const rot = phasor(s => 0.03)
play('cycloid', s => {
  const t = phase(s) * 6.2831
  const r = rot(s) * 6.2831
  const norm = 1 / (k + 2)
  const L = ((k + 1) * Math.cos(t + r) - Math.cos((k + 1) * t + r)) * norm * 0.85
  const R = ((k + 1) * Math.sin(t + r) - Math.sin((k + 1) * t + r)) * norm * 0.85
  return [L, R]
})