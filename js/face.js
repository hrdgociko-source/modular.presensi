// ============================================================
// MODEL LOADING (lokal dari www/models/)
// ============================================================
async function loadModels() {
  const progressEl = document.getElementById('model-progress');
  const statusEl   = document.getElementById('models-status');

  async function tryLoad(label, loadFn, pct) {
    for (let i = 0; i < MODEL_SOURCES.length; i++) {
      try {
        statusEl.innerHTML = `<span class="status-badge status-warning">
          <span class="dot pulse"></span>Memuat ${label}...</span>`;
        await Promise.race([
          loadFn(MODEL_SOURCES[i]),
          new Promise((_,rej) =>
            setTimeout(() => rej(new Error('Timeout')), 20000))
        ]);
        progressEl.style.width = pct + '%';
        return;
      } catch(e) {
        if (i === MODEL_SOURCES.length - 1) throw e;
      }
    }
  }

  try {
    await tryLoad('sensor (1/3)',
      url => faceapi.nets.tinyFaceDetector.loadFromUri(url),  33);
    await tryLoad('sensor (2/3)',
      url => faceapi.nets.faceLandmark68Net.loadFromUri(url), 66);
    await tryLoad('sensor (3/3)',
      url => faceapi.nets.faceRecognitionNet.loadFromUri(url),100);

    modelsReady = true;
    statusEl.innerHTML = `<span class="status-badge status-success">
      <span class="dot"></span>Sensor Wajah Siap ✓</span>`;
    tryEnableButtons();

  } catch(e) {
    statusEl.innerHTML = `
      <span class="status-badge status-error"
        style="flex-direction:column;gap:6px;padding:8px 14px">
        <span>⚠️ Gagal memuat sensor wajah</span>
        <button onclick="loadModels()"
          style="font-size:0.7rem;text-decoration:underline;font-weight:700">
          🔄 Coba Lagi</button>
      </span>`;
  }
}

// ============================================================
// FACE DETECTION
// ============================================================
async function detectFace(video) {
  for (let i = 0; i < 5; i++) {
    const det = await faceapi
      .detectSingleFace(video,
        new faceapi.TinyFaceDetectorOptions({
          inputSize:320, scoreThreshold:0.45
        }))
      .withFaceLandmarks()
      .withFaceDescriptor();
    if (det) return det;
    await new Promise(r => setTimeout(r, 300));
  }
  return null;
}

// 1:n match — support single & multiple descriptor
function matchFaceInOutlet(descriptor) {
  if (!outletDescriptors.length) {
    console.warn('[Match] outletDescriptors kosong!');
    return null;
  }

  let best = null, bestDist = Infinity;

  outletDescriptors.forEach(k => {
    const dList = Array.isArray(k.descriptor[0])
      ? k.descriptor
      : [k.descriptor];

    dList.forEach(d => {
      const dist = faceapi.euclideanDistance(descriptor, d);
      if (dist < bestDist) { bestDist = dist; best = k; }
    });
  });

  console.log(
    `[Match] Best: ${best?.nama} ` +
    `(${bestDist.toFixed(3)}) | ` +
    `threshold: ${FACE_MATCH_THRESHOLD}`
  );
  return bestDist <= FACE_MATCH_THRESHOLD
    ? { ...best, distance: bestDist }
    : null;
}
