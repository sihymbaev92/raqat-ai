/**
 * Құран «кітап» қаріптері — APK-та Lateef + Scheherazade (expo-google-fonts).
 * CDN жүктеу опциясы сақталған, бірақ хатым Lateef-ті интернетсіз көрсетеді.
 */
import * as Font from "expo-font";
import { Platform } from "react-native";
import { Lateef_400Regular } from "@expo-google-fonts/lateef";
import { ScheherazadeNew_400Regular } from "@expo-google-fonts/scheherazade-new";
import { QURAN_BOOK_FONT_ENTRIES } from "../services/quranBookFontManifest";
import {
  areQuranBookFontsCached,
  quranBookFontCachePath,
} from "../services/quranFontCache";

let loadPromise: Promise<boolean> | null = null;
let loaded = false;

/** Expo `fontFamily` атаулары — `fontFamily` ретінде дәл осылай. */
export const QURAN_BOOK_FONT_FACE = {
  amiri: "Amiri_400Regular",
  lateef: "Lateef_400Regular",
  scheherazade: "ScheherazadeNew_400Regular",
  /** Madina Uthmani оқу нақыші (Lateef). */
  uthmanic: "Lateef_400Regular",
} as const;

const BUNDLED_BOOK_FONTS: Record<string, number> = {
  [QURAN_BOOK_FONT_FACE.lateef]: Lateef_400Regular,
  [QURAN_BOOK_FONT_FACE.scheherazade]: ScheherazadeNew_400Regular,
};

export async function isQuranBookFontsReady(): Promise<boolean> {
  if (Platform.OS === "web") return true;
  if (loaded) return true;
  return areQuranBookFontsCached();
}

async function loadBundledHatimFonts(): Promise<boolean> {
  try {
    await Font.loadAsync(BUNDLED_BOOK_FONTS);
    return true;
  } catch {
    return false;
  }
}

/** Жүктелген қаріптерді жадқа түсіреді; дайын болмаса false қайтарады. */
export async function loadQuranBookFonts(): Promise<boolean> {
  if (Platform.OS === "web") return true;
  if (loaded) return true;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const bundledOk = await loadBundledHatimFonts();
    if (bundledOk) {
      loaded = true;
      return true;
    }

    const ready = await areQuranBookFontsCached();
    if (!ready) {
      loaded = false;
      return false;
    }
    const map: Record<string, string> = {};
    for (const entry of QURAN_BOOK_FONT_ENTRIES) {
      const path = quranBookFontCachePath(entry);
      if (path) map[entry.faceName] = path;
    }
    if (Object.keys(map).length !== QURAN_BOOK_FONT_ENTRIES.length) {
      return false;
    }
    await Font.loadAsync(map);
    loaded = true;
    return true;
  })();

  try {
    return await loadPromise;
  } finally {
    loadPromise = null;
  }
}

/** Хатым экраны ашылмас бұрын Lateef/Scheherazade дайын болсын. */
export async function ensureHatimBookFontsLoaded(): Promise<boolean> {
  if (Platform.OS === "web") return true;
  if (loaded) return true;
  return loadQuranBookFonts();
}

export function clearQuranBookFontMemoryCache(): void {
  loaded = false;
  loadPromise = null;
}
