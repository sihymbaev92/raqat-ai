import * as Font from "expo-font";
import { Platform } from "react-native";
import {
  mushafQcf4ColrFontUrl,
  mushafQcf4ColrOtSvgFontUrl,
} from "../config/mushafPagesBase";
import {
  injectQcf4ColrPaletteCss,
  qcf4ColrWebClassName,
  clearQcf4ColrPaletteCssCache,
} from "./qcf4ColrPalette";
import {
  qcf4ColrBasePaletteIndex,
  type Qcf4ColrPaletteTheme,
} from "./qcf4ColrTheme";

const loaded = new Set<string>();
const inflight = new Map<string, Promise<boolean>>();
const QCF4_COLR_FONT_LOAD_TIMEOUT_MS = 14_000;

function colrCacheKey(page: number, theme: Qcf4ColrPaletteTheme): string {
  return `${page}:${theme}`;
}

function isColrDisabledByEnv(): boolean {
  return process.env.EXPO_PUBLIC_QCF4_COLR_DISABLED === "1";
}

function isFirefox(): boolean {
  if (typeof navigator === "undefined") return false;
  return /firefox/i.test(navigator.userAgent);
}

function useOtSvgForTheme(theme: Qcf4ColrPaletteTheme): boolean {
  if (Platform.OS !== "web") return true;
  return isFirefox() && theme === "dark";
}

function colrFontUrls(page: number, theme: Qcf4ColrPaletteTheme): string[] {
  const ext = Platform.OS === "web" ? "woff2" : "ttf";
  if (useOtSvgForTheme(theme)) {
    return [mushafQcf4ColrOtSvgFontUrl(page, theme, ext)];
  }
  return [mushafQcf4ColrFontUrl(page, ext), mushafQcf4ColrOtSvgFontUrl(page, theme, ext)];
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), ms);
    }),
  ]);
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

async function loadColrFontWeb(
  family: string,
  urls: string[],
  theme: Qcf4ColrPaletteTheme
): Promise<boolean> {
  for (const uri of urls) {
    try {
      if (typeof FontFace !== "undefined" && typeof document !== "undefined" && document.fonts) {
        const face = new FontFace(family, `url("${uri}") format("woff2")`);
        const loadedFace = await withTimeout(face.load(), QCF4_COLR_FONT_LOAD_TIMEOUT_MS);
        if (!loadedFace) continue;
        document.fonts.add(face);
        if (!useOtSvgForTheme(theme)) {
          injectQcf4ColrPaletteCss(family, qcf4ColrBasePaletteIndex(theme), theme);
        }
        return true;
      }
      if (await verifyWebFontReady(family)) return true;
    } catch {
      /* try next */
    }
  }
  return false;
}

/** COLR V4 tajweed fonts (Quran Foundation CDN). */
export function qcf4ColrTajweedEnabledOnPlatform(): boolean {
  if (isColrDisabledByEnv()) return false;
  return Platform.OS === "android" || Platform.OS === "ios" || Platform.OS === "web";
}

export function qcf4ColrFontFamilyName(page: number): string {
  const p = Math.max(1, Math.min(604, Math.floor(page)));
  return `QCF4V4_p${p}`;
}

export async function ensureQcf4ColrPageFontLoaded(
  page: number,
  theme: Qcf4ColrPaletteTheme
): Promise<boolean> {
  if (!qcf4ColrTajweedEnabledOnPlatform()) return false;

  const p = Math.max(1, Math.min(604, Math.floor(page)));
  const key = colrCacheKey(p, theme);
  if (loaded.has(key)) return true;

  const pending = inflight.get(key);
  if (pending) return pending;

  const family = qcf4ColrFontFamilyName(p);
  const urls = colrFontUrls(p, theme);

  const task = (async () => {
    try {
      if (Platform.OS === "web") {
        const ok = await loadColrFontWeb(family, urls, theme);
        if (ok) loaded.add(key);
        return ok;
      }

      for (const uri of urls) {
        try {
          await Font.loadAsync({ [family]: uri });
          loaded.add(key);
          return true;
        } catch {
          /* try next */
        }
      }
      return false;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, task);
  return task;
}

export function qcf4ColrTextClassName(
  page: number,
  theme: Qcf4ColrPaletteTheme
): string | undefined {
  if (Platform.OS !== "web") return undefined;
  if (useOtSvgForTheme(theme)) return undefined;
  return qcf4ColrWebClassName(qcf4ColrFontFamilyName(page), theme);
}

export function clearQcf4ColrFontLoaderCache(): void {
  loaded.clear();
  inflight.clear();
  clearQcf4ColrPaletteCssCache();
}
