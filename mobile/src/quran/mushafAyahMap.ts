import { mushafAyahMapRemoteUrl } from "../config/mushafPagesBase";
import type { MushafBookAyah, MushafBookPageSlice } from "./mushafBookTypes";

/** Нормалized 0..1 координат — WebP бетінде аят басу аймағы. */
export type MushafAyahMapHotspot = {
  surah: number;
  ayah: number;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type MushafAyahMapFile = {
  version: 1;
  edition: "hafs-604";
  pages: Record<string, MushafAyahMapHotspot[]>;
};

let cachedMap: MushafAyahMapFile | null = null;
let loadPromise: Promise<MushafAyahMapFile | null> | null = null;

function isValidMap(data: unknown): data is MushafAyahMapFile {
  if (!data || typeof data !== "object") return false;
  const o = data as MushafAyahMapFile;
  return o.version === 1 && o.edition === "hafs-604" && o.pages != null && typeof o.pages === "object";
}

/** CDN-нен ayah_map.json — WebP режимінде аят басу аймақтары. */
export async function loadMushafAyahMap(): Promise<MushafAyahMapFile | null> {
  if (cachedMap) return cachedMap;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const r = await fetch(mushafAyahMapRemoteUrl(), { cache: "no-store" });
      if (!r.ok) return null;
      const data: unknown = await r.json();
      if (!isValidMap(data)) return null;
      cachedMap = data;
      return data;
    } catch {
      return null;
    } finally {
      loadPromise = null;
    }
  })();

  return loadPromise;
}

export function getMushafAyahMapHotspots(
  map: MushafAyahMapFile | null,
  pageNumber: number
): MushafAyahMapHotspot[] | null {
  if (!map) return null;
  const key = String(pageNumber);
  const rows = map.pages[key];
  return rows?.length ? rows : null;
}

/** ayah_map жоқ болса — бет аяттары бойынша тік жолақтар (шамамен). */
export function fallbackMushafAyahHotspots(page: MushafBookPageSlice): MushafAyahMapHotspot[] {
  const n = page.ayahs.length;
  if (!n) return [];
  const top = 0.06;
  const bandH = 0.88 / n;
  return page.ayahs.map((a: MushafBookAyah, i: number) => ({
    surah: a.surahNumber,
    ayah: a.numberInSurah,
    x: 0.04,
    y: top + i * bandH,
    w: 0.92,
    h: bandH,
  }));
}

export function clearMushafAyahMapCache(): void {
  cachedMap = null;
  loadPromise = null;
}
