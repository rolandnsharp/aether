// Chebyshev — polynomial waveshaping multiplies harmonic lobes
// X-Y mode: T₃ polynomial triples the lobe count as morph sweeps
const f = 70
const x = sin(s => f)
const y = sin(s => f * 3 / 2 + 0.2)
const morph = sin(s => 0.05)
play('chebyshev', s => {
  const xv = x(s), yv = y(s)
  const m = 0.5 + morph(s) * 0.3
  const t3x = 4 * xv * xv * xv - 3 * xv
  const t3y = 4 * yv * yv * yv - 3 * yv
  const L = xv * (1 - m) + t3x * m
  const R = yv * (1 - m) + t3y * m
  return [L * 0.8, R * 0.8]
})