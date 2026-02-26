// Harmonograph — damped pendulum traces
// X-Y mode: spirals inward as energy decays, then blooms again
const cycle = phasor(s => 1 / 10)
const env = decay(cycle, 4)
const xPend = sin(s => 85)
const yPend = sin(s => 85 * 3 / 2 + 0.3)
const xOver = tri(s => 85 * 2)
const yOver = tri(s => 85 * 3)
play('harmonograph', s => {
  const a = env(s)
  const L = (xPend(s) * 0.7 + xOver(s) * 0.2) * a
  const R = (yPend(s) * 0.7 + yOver(s) * 0.2) * a
  return [L, R]
})