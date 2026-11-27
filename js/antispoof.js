// ============================================================
// ANTI-SPOOFING — HEAD SHAKE
// ============================================================
function getFaceMetrics(lm) {
  const p = lm.positions;
  return { noseX: p[30].x, faceWidth: Math.abs(p[16].x - p[0].x) };
}

async function getLandmarks(video) {
  const det = await faceapi
    .detectSingleFace(video,
      new faceapi.TinyFaceDetectorOptions({
        inputSize:224, scoreThreshold:0.2
      }))
    .withFaceLandmarks();
  return det ? getFaceMetrics(det.landmarks) : null;
}

async function detectHeadShake(video) {
  const container   = document.getElementById('video-container');
  const instruction = document.getElementById('blink-instruction');
  const labelEl     = document.getElementById('shake-label');
  const dots        = [1,2,3,4,5].map(i =>
    document.getElementById('bdot-' + i));
  let dotIndex = 0;

  container.classList.add('blink-mode');
  instruction.classList.remove('hidden');

  function updateDots(elapsed, total) {
    const p = Math.floor((elapsed / total) * 5);
    while (dotIndex < p && dotIndex < 5) {
      dots[dotIndex++].classList.add('active');
    }
  }

  function cleanup() {
    container.classList.remove('blink-mode');
    instruction.classList.add('hidden');
    dots.forEach(d => { d.className = 'blink-dot'; });
    dotIndex = 0;
  }

  // Fase 1: Warm-up 1.5 detik
  setCamStatus('info', 'Hadap kamera...');
  if (labelEl) labelEl.textContent = 'Hadap kamera...';
  const warmStart = Date.now();
  let faceFound   = false;
  while (Date.now() - warmStart < 1500) {
    const m = await getLandmarks(video);
    if (m) faceFound = true;
    await new Promise(r => setTimeout(r, SAMPLE_MS));
  }
  if (!faceFound) {
    cleanup();
    setCamStatus('error', 'Wajah tidak terdeteksi! Pastikan pencahayaan cukup.');
    return false;
  }

  // Fase 2: Baseline 1 detik
  setCamStatus('info', 'Tahan diam sebentar...');
  if (labelEl) labelEl.textContent = 'Tahan diam...';
  const baseStart = Date.now();
  const samples   = [];
  while (Date.now() - baseStart < 1000) {
    const m = await getLandmarks(video);
    if (m) samples.push(m);
    await new Promise(r => setTimeout(r, SAMPLE_MS));
  }
  if (samples.length < 3) {
    cleanup();
    setCamStatus('error', 'Wajah tidak stabil! Pastikan pencahayaan cukup.');
    return false;
  }
  samples.sort((a, b) => a.noseX - b.noseX);
  const baseline = samples[Math.floor(samples.length / 2)];
  const minMove  = baseline.faceWidth * HEAD_MOVE_RATIO;

  // Fase 3: Siap 600ms
  setCamStatus('info', 'Siap...');
  if (labelEl) labelEl.textContent = 'Siap...';
  await new Promise(r => setTimeout(r, 600));

  // Fase 4: Deteksi geleng
  setCamStatus('info', '↔️ Gelengkan kepala 1x!');
  if (labelEl) labelEl.textContent = '↔️ Gelengkan kepala 1x!';
  dots.forEach(d => { d.className = 'blink-dot'; });
  dotIndex = 0;

  const detStart = Date.now();
  let maxL = 0, maxR = 0;

  while (Date.now() - detStart < SHAKE_TIMEOUT_MS) {
    updateDots(Date.now() - detStart, SHAKE_TIMEOUT_MS);
    const m = await getLandmarks(video);
    if (m) {
      const dx = m.noseX - baseline.noseX;
      if (dx < 0) maxL = Math.max(maxL, Math.abs(dx));
      else         maxR = Math.max(maxR, dx);

      if (maxL >= minMove || maxR >= minMove) {
        dots.forEach(d => {
          d.classList.remove('active');
          d.classList.add('done');
        });
        await new Promise(r => setTimeout(r, 200));
        cleanup();
        return true;
      }
    }
    await new Promise(r => setTimeout(r, SAMPLE_MS));
  }

  cleanup();
  return false;
}
