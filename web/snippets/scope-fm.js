// FM — frequency modulation sidebands as visual geometry
// X-Y mode: sweeping mod index traces evolving sideband patterns
const fc = 80, mRatio = 3 / 2
const modX = sin(s => fc * mRatio)
const modY = sin(s => fc * mRatio + 0.3)
const sweep = share(sin(s => 0.06))
const carrierX = sin(s => fc + modX(s) * (150 + sweep(s) * 120))
const carrierY = sin(s => fc + modY(s) * (150 + sweep(s) * 120))
play('fm-art', s => [carrierX(s) * 0.85, carrierY(s) * 0.85])