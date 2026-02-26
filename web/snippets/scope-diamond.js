// Diamond — angular facets from saw and triangle waves
// X-Y mode: linear ramps create sharp-edged crystalline geometry
const f = 65
const xEdge = saw(s => f)
const yEdge = saw(s => f * 4 / 3 + 0.3)
const xFacet = tri(s => f * 2)
const yFacet = tri(s => f * 3)
const polish = sin(s => 0.04)
play('diamond', s => {
  const p = polish(s) * 0.25
  const L = xEdge(s) * 0.5 + xFacet(s) * (0.3 + p)
  const R = yEdge(s) * 0.5 + yFacet(s) * (0.3 + p)
  return [L, R]
})