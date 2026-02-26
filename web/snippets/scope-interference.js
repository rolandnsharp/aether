// Interference — moiré beating from near-unison oscillator clusters
// X-Y mode: close frequencies create shimmering interference fringes
const f = 80
const x1 = sin(s => f), x2 = sin(s => f * 1.01), x3 = sin(s => f * 0.99)
const x4 = sin(s => f * 1.005), x5 = sin(s => f * 0.995)
const y1 = sin(s => f * 3/2), y2 = sin(s => f * 3/2 * 1.008)
const y3 = sin(s => f * 3/2 * 0.992), y4 = sin(s => f * 3/2 * 1.003)
play('interference', s => {
  const L = (x1(s) + x2(s) + x3(s) + x4(s) + x5(s)) * 0.18
  const R = (y1(s) + y2(s) + y3(s) + y4(s)) * 0.22
  return [L, R]
})