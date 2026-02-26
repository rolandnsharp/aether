// Fabric — woven texture from pulse-width modulation
// X-Y mode: PWM rectangles morph as duty cycle sweeps — classic synth pad
const f = 60
const xWarp = pulse(s => f, s => 0.3 + Math.sin(s.t * 0.15) * 0.2)
const yWeft = pulse(s => f * 3/2, s => 0.5 + Math.sin(s.t * 0.12) * 0.25)
const xThread = sin(s => f * 2 + 0.3)
const yThread = sin(s => f * 3 + 0.4)
play('fabric', s => {
  const L = xWarp(s) * 0.45 + xThread(s) * 0.25
  const R = yWeft(s) * 0.45 + yThread(s) * 0.25
  return [L, R]
})