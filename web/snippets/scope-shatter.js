// Shatter — fractured geometry from square and saw collisions
// X-Y mode: hard edges + linear ramps create broken-glass patterns
const f = 75
const xBox = square(s => f)
const yBox = square(s => f * 7 / 5 + 0.25)
const xSlash = saw(s => f * 3)
const ySlash = saw(s => f * 2)
const crack = sin(s => 0.06)
play('shatter', s => {
  const c = crack(s) * 0.3
  const L = xBox(s) * 0.4 + xSlash(s) * (0.25 + c)
  const R = yBox(s) * 0.4 + ySlash(s) * (0.25 + c)
  return [L, R]
})