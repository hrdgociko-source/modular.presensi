// ============================================================
// STATE
// ============================================================
let selectedType      = "";
let currentUser       = null;
let currentOutlet     = "";
let nearestOutlet     = "";
let locationVerified  = true;
let isProcessing      = false;
let gpsRetryCount     = 0;
let modelsReady       = false;
let cachedOutlets     = [];
let outletDescriptors = [];
let streamRef         = null;
let userCoords        = null;
