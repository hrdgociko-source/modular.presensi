// ============================================================
// CONFIG
// ============================================================
const GAS_URL              = "https://script.google.com/macros/s/AKfycbzokdcqz448IveXYX4NU38ddnFofe8y_DTtFvbPi4drO_HSxfpo5pRBZOVVgg85G9fv/exec";
const MODEL_SOURCES        = ['./models/'];   // model AI wajah lokal (folder www/models)
const FACE_MATCH_THRESHOLD = 0.52;
const HEAD_MOVE_RATIO      = 0.08;
const SHAKE_TIMEOUT_MS     = 8000;
const SAMPLE_MS            = 100;
const DEBUG_MODE           = true;  // true = tampilkan tombol Cek Cache Info (ubah false saat rilis)

const KEY_OUTLETS     = 'gociko_outlets';
const KEY_VER_OUTLETS = 'gociko_ver_outlets';
const KEY_DESC_PREFIX = 'gociko_desc_';
const KEY_VER_PREFIX  = 'gociko_ver_desc_';
