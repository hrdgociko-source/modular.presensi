// ============================================================
// CAMERA SCREEN
// ============================================================
async function showCamera(type) {
  if (!modelsReady) {
    alert("Sensor wajah belum siap. Tunggu sebentar!");
    return;
  }

  selectedType = type;
  currentUser  = null;

  document.getElementById('cam-title').innerText =
    type === 'DATANG' ? 'Absen Masuk' : 'Absen Pulang';
  document.getElementById('cam-type-badge').innerText =
    type === 'DATANG' ? '🟢 Masuk Kerja' : '🔴 Pulang Kerja';
  document.getElementById('video-container').className = '';

  const camWarn = document.getElementById('cam-unverified-warning');
  locationVerified
    ? camWarn.classList.add('hidden')
    : camWarn.classList.remove('hidden');

  resetBtnAbsensi();
  setCamStatus('info', 'Hadap kamera untuk absen');
  showSection('section-camera');
  await startCamera();
}

// ============================================================
// VERIFICATION FLOW
// ============================================================
async function startVerification() {
  if (isProcessing) return;
  isProcessing = true;

  const btn   = document.getElementById('btn-absensi');
  const video = document.getElementById('video');
  btn.disabled  = true;
  btn.innerText = 'Memproses...';

  try {
    // STEP 1 — Anti-Spoofing
    const shakeOk = await detectHeadShake(video);
    if (!shakeOk) {
      setCamStatus('error', 'Gerak kepala tidak terdeteksi! Coba lagi.');
      resetBtnAbsensi();
      return;
    }

    // STEP 2 — Jeda stabilisasi
    await new Promise(r => setTimeout(r, 600));

    // STEP 3 — Deteksi wajah
    document.getElementById('video-container').classList.add('scanning');
    setCamStatus('warning', 'Mendeteksi wajah...');
    const detection = await detectFace(video);
    document.getElementById('video-container').classList.remove('scanning');

    if (!detection) {
      setCamStatus('error', 'Wajah tidak terdeteksi! Pastikan pencahayaan cukup.');
      resetBtnAbsensi();
      return;
    }

    // STEP 4 — 1:n Face Matching
    const matched = matchFaceInOutlet(detection.descriptor);
    if (!matched) {
      setCamStatus('error', 'Wajah tidak dikenali! Pastikan Anda terdaftar di outlet ini.');
      resetBtnAbsensi();
      return;
    }

    // STEP 5 — Konfirmasi identitas
    currentUser = matched;
    stopStream();
    showKonfirmasiIdentitas(matched);

  } catch(e) {
    console.error('[Verification]', e);
    setCamStatus('error', 'Terjadi kesalahan: ' + e.message);
    resetBtnAbsensi();
  } finally {
    isProcessing = false;
  }
}

function resetBtnAbsensi() {
  const btn     = document.getElementById('btn-absensi');
  btn.disabled  = false;
  btn.innerText = 'KONFIRMASI ABSENSI';
}

// ============================================================
// KONFIRMASI & SAVE
// ============================================================
function showKonfirmasiIdentitas(matched) {
  const outletTampil = locationVerified
    ? (currentOutlet || matched.outlet || '-')
    : ((nearestOutlet || matched.outlet || '-') + ' (Unverified)');

  document.getElementById('konfirmasi-nama').innerText   = matched.nama;
  document.getElementById('konfirmasi-nik').innerText    = 'NIK: ' + matched.nik;
  document.getElementById('konfirmasi-outlet').innerText = '📍 ' + outletTampil;
  document.getElementById('konfirmasi-type').innerText   =
    selectedType === 'DATANG' ? '🟢 Absen Masuk' : '🔴 Absen Pulang';
  showSection('section-konfirmasi');
}

async function konfirmasiAbsensi() {
  if (!currentUser) return;
  showSection('section-processing');
  document.getElementById('processing-text').innerText = 'Menyimpan data absensi...';

  try {
    const outletFinal =
      currentOutlet || nearestOutlet || currentUser.outlet || '';

    const payload = {
      aksi            : "absensi",
      nik             : currentUser.nik,
      nama            : currentUser.nama,
      outlet          : outletFinal,
      status          : selectedType,
      locationVerified: locationVerified
    };

    const result = await postAbsensi(payload);

    if (result.sukses) {
      showSuccessScreen(new Date(), outletFinal);
    } else {
      alert(result.error || 'Terjadi kesalahan tidak diketahui');
      showSection('section-main');
    }

  } catch(e) {
    console.error('[KonfirmasiAbsensi]', e);
    alert('Gagal terhubung ke server: ' + e.message);
    showSection('section-main');
  }
}

async function batalKonfirmasi() {
  currentUser = null;
  showSection('section-camera');
  resetBtnAbsensi();
  setCamStatus('info', 'Hadap kamera untuk absen');
  await startCamera();
}

function backToMain() {
  stopStream();
  currentUser = null;
  resetBtnAbsensi();
  showSection('section-main');
}
