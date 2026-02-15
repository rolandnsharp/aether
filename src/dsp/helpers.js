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
