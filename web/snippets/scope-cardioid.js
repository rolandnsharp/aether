// Cardioid — heart curve from cosine self-modulation
// X-Y mode: r = 1+cos(θ) with slow rotation traces a cusp at the origin
const f = 65
const phase = phasor(s => f)
const drift = phasor(s => 0.05)
play('cardioid', s => {
  const t = phase(s) * 6.2831
  const d = drift(s) * 6.2831
  const L = (Math.cos(t + d) + Math.cos(2 * t + d) * 0.5) * 0.55
  const R = (Math.sin(t + d) + Math.sin(2 * t + d) * 0.5) * 0.55
  return [L, R]
})