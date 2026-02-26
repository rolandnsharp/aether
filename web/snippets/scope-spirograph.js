// Spirograph — layered harmonics tracing epitrochoid geometry
// X-Y mode: three sine pairs at odd ratios build gear-tooth loops
const f = 55
const r1x = sin(s => f),       r1y = sin(s => f + 0.3)
const r2x = sin(s => f * 5),   r2y = sin(s => f * 5 + 0.5)
const r3x = sin(s => f * 13),  r3y = sin(s => f * 13 + 0.7)
const breathe = sin(s => 0.06)
play('spirograph', s => {
  const b = breathe(s)
  const L = r1x(s) * 0.55 + r2x(s) * 0.3 + r3x(s) * (0.1 + b * 0.08)
  const R = r1y(s) * 0.55 + r2y(s) * 0.3 + r3y(s) * (0.1 + b * 0.08)
  return [L, R]
})