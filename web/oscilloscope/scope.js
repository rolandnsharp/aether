// WebGL phosphor CRT oscilloscope — Y-T and X-Y (Lissajous) modes.
// 4-stage pipeline: persistence decay → beam draw → Dual Kawase bloom → composite.

let mode = 'yt';
let gl, canvas, analyserL, analyserR, bufferL, bufferR;
let animId = null;

// --- FBOs ---
const persist = [null, null];   // ping-pong full-res
const bloom = [null, null, null]; // half, quarter, eighth
let pingIndex = 0;

// --- Programs ---
let progBeam, progDecay, progBlur, progComposite;

// --- Geometry ---
let quadVAO, quadVBO;
let beamVAO, beamVBO;
const MAX_VERTS = 4096;
const beamData = new Float32Array(MAX_VERTS * 2);

// ─── Shaders ────────────────────────────────────────────────

const VS_QUAD = `#version 300 es
layout(location=0) in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const VS_BEAM = `#version 300 es
uniform vec2 u_resolution;
layout(location=0) in vec2 a_pos;
void main() {
  vec2 clip = (a_pos / u_resolution) * 2.0 - 1.0;
  clip.y = -clip.y;
  gl_Position = vec4(clip, 0.0, 1.0);
}`;

const FS_BEAM = `#version 300 es
precision mediump float;
out vec4 fragColor;
void main() {
  fragColor = vec4(0.8, 1.0, 0.8, 1.0);
}`;

const FS_DECAY = `#version 300 es
precision mediump float;
uniform sampler2D u_tex;
in vec2 v_uv;
out vec4 fragColor;
void main() {
  vec4 c = texture(u_tex, v_uv);
  // Fade with green tint bias — green decays slower
  fragColor = c * vec4(0.78, 0.84, 0.78, 1.0);
}`;

const FS_BLUR = `#version 300 es
precision mediump float;
uniform sampler2D u_tex;
uniform vec2 u_texelSize;
uniform int u_mode; // 0 = downsample, 1 = upsample
in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec2 hs = u_texelSize * 0.5;
  if (u_mode == 0) {
    // Dual Kawase downsample — 5-tap
    vec4 s  = texture(u_tex, v_uv) * 4.0;
    s += texture(u_tex, v_uv + vec2(-hs.x, -hs.y));
    s += texture(u_tex, v_uv + vec2( hs.x, -hs.y));
    s += texture(u_tex, v_uv + vec2(-hs.x,  hs.y));
    s += texture(u_tex, v_uv + vec2( hs.x,  hs.y));
    fragColor = s / 8.0;
  } else {
    // Dual Kawase upsample — 8-tap
    vec2 ts = u_texelSize;
    vec4 s  = texture(u_tex, v_uv + vec2(-ts.x,     0.0));
    s += texture(u_tex, v_uv + vec2( ts.x,     0.0));
    s += texture(u_tex, v_uv + vec2(    0.0, -ts.y));
    s += texture(u_tex, v_uv + vec2(    0.0,  ts.y));
    s += texture(u_tex, v_uv + vec2(-hs.x, -hs.y)) * 2.0;
    s += texture(u_tex, v_uv + vec2( hs.x, -hs.y)) * 2.0;
    s += texture(u_tex, v_uv + vec2(-hs.x,  hs.y)) * 2.0;
    s += texture(u_tex, v_uv + vec2( hs.x,  hs.y)) * 2.0;
    fragColor = s / 12.0;
  }
}`;

const FS_COMPOSITE = `#version 300 es
precision mediump float;
uniform sampler2D u_sharp;
uniform sampler2D u_bloom;
in vec2 v_uv;
out vec4 fragColor;

float graticule(vec2 uv) {
  // 10 vertical, 8 horizontal divisions
  float gx = abs(fract(uv.x * 10.0 + 0.5) - 0.5);
  float gy = abs(fract(uv.y * 8.0 + 0.5) - 0.5);
  float lineW = 0.008;
  float g = smoothstep(0.0, lineW, min(gx, gy));
  // Mix: 1.0 = no darkening, lower = dark cut
  return mix(0.45, 1.0, g);
}

