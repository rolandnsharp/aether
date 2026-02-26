// Prism — prime-ratio frequencies split light into spectral geometry
// X-Y mode: irreducible ratios (7/3, 11/5, 13/7) create dense, crystalline curves
const f = 60
const x1 = sin(s => f),       y1 = sin(s => f * 3/2 + 0.1)
const x2 = tri(s => f * 7/3), y2 = tri(s => f * 11/5)
const x3 = sin(s => f * 5/2), y3 = sin(s => f * 13/7 + 0.2)
const sparkle = sin(s => 0.07)
play('prism', s => {
  const sp = sparkle(s) * 0.15
  const L = x1(s) * 0.45 + x2(s) * (0.2 + sp) + x3(s) * 0.15
  const R = y1(s) * 0.45 + y2(s) * (0.2 + sp) + y3(s) * 0.15
  return [L, R]
})