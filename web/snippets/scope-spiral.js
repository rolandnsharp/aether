// Spiral — Archimedean spiral with harmonic detail
// X-Y mode: radius grows linearly, 3rd harmonic emerges in outer rings
const f = 75
const phase = phasor(s => f)
const hPhase = phasor(s => f * 3)
const spiral = phasor(s => 1 / 6)
play('spiral', s => {
  const t = phase(s) * 6.2831
  const h = hPhase(s) * 6.2831
  const r = spiral(s) * 0.7
  const L = r * Math.cos(t) + r * r * Math.cos(h) * 0.3
  const R = r * Math.sin(t) + r * r * Math.sin(h) * 0.3
  return [L, R]
})