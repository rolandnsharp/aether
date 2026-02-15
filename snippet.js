// snippet.js
// This is an example snippet to send to the running `lel` engine.
// It will unregister one of the default signals.

console.log('[REPL] Unregistering the filtered-sine signal...');
// unregister('filtered-delayed-sine');
// stop('elemental-unity')

play('tone-432-rhythmos', s => {
  const frequency = 432; // A4 = 432 Hz
  const amplitude = 0.125;
  // s.state[0] stores the phase accumulator for this signal.
  // It will persist across hot-reloads, ensuring phase continuity.
  s.state[0] = (s.state[0] || 0) + (frequency / s.sr);
  s.state[0] %= 1.0; // Wrap phase around 0 to 1
  return Math.sin(s.state[0] * 0.5 * Math.PI) * amplitude;
});

solo('tone-432-rhythmos', 4);

stop('tone-432-rhythmos')

list()


play('tone-432', s => {
  const frequency = 432; // A4 = 432 Hz
  const amplitude = 0.5;
  return Math.sin(2 * Math.PI * frequency * s.t) * amplitude;
}, 1);

stop('tone-432', 4)

clear(1)


play('fire-melody',
  pipe(
    // Melodic line using pure sine waves
    s => {
      // Melody changes every 4 seconds
      const melodyIndex = Math.floor(s.t / 4) % 4;
      const melody = [220, 247, 277, 330]; // A3, B3, C#4, E4
      const freq = melody[melodyIndex];
      // Fade in/out within each note
      const phase = (s.t % 4) / 4;
      const envelope = Math.sin(phase * Math.PI);
      return Math.sin(2 * Math.PI * freq * s.t) * envelope * 0.15;
    },
    signal => delay(signal, 1.0, 0.375), // Dotted eighth note delay
    signal => tremolo(signal, 6, 0.4) // Slight vibrato effect
  )
);

stop('fire-melody')

play('fire-drone',
  pipe(
    // Deep bass drone with slow amplitude modulation
    s => {
      const baseFreq = 555; // A1
      const harmonic2 = 210; // A2
      const harmonic3 = 365; // E3
      // Three harmonics for richness
      const fundamental = Math.sin(2 * Math.PI * baseFreq * s.t);
      const second = Math.sin(2 * Math.PI * harmonic2 * s.t) * 0.5;
      const third = Math.sin(2 * Math.PI * harmonic3 * s.t) * 0.3;
      // Slow amplitude modulation (0.1 Hz = 6 beats per minute)
      const am = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.1 * s.t);
      return (fundamental + second + third) * am * 0.25;
    },
    signal => lowpass(signal, 400), // Dark, warm filter
    signal => feedback(signal, 3.0, 1.5, 0.2) // Long reverb-like feedback
  )
);

// stop('fire-drone')

play('mix-test',
  mix(
    s => Math.sin(2 * Math.PI * 220 * s.t) * 0.2,
    s => Math.sin(2 * Math.PI * 330 * s.t) * 0.2, 
    s => Math.sin(2 * Math.PI * 440 * s.t) * 0.2
  )
)

stop('mix-test', 4)

play('osc-sin', sin(440))

play('osc-saw', pipe(saw(110), signal => lowpass(signal, 800)))

const mod = sin(180);
const carrier = sin(s => 340 + mod(s) * 100);
play('osc-fm', carrier)

stop('osc-fm', 2)

stop('osc-sin', 2)

stop('osc-saw', 2)



// Kick                                                    
const beat = phasor(130/60);
const envelope = share(decay(beat, 40));
const xx = sin(s => 60 + envelope(s) * 200);   
play('reverb-kick', pipe(
    s => xx(s) * envelope(s) * 0.8,
    signal => reverb(signal, 2, 0.3, 0.5)
  ))


// play('kick', s => kick(s) * envelope(s) * 0.8)

solo('kick', 3)

// Snare on 2 and 4
const snBeat = phasor(130/120);                                                             
const snEnv = share(decay(s => (snBeat(s) + 0.5) % 1.0, 60));                    
const body = sin(180);
const crack = noise();
play('snare', s => (body(s) * 0.5 + crack(s) * 0.5) * snEnv(s) * 0.6)

