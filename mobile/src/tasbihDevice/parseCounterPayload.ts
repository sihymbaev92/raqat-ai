/** Decode BLE notify payloads from assorted electronic tasbih firmwares. */
export function parseCounterNotifyPayload(bytes: Uint8Array): {
  increment?: number;
  absolute?: number;
} | null {
  if (!bytes.length) return null;

  if (bytes.length === 1) {
    const b = bytes[0]!;
    if (b === 0) return null;
    if (b <= 10) return { increment: b };
    return { absolute: b };
  }

  if (bytes.length === 2) {
    const absolute = bytes[0]! | (bytes[1]! << 8);
    if (absolute > 0 && absolute <= 9999) return { absolute };
  }

  if (bytes.length === 4) {
    const absolute =
      bytes[0]! | (bytes[1]! << 8) | (bytes[2]! << 16) | (bytes[3]! << 24);
    if (absolute > 0 && absolute <= 999_999) return { absolute };
  }

  try {
    const text = new TextDecoder("utf-8").decode(bytes).trim();
    const inc = text.match(/(?:\+|inc|count)[:\s]*(\d+)/i);
    if (inc) return { increment: Math.min(99, Number(inc[1]) || 1) };
    const abs = text.match(/(\d{1,6})/);
    if (abs) {
      const n = Number(abs[1]);
      if (Number.isFinite(n) && n > 0) return { absolute: n };
    }
  } catch {
    /* ignore */
  }

  return { increment: 1 };
}
