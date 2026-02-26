// Guilloche — overlapping roulettes like banknote security engraving
// X-Y mode: two sinusoidal layers crossfade into dense linework
const f = 50
const a1x = sin(s => f),     a1y = sin(s => f * 5/4 + 0.1)
const b1x = sin(s => f * 3), b1y = sin(s => f * 5/4 * 3)
const a2x = sin(s => f * 2), a2y = sin(s => f * 5/4 * 2 + 0.15)
const b2x = sin(s => f * 5), b2y = sin(s => f * 5/4 * 4)
const blend = sin(s => 0.04)
play('guilloche', s => {
  const bl = 0.5 + blend(s) * 0.25
  const L = (a1x(s) * 0.5 + b1x(s) * 0.15) * (1 - bl) + (a2x(s) * 0.4 + b2x(s) * 0.12) * bl
  const R = (a1y(s) * 0.5 + b1y(s) * 0.15) * (1 - bl) + (a2y(s) * 0.4 + b2y(s) * 0.12) * bl
  return [L, R]
})