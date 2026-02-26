// String — plucked string spectrum as standing wave geometry
// X-Y mode: odd harmonics (1,3,5,7) with 1/n amplitudes
const f = 55
const h1x = sin(s => f),     h1y = sin(s => f * 3/2 + 0.15)
const h3x = sin(s => f * 3), h3y = sin(s => f * 3/2 * 3 + 0.3)
const h5x = sin(s => f * 5), h5y = sin(s => f * 3/2 * 5 + 0.4)
const h7x = sin(s => f * 7), h7y = sin(s => f * 3/2 * 7 + 0.5)
const pluck = sin(s => 0.03)
play('string', s => {
  const p = 0.8 + pluck(s) * 0.15
  const L = h1x(s) * 0.5 + h3x(s) * 0.17 * p + h5x(s) * 0.1 * p + h7x(s) * 0.07
  const R = h1y(s) * 0.5 + h3y(s) * 0.17 * p + h5y(s) * 0.1 * p + h7y(s) * 0.07
  return [L, R]
})