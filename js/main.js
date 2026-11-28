// ============================================================
// STARTUP
// ============================================================
window.onload = async () => {
  setLoadingText('Memuat data outlet & sensor wajah...');

  // GPS mulai lebih awal — paralel dengan load lain
  const gpsPromise = new Promise(resolve => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      pos => resolve(pos),
      ()  => resolve(null),
      { timeout:15000, enableHighAccuracy:true }
    );
  });

  // Load outlets + model PARALEL
  const [outletsData] = await Promise.all([
    loadOutletsCache(),
    loadModels()
  ]);
  cachedOutlets = outletsData;
  console.log(`[Gociko] ${cachedOutlets.length} outlet dimuat`);

  showSection('section-main');

  if (DEBUG_MODE) {
    const dw = document.getElementById('debug-wrapper');
    if (dw) dw.classList.remove('hidden');
  }

  if (!navigator.geolocation) {
    setOutletText('GPS Tidak Didukung');
    return;
  }

  const pos = await gpsPromise;
  if (pos) {
    userCoords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
    await prosesGeofence(userCoords.lat, userCoords.lon);
  } else {
    setOutletText('GPS Tidak Aktif');
    tampilkanPanelRetry();
  }
};
