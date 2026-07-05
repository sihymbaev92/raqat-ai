import { Camera, type BarcodeType } from "expo-camera";

export const HALAL_BARCODE_TYPES: BarcodeType[] = [
  "qr",
  "ean13",
  "ean8",
  "upc_a",
  "upc_e",
  "code128",
  "code39",
  "pdf417",
  "aztec",
];

/** Штрихкод/QR мәтінін нормализациялау (EAN сандарын алу). */
export function normalizeHalalBarcodeData(raw: string): string {
  const trimmed = (raw || "").trim();
  const digits = trimmed.replace(/\D/g, "");
  return digits.length >= 4 ? digits : trimmed;
}

export function pickBestHalalBarcodeFromResults(
  results: Array<{ data?: string | null }> | null | undefined
): string | null {
  if (!results?.length) return null;
  for (const row of results) {
    const normalized = normalizeHalalBarcodeData(row.data ?? "");
    if (normalized.length >= 4) return normalized;
  }
  return null;
}

/** Сурет URI-інен штрихкод/QR оқу (expo-camera scanFromURLAsync). */
export async function scanHalalBarcodeFromImageUri(uri: string): Promise<string | null> {
  const trimmed = (uri || "").trim();
  if (!trimmed) return null;
  const results = await Camera.scanFromURLAsync(trimmed, HALAL_BARCODE_TYPES);
  return pickBestHalalBarcodeFromResults(results);
}
