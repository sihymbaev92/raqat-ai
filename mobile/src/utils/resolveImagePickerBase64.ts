import { Platform } from "react-native";
import type { ImagePickerAsset } from "expo-image-picker";
import { readAsStringAsync, EncodingType } from "expo-file-system/legacy";

function guessMimeFromUri(uri: string): string {
  const q = uri.split("?")[0]?.toLowerCase() ?? "";
  if (q.endsWith(".png")) return "image/png";
  if (q.endsWith(".webp")) return "image/webp";
  if (q.endsWith(".heic") || q.endsWith(".heif")) return "image/heic";
  if (q.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

/** Picker-дің mime белгісі қате/бос болса, URI-ден болжаймыз. */
export function normalizeHalalImageMime(
  mime: string | undefined,
  assetUri: string
): string {
  const m = (mime ?? "").trim().toLowerCase();
  if (m === "image/jpg") return "image/jpeg";
  if (m) return m;
  return guessMimeFromUri(assetUri);
}

/**
 * Галерея/камера asset-інен base64. Кей Android/iOS кесінділерінде `base64: true` болса да
 * `asset.base64` бос — онда `uri` бойынша оқимыз (content://, ph://, file://).
 */
export async function resolveImagePickerBase64(
  asset: ImagePickerAsset
): Promise<{ base64: string; mime: string } | null> {
  const uri = asset.uri;
  const mime = normalizeHalalImageMime(asset.mimeType ?? undefined, uri ?? "");

  if (asset.base64 && asset.base64.length > 0) {
    return { base64: asset.base64, mime };
  }

  if (!uri) {
    return null;
  }

  if (Platform.OS === "web") {
    try {
      const res = await fetch(uri);
      const blob = await res.blob();
      const buf = await blob.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = "";
      const step = 0x8000;
      for (let i = 0; i < bytes.length; i += step) {
        binary += String.fromCharCode(...bytes.subarray(i, i + step));
      }
      const b64 = btoa(binary);
      if (!b64) return null;
      const wmime =
        mime || (blob.type && blob.type !== "application/octet-stream" ? blob.type : "image/jpeg");
      return { base64: b64, mime: wmime };
    } catch {
      return null;
    }
  }

  try {
    const b64 = await readAsStringAsync(uri, { encoding: EncodingType.Base64 });
    if (!b64 || b64.length < 8) return null;
    return { base64: b64, mime };
  } catch {
    return null;
  }
}
