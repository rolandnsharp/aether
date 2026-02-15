// Aither DSP — Stateless signal helpers.

export const gain = (signal, amount) => {
    const gainFn = typeof amount === 'function' ? amount : () => amount;
    return s => {
        const value = signal(s);
        const g = gainFn(s);
        if (Array.isArray(value)) {
            for (let i = 0; i < value.length; i++) value[i] *= g;
            return value;
        }
        return value * g;
    };
};

// Evaluate a signal once per sample and share the result.
//
// In Haskell and functional reactive programming, `share` solves the
// problem of "accidental duplication." When a signal is a function,
// passing it to two consumers means it runs twice — and if it's
// stateful (like a phasor), it advances twice. In Haskell's `reactive`
// library, `share` makes a Behavior or Event evaluate once and lets
// multiple observers see the same value. Same idea here: wrap a signal
// in share() when you need its output in more than one place.
//
//   const envelope = share(decay(beat, 40));
//   // envelope(s) now returns the same value no matter how many
//   // times it's called within a single sample.
//
export const share = (signal) => {
    let cachedT = -1;
    let cachedValue = 0;
    return s => {
        if (s.t !== cachedT) {
            cachedT = s.t;
            cachedValue = signal(s);
        }
        return cachedValue;
    };
};

export const decay = (signal, rate) => {
    const rateFn = typeof rate === 'function' ? rate : () => rate;
    return s => Math.exp(-signal(s) * rateFn(s));
};

export const pan = (signal, position) => {
    const posFn = typeof position === 'function' ? position : () => position;
    return s => {
        const value = signal(s);
        const pos = Math.max(-1, Math.min(1, posFn(s)));
        const angle = (pos * Math.PI) / 4;
        return [
            value * Math.cos(angle + Math.PI / 4),
            value * Math.sin(angle + Math.PI / 4)
        ];
    };
};