void main() {
  vec4 sharp = texture(u_sharp, v_uv);
  vec4 bl = texture(u_bloom, v_uv);
  vec4 combined = sharp + bl * 1.5;
  float g = graticule(v_uv);
  fragColor = vec4(combined.rgb * g, 1.0);
}`;

// ─── GL helpers ─────────────────────────────────────────────

function compileShader(type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('Shader compile:', gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

function linkProgram(vsSrc, fsSrc) {
  const vs = compileShader(gl.VERTEX_SHADER, vsSrc);
  const fs = compileShader(gl.FRAGMENT_SHADER, fsSrc);
  const p = gl.createProgram();
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error('Program link:', gl.getProgramInfoLog(p));
    return null;
  }
  // Cache uniform locations
  const uCount = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  p.u = {};
  for (let i = 0; i < uCount; i++) {
    const info = gl.getActiveUniform(p, i);
    p.u[info.name] = gl.getUniformLocation(p, info.name);
  }
  return p;
}

function createFBO(w, h) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { fb, tex, w, h };
}

function resizeFBO(fbo, w, h) {
  fbo.w = w;
  fbo.h = h;
  gl.bindTexture(gl.TEXTURE_2D, fbo.tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
}

// ─── Fullscreen quad ────────────────────────────────────────

function initQuad() {
  const verts = new Float32Array([-1,-1, 1,-1, -1,1, 1,1]);
  quadVAO = gl.createVertexArray();
  quadVBO = gl.createBuffer();
  gl.bindVertexArray(quadVAO);
  gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
}

function drawQuad() {
  gl.bindVertexArray(quadVAO);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.bindVertexArray(null);
}

// ─── Beam geometry ──────────────────────────────────────────

function initBeam() {
  beamVAO = gl.createVertexArray();
  beamVBO = gl.createBuffer();
  gl.bindVertexArray(beamVAO);
  gl.bindBuffer(gl.ARRAY_BUFFER, beamVBO);
  gl.bufferData(gl.ARRAY_BUFFER, beamData.byteLength, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
}

function buildBeamStrip(w, h) {
  analyserL.getFloatTimeDomainData(bufferL);
  if (analyserR) analyserR.getFloatTimeDomainData(bufferR);

  const len = bufferL.length;
  const halfW = 1.5; // beam half-width in pixels
  let vi = 0;

  for (let i = 0; i < len; i++) {
    let x, y;
    if (mode === 'yt') {
      x = (i / len) * w;
      y = (1 - bufferL[i] * 1.5) * h / 2;
    } else {
      x = (1 + bufferL[i] * 1.5) * w / 2;
      y = (1 - bufferR[i] * 1.5) * h / 2;
    }

    // Compute screen-space normal
    let nx, ny;
    if (i === 0) {
      let x1, y1;
      if (mode === 'yt') {
        x1 = (1 / len) * w;
        y1 = (1 - bufferL[1] * 1.5) * h / 2;
      } else {
        x1 = (1 + bufferL[1] * 1.5) * w / 2;
        y1 = (1 - bufferR[1] * 1.5) * h / 2;
      }
      const dx = x1 - x, dy = y1 - y;
      const mag = Math.sqrt(dx * dx + dy * dy) || 1;
      nx = -dy / mag;
      ny = dx / mag;
    } else if (i === len - 1) {
      let x0, y0;
      if (mode === 'yt') {
        x0 = ((i - 1) / len) * w;
        y0 = (1 - bufferL[i - 1] * 1.5) * h / 2;
      } else {
        x0 = (1 + bufferL[i - 1] * 1.5) * w / 2;
        y0 = (1 - bufferR[i - 1] * 1.5) * h / 2;
      }
      const dx = x - x0, dy = y - y0;
      const mag = Math.sqrt(dx * dx + dy * dy) || 1;
      nx = -dy / mag;
      ny = dx / mag;
    } else {
      // Average of two segment normals (miter)
      let xp, yp, xn, yn;
      if (mode === 'yt') {
        xp = ((i - 1) / len) * w;
        yp = (1 - bufferL[i - 1] * 1.5) * h / 2;
        xn = ((i + 1) / len) * w;
        yn = (1 - bufferL[i + 1] * 1.5) * h / 2;
      } else {
        xp = (1 + bufferL[i - 1] * 1.5) * w / 2;
        yp = (1 - bufferR[i - 1] * 1.5) * h / 2;
        xn = (1 + bufferL[i + 1] * 1.5) * w / 2;
        yn = (1 - bufferR[i + 1] * 1.5) * h / 2;
      }
      const dx1 = x - xp, dy1 = y - yp;
      const dx2 = xn - x, dy2 = yn - y;
      const m1 = Math.sqrt(dx1 * dx1 + dy1 * dy1) || 1;
      const m2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1;
      nx = -(dy1 / m1 + dy2 / m2);
      ny = (dx1 / m1 + dx2 / m2);
      const nm = Math.sqrt(nx * nx + ny * ny) || 1;
      nx /= nm;
      ny /= nm;
    }

    beamData[vi++] = x + nx * halfW;
    beamData[vi++] = y + ny * halfW;
    beamData[vi++] = x - nx * halfW;
    beamData[vi++] = y - ny * halfW;
  }

  return vi / 2; // vertex count
}

// ─── Draw ───────────────────────────────────────────────────

function draw() {
  animId = requestAnimationFrame(draw);

  const w = canvas.width;
  const h = canvas.height;
  if (w === 0 || h === 0) return;

  const src = persist[pingIndex];
  const dst = persist[1 - pingIndex];
  pingIndex = 1 - pingIndex;

  // 1. Persistence decay: read src → write dst
  gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fb);
  gl.viewport(0, 0, w, h);
  gl.useProgram(progDecay);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, src.tex);
  gl.uniform1i(progDecay.u.u_tex, 0);
  drawQuad();

  // 2. Beam draw into dst (additive)
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);
  const vertCount = buildBeamStrip(w, h);
  gl.useProgram(progBeam);
  gl.uniform2f(progBeam.u.u_resolution, w, h);
  gl.bindVertexArray(beamVAO);
  gl.bindBuffer(gl.ARRAY_BUFFER, beamVBO);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, beamData.subarray(0, vertCount * 2));
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertCount);
  gl.bindVertexArray(null);
  gl.disable(gl.BLEND);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  // 3. Bloom — Dual Kawase downsample (3 levels)
  gl.useProgram(progBlur);
  gl.uniform1i(progBlur.u.u_tex, 0);

  // Down 0: dst → bloom[0]
  gl.bindFramebuffer(gl.FRAMEBUFFER, bloom[0].fb);
  gl.viewport(0, 0, bloom[0].w, bloom[0].h);
  gl.uniform2f(progBlur.u.u_texelSize, 1.0 / w, 1.0 / h);
  gl.uniform1i(progBlur.u.u_mode, 0);
  gl.bindTexture(gl.TEXTURE_2D, dst.tex);
  drawQuad();

  // Down 1: bloom[0] → bloom[1]
  gl.bindFramebuffer(gl.FRAMEBUFFER, bloom[1].fb);
  gl.viewport(0, 0, bloom[1].w, bloom[1].h);
  gl.uniform2f(progBlur.u.u_texelSize, 1.0 / bloom[0].w, 1.0 / bloom[0].h);
  gl.bindTexture(gl.TEXTURE_2D, bloom[0].tex);
  drawQuad();

  // Down 2: bloom[1] → bloom[2]
  gl.bindFramebuffer(gl.FRAMEBUFFER, bloom[2].fb);
  gl.viewport(0, 0, bloom[2].w, bloom[2].h);
  gl.uniform2f(progBlur.u.u_texelSize, 1.0 / bloom[1].w, 1.0 / bloom[1].h);
  gl.bindTexture(gl.TEXTURE_2D, bloom[1].tex);
  drawQuad();

  // Upsample back
  gl.uniform1i(progBlur.u.u_mode, 1);

  // Up 0: bloom[2] → bloom[1]
  gl.bindFramebuffer(gl.FRAMEBUFFER, bloom[1].fb);
  gl.viewport(0, 0, bloom[1].w, bloom[1].h);
  gl.uniform2f(progBlur.u.u_texelSize, 1.0 / bloom[2].w, 1.0 / bloom[2].h);
  gl.bindTexture(gl.TEXTURE_2D, bloom[2].tex);
  drawQuad();

  // Up 1: bloom[1] → bloom[0]
  gl.bindFramebuffer(gl.FRAMEBUFFER, bloom[0].fb);
  gl.viewport(0, 0, bloom[0].w, bloom[0].h);
  gl.uniform2f(progBlur.u.u_texelSize, 1.0 / bloom[1].w, 1.0 / bloom[1].h);
  gl.bindTexture(gl.TEXTURE_2D, bloom[1].tex);
  drawQuad();

  // 4. Composite to screen
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, w, h);
  gl.useProgram(progComposite);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, dst.tex);
  gl.uniform1i(progComposite.u.u_sharp, 0);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, bloom[0].tex);
  gl.uniform1i(progComposite.u.u_bloom, 1);
  drawQuad();
}

// ─── Resize ─────────────────────────────────────────────────

function resize(container) {
  const dpr = devicePixelRatio || 1;
  const rect = container.getBoundingClientRect();
  const w = Math.round(rect.width * dpr);
  const h = Math.round(rect.height * dpr);
  if (canvas.width === w && canvas.height === h) return;
  canvas.width = w;
  canvas.height = h;
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';

  resizeFBO(persist[0], w, h);
  resizeFBO(persist[1], w, h);
  resizeFBO(bloom[0], Math.max(1, w >> 1), Math.max(1, h >> 1));
  resizeFBO(bloom[1], Math.max(1, w >> 2), Math.max(1, h >> 2));
  resizeFBO(bloom[2], Math.max(1, w >> 3), Math.max(1, h >> 3));

  // Clear persistence buffers on resize
  for (const p of persist) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, p.fb);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

// ─── Init ───────────────────────────────────────────────────

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

  gl = canvas.getContext('webgl2', { alpha: false, antialias: false, premultipliedAlpha: false });
  if (!gl) {
    console.error('WebGL2 not available');
    return;
  }

  // Enable float textures
  gl.getExtension('EXT_color_buffer_float');

  // Compile programs
  progBeam = linkProgram(VS_BEAM, FS_BEAM);
  progDecay = linkProgram(VS_QUAD, FS_DECAY);
  progBlur = linkProgram(VS_QUAD, FS_BLUR);
  progComposite = linkProgram(VS_QUAD, FS_COMPOSITE);

  // Geometry
  initQuad();
  initBeam();

  // Create FBOs at 1×1 — resize will fix them
  persist[0] = createFBO(1, 1);
  persist[1] = createFBO(1, 1);
  bloom[0] = createFBO(1, 1);
  bloom[1] = createFBO(1, 1);
  bloom[2] = createFBO(1, 1);

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

  if (!animId) draw();
}