// Hats on eighth notes
const hatBeat = phasor(130/30);
const hatEnv = decay(hatBeat, 80);
const hiss = pipe(noise(), signal => highpass(signal, 6000));
play('hats', s => hiss(s) * hatEnv(s) * 0.3)


stop('kick', 4)

stop('snare', 4)

stop('hats', 4)

// === THINGS TO PLAY WITH ===

// --- Acid bass: saw + resonant filter sweep ---
const acidBeat = phasor(130/60);
const acidEnv = share(decay(acidBeat, 25));
const acidOsc = saw(s => {
  const notes = [55, 55, 73, 55, 82, 55, 65, 55];
  const idx = Math.floor(acidBeat(s) * 0.125) % notes.length;
  return notes[idx];
});
play('acid', pipe(
  s => acidOsc(s) * acidEnv(s) * 0.4,
  signal => lowpass(signal, s => 200 + acidEnv(s) * 3000)
))

stop('acid', 4)

// --- Ethereal pad: detuned sines with slow filter ---
const v1 = sin(220);
const v2 = sin(220.5);
const v3 = sin(330);
const v4 = sin(329.3);
play('pad', pipe(
  s => (v1(s) + v2(s) + v3(s) + v4(s)) * 0.1,
  signal => lowpass(signal, s => 600 + Math.sin(s.t * 0.2) * 400)
), 6)

stop('pad', 8)

// --- Metallic bell: FM with high mod depth ---
const bellMod = sin(563);
const bell = sin(s => 440 + bellMod(s) * 800);
const bellBeat = phasor(2);
const bellEnv = decay(bellBeat, 15);
play('bell', s => bell(s) * bellEnv(s) * 0.2)

stop('bell', 4)

// --- Bubbles: sine with random pitch triggered fast ---
play('bubbles', s => {
  s.state[0] = (s.state[0] + 8 / s.sr) % 1.0;
  const env = Math.exp(-s.state[0] * 20);
  const freq = 300 + (Math.floor(s.t * 8) * 137.5 % 900);
  s.state[1] = (s.state[1] + freq / s.sr) % 1.0;
  return Math.sin(s.state[1] * 2 * Math.PI) * env * 0.15;
})

stop('bubbles', 3)

// --- Haunted drone: feedback delay on a low triangle ---
play('haunt', pipe(
  tri(55),
  signal => lowpass(signal, 300),
  signal => feedback(signal, 2.0, 1.5, 0.7)
), 4)

stop('haunt', 8)

// --- Stereo shimmer: detuned pair panned wide ---
const shimL = pipe(sin(879), signal => delay(signal, 0.32, 0.13));
const shimR = pipe(sin(880), signal => delay(signal, 0.52, 0.17));
const reverbR = reverb(shimR, 2, 0.1, 0.3)
const reverbL = reverb(shimL, 2, 0.1, 0.3)
play('shimmer', s => [reverbL(s) * 0.1, reverbR(s) * 0.1], 4)


// --- Glitch rhythm: pulse wave with shifting duty cycle ---
const x = pipe(saw(110), signal => lowpass(signal, 600), signal => reverb(signal, 3.0, 0.7, 0.5))  
play('glitch', x)

stop('glitch', 4)



//  const voices = [-10, -6, -3, 0, 3, 6, 10].map(d => saw(s => 110 + d));                      
//   play('supersaw', pipe(                                                                    
//     s => voices.reduce((sum, v) => sum + v(s), 0) * 0.06,                                   
//     signal => lowpass(signal, 2000)                                                           
//   ))   
  
//   stop('supersaw')


clear() 

                                                                    
  play('logistic', s => {                                                                     
    s.state[0] = s.state[0] || 0.5;                                                         
    s.state[2] = (s.state[2] || 0) + 1;                                                       
    if (s.state[2] >= 2000) {                                                               
      s.state[2] = 0;                                                                       
      s.state[0] = 3.59  * s.state[0] * (1 - s.state[0]);                                      
    }                                                                                         
    const freq = 200 + s.state[0] * 400;                                                      
    s.state[1] = (s.state[1] + freq / s.sr) % 1.0;
    return Math.sin(s.state[1] * 2 * Math.PI) * 0.3;
  })



stop('chaos2') 