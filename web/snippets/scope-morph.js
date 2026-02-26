// Morph — sequenced Lissajous figures stepping through the harmonic series
// X-Y mode: the pattern reshapes every few seconds
const f = 80, bpm = 0.3
const ratioSeq = wave(bpm, [1, 5/4, 4/3, 3/2, 5/3, 2])
const xOsc = sin(s => f)
const yOsc = sin(s => f * ratioSeq(s) + 0.2)
const detail = sin(s => f * 3)
const shimmer = sin(s => 0.09)
play('morph', s => {
  const sh = shimmer(s) * 0.15
  const L = xOsc(s) * 0.75 + detail(s) * sh
  const R = yOsc(s) * 0.85
  return [L, R]
})