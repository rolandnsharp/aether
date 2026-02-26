// Aurora — shimmering ribbons with feedback echo trails
// X-Y mode: delay feedback smears the trace into ghostly streams
const f = 50
const x = sin(s => f)
const y = sin(s => f * 8 / 5 + 0.15)
const xHi = tri(s => f * 3)
const yHi = tri(s => f * 8 / 5 * 2)
const sway = sin(s => 0.04)
const raw = s => {
  const sw = sway(s) * 0.2
  return [x(s) * 0.6 + xHi(s) * (0.2 + sw), y(s) * 0.6 + yHi(s) * (0.2 + sw)]
}
play('aurora', pipe(
  raw,
  signal => feedback(signal, 0.3, s => 0.08 + Math.sin(s.t * 0.1) * 0.04, 0.35)
))