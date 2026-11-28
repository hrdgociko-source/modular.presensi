// ============================================================
// PERF — penyesuaian untuk HP lowend (RAM ≤ 2GB)
// ============================================================
const LOWEND = (function () {
  const mem   = navigator.deviceMemory || 4;          // GB (perkiraan)
  const cores = navigator.hardwareConcurrency || 4;
  const reduce = window.matchMedia &&
                 window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return mem <= 2 || cores <= 4 || reduce;
})();

if (LOWEND) document.documentElement.classList.add('lowend');

// Parameter dinamis — dikalibrasi ulang oleh calibrateSpeed()
const PERF = {
  detectSize     : LOWEND ? 224 : 320,  // ukuran input deteksi final
  loopSize       : LOWEND ? 128 : 224,  // ukuran input loop anti-spoof
  videoSize      : LOWEND ? 240 : 320,  // resolusi kamera
  sampleMs       : LOWEND ? 0   : SAMPLE_MS,
  shakeTimeoutMs : LOWEND ? 12000 : SHAKE_TIMEOUT_MS,
  baselineMs     : LOWEND ? 1500  : 1000,
  minSamples     : LOWEND ? 2 : 3
};

// Pilih backend TensorFlow.js: WebGL dulu, jika gagal pakai CPU
async function initBackend() {
  const tf = faceapi.tf;
  if (!tf || !tf.setBackend) return;
  for (const b of ['webgl', 'cpu']) {
    try {
      const ok = await tf.setBackend(b);
      await tf.ready();
      if (ok !== false && tf.getBackend() === b) {
        console.log('[Perf] Backend:', b);
        if (b === 'cpu') {          // CPU jauh lebih lambat → beri waktu lebih
          PERF.shakeTimeoutMs = 15000;
          PERF.loopSize = 128;
        }
        return;
      }
    } catch (e) { console.warn('[Perf] Backend gagal:', b, e); }
  }
}

// Pemanasan: satu inferensi pada kanvas kosong agar kompilasi shader
// terjadi saat startup, bukan saat karyawan menekan tombol.
async function warmUpModels() {
  try {
    const c = document.createElement('canvas');
    c.width = c.height = 160;
    const t0 = performance.now();
    await faceapi.detectSingleFace(c,
      new faceapi.TinyFaceDetectorOptions({ inputSize: PERF.loopSize }));
    const ms = performance.now() - t0;
    console.log('[Perf] Warm-up ms:', Math.round(ms));
  } catch (e) { console.warn('[Perf] Warm-up gagal:', e); }
}

// Ukur waktu per frame nyata (dipanggil dari anti-spoof)
function adaptToFrameTime(avgMs) {
  if (avgMs > 350) {                 // sangat lambat
    PERF.shakeTimeoutMs = Math.max(PERF.shakeTimeoutMs, 15000);
    PERF.baselineMs     = Math.max(PERF.baselineMs, 2000);
    PERF.minSamples     = 2;
  }
}
