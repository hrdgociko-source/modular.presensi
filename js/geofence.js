// ============================================================
// GEOFENCING LOKAL
// ============================================================
function hitungJarak(lat1, lon1, lat2, lon2) {
  const R = 6371000, toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat/2)**2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function cariOutletTerdekat(lat, lon, outlets) {
  let nearest = null, minDist = Infinity;
  outlets.forEach(o => {
    const dist = hitungJarak(lat, lon, o.lat, o.lon);
    if (dist < minDist) { minDist = dist; nearest = o; }
  });
  return {
    outlet   : nearest,
    jarak    : Math.round(minDist),
    dalamArea: nearest ? minDist <= (nearest.radius || 150) : false
  };
}

// ============================================================
// GEOFENCE PROCESSING
// ============================================================
function setWelcome(text, color) {
  const w = document.getElementById('outlet-welcome');
  if (!w) return;
  w.innerText   = text;
  w.style.color = color;
  w.classList.remove('hidden');
}

async function muatDescriptorOutlet(namaOutlet) {
  const karyawan = await loadDescriptorCache(namaOutlet);
  outletDescriptors = karyawan
    .filter(k => k.wajah && k.wajah.length === 128)
    .map(k => ({ ...k, descriptor: new Float32Array(k.wajah) }));
}

async function prosesGeofence(lat, lon) {
  setOutletText('Mencari lokasi...');
  const result = cariOutletTerdekat(lat, lon, cachedOutlets);
  const w      = document.getElementById('outlet-welcome');

  if (result.dalamArea && result.outlet) {
    // Dalam area outlet
    currentOutlet    = result.outlet.nama;
    nearestOutlet    = result.outlet.nama;
    locationVerified = true;

    setOutletText(result.outlet.nama);
    document.getElementById('outlet-badge').style.cssText =
      'background:#f0fdf4;color:#16a34a;border-color:#bbf7d0';
    document.getElementById('geofence-warning').classList.add('hidden');

    setWelcome('⏳ Memuat data karyawan...', '#d97706');
    await muatDescriptorOutlet(currentOutlet);

    if (outletDescriptors.length > 0) {
      setWelcome(`✅ ${outletDescriptors.length} karyawan siap`, '#16a34a');
    } else {
      setWelcome('⚠️ Belum ada wajah terdaftar di outlet ini', '#d97706');
    }

    console.log(`[Gociko] ${outletDescriptors.length} descriptor siap: ${currentOutlet}`);
    tryEnableButtons();
    return true;

  } else if (result.outlet) {
    // Di luar radius — tetap load descriptor outlet terdekat
    nearestOutlet    = result.outlet.nama;
    currentOutlet    = "";
    locationVerified = false;

    setOutletText(`⚠️ Di luar area (${result.outlet.nama}, ${result.jarak}m)`);
    document.getElementById('geofence-warning').classList.remove('hidden');

    setWelcome('⏳ Memuat data karyawan...', '#d97706');
    await muatDescriptorOutlet(nearestOutlet);

    setWelcome(
      outletDescriptors.length > 0
        ? `⚠️ ${outletDescriptors.length} karyawan (unverified)`
        : '⚠️ Belum ada wajah terdaftar',
      '#d97706'
    );

    console.log(`[Gociko] ${outletDescriptors.length} descriptor (unverified): ${nearestOutlet}`);
    tryEnableButtons();
    return false;

  } else {
    // Tidak ada outlet sama sekali
    currentOutlet    = "";
    nearestOutlet    = "";
    locationVerified = false;

    setOutletText('Tidak ada outlet terdaftar di sekitar Anda');
    document.getElementById('geofence-warning').classList.remove('hidden');
    if (w) w.classList.add('hidden');
    tryEnableButtons();
    return false;
  }
}

// ============================================================
// GPS RETRY
// ============================================================
async function refreshLokasi() {
  gpsRetryCount++;
  const btn     = document.getElementById('btn-refresh-gps');
  btn.disabled  = true;
  btn.innerText = 'Mencari...';

  try {
    await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async pos => {
          userCoords = {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude
          };
          const ok = await prosesGeofence(userCoords.lat, userCoords.lon);
          if (ok) {
            document.getElementById('gps-retry-panel').classList.add('hidden');
          }
          resolve(ok);
        },
        reject,
        { timeout:10000, enableHighAccuracy:true }
      );
    });
  } catch(e) {
    setOutletText('Gagal mendapat lokasi');
  }

  btn.disabled  = false;
  btn.innerText = `🔄 Refresh Lokasi (${gpsRetryCount}x)`;
  if (gpsRetryCount >= 3) {
    document.getElementById('unverified-panel').classList.remove('hidden');
  }
}

function lanjutTanpaLokasi() {
  locationVerified = false;
  document.getElementById('gps-retry-panel').classList.add('hidden');
  tryEnableButtons();
}

function tampilkanPanelRetry() {
  setOutletText('Lokasi tidak terdeteksi');
  document.getElementById('gps-retry-panel').classList.remove('hidden');
}

// ============================================================
// ENABLE TOMBOL ABSEN
// ============================================================
function tryEnableButtons() {
  if (!modelsReady) return;

  const descriptorSiap = outletDescriptors.length > 0;

  if (locationVerified) {
    document.getElementById('btn-datang').disabled = !descriptorSiap;
    document.getElementById('btn-pulang').disabled = !descriptorSiap;
  } else {
    document.getElementById('btn-datang').disabled = false;
    document.getElementById('btn-pulang').disabled = false;
  }
}
