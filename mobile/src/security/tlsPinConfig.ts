/**
 * API TLS SPKI pins (sha256/BASE64).
 * Бос массив = pin әлі орнатылмаған (integrity қорғанысы жұмыс істейді, pin soft-skip).
 * Жаңарту: `node scripts/print-api-tls-pin.mjs` → осы тізімге қосыңыз (ескі pin backup ретінде қалсын).
 */
export const RAQAT_API_TLS_PINS: readonly string[] = [
  // Мысал пішімі: "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
];

export const RAQAT_API_PIN_HOSTS: readonly string[] = ["api.rahatomir.com", "rahatomir.com"];
