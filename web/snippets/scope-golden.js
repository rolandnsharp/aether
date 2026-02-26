// Golden — frequencies at powers of φ, the most irrational ratio
// X-Y mode: patterns that never close, perpetually drifting
const phi = (1 + Math.sqrt(5)) / 2
const f = 70
const x1 = sin(s => f),             y1 = sin(s => f * phi + 0.1)
const x2 = sin(s => f * phi * phi), y2 = sin(s => f * phi * phi * phi + 0.2)
const bloom = sin(s => 0.03)
play('golden', s => {
  const b = bloom(s) * 0.2
  const L = x1(s) * 0.55 + x2(s) * (0.2 + b)
  const R = y1(s) * 0.55 + y2(s) * (0.2 + b)
  return [L, R]
})