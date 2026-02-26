// Kepler — elliptical orbit with non-uniform angular velocity
// X-Y mode: beam accelerates through periapsis, lingers at apoapsis
const f = 65
play('kepler', s => {
  if (!s.state[4]) s.state[4] = 0
  const ecc = 0.35 + Math.sin(s.t * 0.04) * 0.1
  const r = (1 - ecc * ecc) / (1 + ecc * Math.cos(s.state[4]))
  s.state[4] += f * 6.2831 / (r * r * s.sr)
  const L = r * Math.cos(s.state[4]) * 0.75
  const R = r * Math.sin(s.state[4]) * 0.75
  return [L, R]
})