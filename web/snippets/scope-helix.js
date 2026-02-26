// Helix — 3D figure-eight with slowly rotating viewpoint
// X-Y mode: a spatial curve projected through evolving angles
const f = 80
const phase = phasor(s => f)
const zPhase = phasor(s => f * 2)
const rot = phasor(s => 0.07)
play('helix', s => {
  const p = phase(s) * 6.2831
  const z = Math.sin(zPhase(s) * 6.2831) * 0.4
  const r = rot(s) * 6.2831
  const x = Math.sin(p) * 0.7
  const y = Math.cos(p) * 0.7
  const L = x * Math.cos(r) + z * Math.sin(r)
  const R = y + z * Math.cos(r) * 0.3
  return [L, R]
})