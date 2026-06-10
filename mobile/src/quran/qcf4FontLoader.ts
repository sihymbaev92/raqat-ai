import * as Font from "expo-font";
import { Platform } from "react-native";
import { getQcf4UpstreamBaseUrl, mushafQcf4FontFileUrl } from "../config/mushafPagesBase";

const loaded = new Set<string>();
const inflight = new Map<string, Promise<boolean>>();

/** Expo fontFamily атауы — QCF4 glyph Text үшін. */
export function qcf4FontFamilyName(fontId: string): string {
  return `QCF4_${fontId.replace(/[^A-Za-z0-9_]/g, "_")}`;
}

export function qcf4FontFileName(fontId: string): string {
  if (fontId === "QCF4_QBSML") return "QCF4_QBSML.ttf";
  return `${fontId}_W.ttf`;
}

/** Барлық fontId жүктелсе true; кем дегенде біреуі сәтсіз болса false. */
export async function ensureQcf4FontsLoaded(fontIds: string[]): Promise<boolean> {
  const unique = [...new Set(fontIds.filter(Boolean))];
  if (!unique.length) return true;
  const results = await Promise.all(unique.map((id) => loadQcf4Font(id)));
  return results.every(Boolean);
}

const QCF4_FONT_LOAD_TIMEOUT_MS = 12_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), ms);
    }),
  ]);
}

function injectWebFontFaceCss(family: string, uri: string): void {
  if (typeof document === "undefined") return;
  const id = `qcf4-css-${family}`;
  let el = document.getElementById(id) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = `@font-face{font-family:"${family}";src:url("${uri}") format("woff2");font-display:swap;}`;
}

async function verifyWebFontReady(family: string): Promise<boolean> {
  if (typeof document === "undefined" || !document.fonts) return false;
  try {
    await document.fonts.load(`16px "${family}"`);
    return document.fonts.check(`16px "${family}"`);
  } catch {
    return false;
  }
}

async function loadQcf4FontWeb(fontId: string, family: string, uris: string[]): Promise<boolean> {
  for (const uri of uris) {
    try {
      if (typeof FontFace !== "undefined" && typeof document !== "undefined" && document.fonts) {
        const face = new FontFace(family, `url("${uri}") format("woff2")`);
        const loadedFace = await withTimeout(face.load(), QCF4_FONT_LOAD_TIMEOUT_MS);
        if (!loadedFace) continue;
        document.fonts.add(face);
        injectWebFontFaceCss(family, uri);
        loaded.add(fontId);
        return true;
      }
      injectWebFontFaceCss(family, uri);
      if (await verifyWebFontReady(family)) {
        loaded.add(fontId);
        return true;
      }
    } catch {
      /* try next */
    }
  }
  return false;
}

function qcf4WebFontUris(localUri: string, upstreamUri: string): string[] {
  if (typeof window === "undefined") return [localUri, upstreamUri];
  try {
    const localOrigin = new URL(localUri, window.location.href).origin;
    const pageOrigin = window.location.origin;
    if (localOrigin !== pageOrigin) {
      // Localhost/dev cannot use rahatomir.com fonts unless CORS is enabled.
      return [upstreamUri, localUri];
    }
  } catch {
    /* keep default order */
  }
  return [localUri, upstreamUri];
}

async function loadQcf4Font(fontId: string): Promise<boolean> {
  if (loaded.has(fontId)) return true;
  const pending = inflight.get(fontId);
  if (pending) return pending;

  const family = qcf4FontFamilyName(fontId);
  const task = (async () => {
    const ext = Platform.OS === "web" ? "woff2" : "ttf";
    const dir = ext === "woff2" ? "fonts-woff2" : "fonts";
    const file =
      fontId === "QCF4_QBSML"
        ? ext === "woff2"
          ? "QCF4_QBSML.woff2"
          : "QCF4_QBSML.ttf"
        : ext === "woff2"
          ? `${fontId}_W.woff2`
          : `${fontId}_W.ttf`;
    const uris = [
      mushafQcf4FontFileUrl(fontId, ext),
      `${getQcf4UpstreamBaseUrl()}/${dir}/${file}`,
    ];
    if (Platform.OS === "web") {
      return loadQcf4FontWeb(fontId, family, qcf4WebFontUris(uris[0]!, uris[1]!));
    }
    for (const uri of uris) {
      try {
        const loadedOk = await withTimeout(
          Font.loadAsync({ [family]: uri }).then(() => true),
          QCF4_FONT_LOAD_TIMEOUT_MS
        );
        if (loadedOk) {
          loaded.add(fontId);
          return true;
        }
      } catch {
        /* try next */
      }
    }
    return false;
  })();

  inflight.set(fontId, task);
  try {
    return await task;
  } finally {
    inflight.delete(fontId);
  }
}

export function clearQcf4FontLoaderCache(): void {
  loaded.clear();
  inflight.clear();
}
