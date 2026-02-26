// Veil — filtered noise drifting through resonant bands
// X-Y mode: narrow-band chaos creates organic flowing forms
const nx = noise(), ny = noise()
const xBand = bpf(s => nx(s) * 0.5, s => 180 + Math.sin(s.t * 0.08) * 120, 0.92)
const yBand = bpf(s => ny(s) * 0.5, s => 250 + Math.sin(s.t * 0.11) * 160, 0.92)
play('veil', s => [xBand(s), yBand(s)])