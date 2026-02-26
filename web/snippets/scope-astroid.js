// Astroid — four-pointed star from cubed trigonometry
// X-Y mode: x=cos³(t), y=sin³(t) hypocycloid with slow 2D rotation
const f = 70
const phase = phasor(s => f)
const rot = phasor(s => 0.04)
play('astroid', s => {
  const t = phase(s) * 6.2831
  const r = rot(s) * 6.2831
  const ct = Math.cos(t), st = Math.sin(t)
  const ax = ct * ct * ct
  const ay = st * st * st
  const L = (ax * Math.cos(r) - ay * Math.sin(r)) * 0.75
  const R = (ax * Math.sin(r) + ay * Math.cos(r)) * 0.75
  return [L, R]
})