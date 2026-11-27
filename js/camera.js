// ============================================================
// CAMERA
// ============================================================
function stopStream() {
  if (streamRef) {
    streamRef.getTracks().forEach(t => t.stop());
    streamRef = null;
  }
}

async function startCamera() {
  try {
    stopStream();
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode:"user", width:{ideal:320}, height:{ideal:320} }
    });
    streamRef = stream;
    const video = document.getElementById('video');
    video.srcObject = stream;
    await new Promise(resolve => {
      if (video.readyState >= 2) { resolve(); return; }
      video.addEventListener('canplay', resolve, { once:true });
    });
  } catch(e) {
    setCamStatus('error', 'Kamera tidak bisa diakses!');
  }
}

window.addEventListener('beforeunload', stopStream);
