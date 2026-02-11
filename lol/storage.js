const RING_BUFFER_SIZE = 32768; // ~0.68s at 48kHz

// The main shared buffer for audio data
export const ringBuffer = new Float32Array(RING_BUFFER_SIZE);

let writeCursor = 0;

export function writeToRingBuffer(data) {
    const len = data.length;
    // Handle wrap-around copy
    if (writeCursor + len > RING_BUFFER_SIZE) {
        const firstChunkSize = RING_BUFFER_SIZE - writeCursor;
        const secondChunkSize = len - firstChunkSize;
        ringBuffer.set(data.subarray(0, firstChunkSize), writeCursor);
        ringBuffer.set(data.subarray(firstChunkSize, firstChunkSize + secondChunkSize), 0);
    } else {
        ringBuffer.set(data, writeCursor);
    }
    writeCursor = (writeCursor + len) % RING_BUFFER_SIZE;
}
