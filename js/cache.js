// ============================================================
// CACHE — OUTLETS
// ============================================================
async function loadOutletsCache() {
  let remoteVer = 0;
  try {
    remoteVer = (await apiGet({
      action:'get_cache_version', key:'outlets'
    })).version || 0;
  } catch(e) {
    console.warn('[Cache] Cek versi gagal, lanjut fetch langsung');
  }

  const localVer = parseInt(localStorage.getItem(KEY_VER_OUTLETS) || '0');
  const cached   = localStorage.getItem(KEY_OUTLETS);

  if (remoteVer && localVer >= remoteVer && cached && JSON.parse(cached).length) {
    return JSON.parse(cached);
  }

  try {
    const data = await apiGet({ action:'get_outlets_full' });
    if (data.outlets && data.outlets.length > 0) {
      localStorage.setItem(KEY_OUTLETS, JSON.stringify(data.outlets));
      localStorage.setItem(KEY_VER_OUTLETS, String(remoteVer || Date.now()));
      return data.outlets;
    }
  } catch(e) {
    console.warn('[Cache] Gagal load outlets:', e);
  }
  return cached ? JSON.parse(cached) : [];
}

// ============================================================
// CACHE — DESCRIPTOR
// ============================================================
async function loadDescriptorCache(outlet) {
  if (!outlet) return [];
  const cacheKey = KEY_DESC_PREFIX + outlet;
  const verKey   = KEY_VER_PREFIX  + outlet;

  try {
    const remoteVer = (await apiGet({
      action:'get_cache_version', key:'desc_' + outlet
    })).version || 0;
    const localVer = parseInt(localStorage.getItem(verKey) || '0');

    if (localVer >= remoteVer && localVer > 0) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        console.log(`[Cache] Descriptor ${outlet} dari localStorage`);
        return JSON.parse(cached);
      }
    }

    console.log(`[Cache] Fetch descriptor ${outlet} dari GAS`);
    const data = await apiGet({ action:'get_descriptor_outlet', outlet });
    if (data.karyawan) {
      localStorage.setItem(cacheKey, JSON.stringify(data.karyawan));
      localStorage.setItem(verKey,   String(remoteVer || Date.now()));
    }
    return data.karyawan || [];

  } catch(e) {
    console.warn('[Cache] Gagal load descriptor:', e);
    const cached = localStorage.getItem(cacheKey);
    return cached ? JSON.parse(cached) : [];
  }
}
