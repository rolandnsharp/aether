// Bloom — rose curve with crystalline petals
// X-Y mode: tri-wave radius modulates circular motion
const f = 55, k = 3
const petals = tri(s => f * k)
const xSpin = sin(s => f)
const ySpin = sin(s => f + 0.15)
const flutter = sin(s => 0.05)
play('bloom', s => {
  const r = petals(s)
  const b = 0.85 + flutter(s) * 0.1
  const L = r * xSpin(s) * b
  const R = r * ySpin(s) * b
  return [L, R]
})