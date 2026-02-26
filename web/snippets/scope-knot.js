// Knot — torus knot via ring modulation
// X-Y mode: carrier × modulator weaves orbit crossings
const f = 90
const cx = sin(s => f)
const cy = sin(s => f + 0.4)
const mod = sin(s => f * 2 / 3)
const swell = sin(s => 0.08)
play('knot', s => {
  const depth = 0.55 + swell(s) * 0.15
  const m = (1 - depth) + mod(s) * depth
  const L = cx(s) * m
  const R = cy(s) * m
  return [L, R]
})