// ============================================================
// API
// ============================================================
async function apiGet(params) {
  const url = GAS_URL + '?' + new URLSearchParams(params).toString();
  const res  = await fetch(url);
  return res.json();
}

async function postAbsensi(payload) {
  const res = await fetch(GAS_URL, {
    method : "POST",
    headers: { "Content-Type": "text/plain" },
    body   : JSON.stringify(payload)
  });
  return res.json();
}
