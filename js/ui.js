// ============================================================
// UI HELPERS
// ============================================================
function showSection(id) {
  ['section-loading','section-main','section-camera',
   'section-konfirmasi','section-processing','section-success']
  .forEach(s => {
    const el = document.getElementById(s);
    if (el) s === id
      ? el.classList.remove('hidden')
      : el.classList.add('hidden');
  });
}

function setCamStatus(type, text) {
  const badge  = document.getElementById('cam-status-badge');
  const textEl = document.getElementById('cam-status-text');

  badge.querySelectorAll('.dot').forEach(d => d.remove());

  badge.className  = 'status-badge status-' + type;
  textEl.innerText = text;

  const dot = document.createElement('span');
  dot.className =
    'dot' + (type === 'warning' || type === 'info' ? ' pulse' : '');
  badge.prepend(dot);

  const c = document.getElementById('video-container');
  if (!c.classList.contains('scanning') &&
      !c.classList.contains('blink-mode')) {
    c.className = '';
    if (type === 'success') c.classList.add('success');
    if (type === 'error')   c.classList.add('error');
    if (type === 'warning') c.classList.add('scanning');
  }
}

function setOutletText(t) {
  const el = document.getElementById('outlet-text');
  if (el) el.innerText = t;
}

function setLoadingText(t) {
  const el = document.getElementById('loading-text');
  if (el) el.innerText = t;
}

// ============================================================
// SUCCESS SCREEN
// ============================================================
function row(label, value) {
  return `<div class="flex justify-between">
    <span>${label}</span>
    <span class="font-bold text-gray-700">${value}</span>
  </div>`;
}

function showSuccessScreen(timestamp, outlet) {
  const isDatang  = selectedType === 'DATANG';
  const salamNama = isDatang
    ? `Assalamu'alaikum ${currentUser.nama},`
    : `Wassalamu'alaikum ${currentUser.nama},`;

  document.getElementById('success-name').innerText   = salamNama;
  document.getElementById('success-detail').innerText =
    isDatang ? 'Selamat bekerja! 💪' : 'Sampai jumpa! 👋';

  const tz  = 'Asia/Jakarta';
  const jam = timestamp.toLocaleTimeString('id-ID',
    { hour:'2-digit', minute:'2-digit', timeZone:tz });
  const tgl = timestamp.toLocaleDateString('id-ID',
    { weekday:'long', day:'numeric', month:'long', timeZone:tz });

  document.getElementById('success-info').innerHTML =
    row('🪪 NIK',     currentUser.nik) +
    row('📍 Outlet',  outlet) +
    row('🕐 Jam',     jam + ' WIB') +
    row('📅 Tanggal', tgl) +
    (!locationVerified
      ? `<div class="flex justify-between text-amber-600">
           <span>⚠️ Lokasi</span>
           <span class="font-bold">Unverified Location</span>
         </div>`
      : '');

  showSection('section-success');
}

// ============================================================
// DEBUG PANEL
// ============================================================
function showCacheInfo() {
  const panel = document.getElementById('debug-panel');
  if (!panel) return;

  if (!panel.classList.contains('hidden')) {
    panel.classList.add('hidden');
    return;
  }

  const outletKey = KEY_DESC_PREFIX + (currentOutlet || nearestOutlet);
  const cached    = localStorage.getItem(outletKey);
  const karyawan  = cached ? JSON.parse(cached) : [];

  function sizeOf(key) {
    const val  = localStorage.getItem(key) || '';
    const size = new Blob([val]).size;
    return size > 1024 ? (size / 1024).toFixed(1) + 'KB' : size + 'B';
  }

  const lines = [
    `=== GOCIKO DEBUG ===`,
    `Outlet aktif     : ${currentOutlet  || '(kosong)'}`,
    `Outlet terdekat  : ${nearestOutlet  || '(kosong)'}`,
    `locationVerified : ${locationVerified}`,
    `modelsReady      : ${modelsReady}`,
    `Descriptors load : ${outletDescriptors.length} orang`,
    `localStorage desc: ${karyawan.length} orang`,
    ``,
    `Karyawan di cache:`,
    ...karyawan.map(k =>
      `  ${k.nik} | ${k.nama} | ` +
      `wajah: ${k.wajah ? k.wajah.length + ' floats' : 'KOSONG'}`
    ),
    ``,
    `localStorage (gociko_*):`,
    ...Object.keys(localStorage)
      .filter(k => k.startsWith('gociko'))
      .map(k => `  ${k} (${sizeOf(k)})`)
  ];

  panel.innerText = lines.join('\n');
  panel.classList.remove('hidden');
}
