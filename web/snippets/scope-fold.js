// Fold — kaleidoscope geometry via wavefolding
// X-Y mode: fold multiplies visual symmetry as drive sweeps
const fX = 70, fY = fX * 5 / 4
const x = sin(s => fX)
const y = sin(s => fY + 0.2)
const xHarm = sin(s => fX * 3)
const yHarm = sin(s => fY * 2)
const sweep = sin(s => 0.04)
const raw = s => {
  const L = x(s) * 0.7 + xHarm(s) * 0.3
  const R = y(s) * 0.7 + yHarm(s) * 0.3
  return [L, R]
}
play('fold-art', fold(raw, s => 2.5 + sweep(s) * 1.5))