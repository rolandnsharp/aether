// Phosphor CRT oscilloscope — Y-T and X-Y (Lissajous) modes.

let mode = 'yt'; // 'yt' | 'xy'
let ctx, canvas, analyserL, analyserR, bufferL, bufferR;
let animId = null;

function draw() {
  animId = requestAnimationFrame(draw);
  const w = canvas.width / devicePixelRatio;
  const h = canvas.height / devicePixelRatio;

  // Phosphor persistence fade
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  // Graticule
  ctx.strokeStyle = 'rgba(0, 255, 0, 0.08)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let i = 1; i < 10; i++) {
    const x = (w / 10) * i;
    ctx.moveTo(x, 0); ctx.lineTo(x, h);
  }
  for (let i = 1; i < 8; i++) {
    const y = (h / 8) * i;
    ctx.moveTo(0, y); ctx.lineTo(w, y);
  }
  ctx.stroke();
  // Center cross brighter
  ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
  ctx.beginPath();
  ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h);
  ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
  ctx.stroke();

  // Fetch data
  analyserL.getFloatTimeDomainData(bufferL);
  if (analyserR) analyserR.getFloatTimeDomainData(bufferR);

  const len = bufferL.length;

  // Build path
  ctx.beginPath();
  for (let i = 0; i < len; i++) {
    let x, y;
    if (mode === 'yt') {
      x = (i / len) * w;
      y = (1 - bufferL[i]) * h / 2;
    } else {
      x = (1 + bufferL[i]) * w / 2;
      y = (1 - bufferR[i]) * h / 2;
    }
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  // Pass 1: outer glow
  ctx.strokeStyle = '#33ff33';
  ctx.lineWidth = 1.5;
  ctx.shadowColor = '#33ff33';
  ctx.shadowBlur = 8;
  ctx.stroke();

  // Pass 2: bright beam center
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#aaffaa';
  ctx.lineWidth = 0.5;
  ctx.stroke();
}

function resize(container) {
  const dpr = devicePixelRatio || 1;
  const rect = container.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

/**
 * @param {AnalyserNode} aL — left channel analyser
 * @param {AnalyserNode} aR — right channel analyser
 * @param {HTMLElement} container — #scope-canvas-wrap
 */
export function initScope(aL, aR, container) {
  analyserL = aL;
  analyserR = aR;
  bufferL = new Float32Array(aL.frequencyBinCount);
  bufferR = new Float32Array(aR.frequencyBinCount);

  canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  container.appendChild(canvas);
  ctx = canvas.getContext('2d');

  new ResizeObserver(() => resize(container)).observe(container);
  resize(container);

  // Mode toggle
  const btn = document.getElementById('scope-mode-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      mode = mode === 'yt' ? 'xy' : 'yt';
      btn.textContent = mode === 'yt' ? 'Y-T' : 'X-Y';
    });
  }

  // Start render loop
  if (!animId) draw();
}
