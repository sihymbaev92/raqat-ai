import type { BundledJsonName } from "../utils/bundledJsonTypes";

export type ContentPackId =
  | "hatim-arabic"
  | "quran-kk"
  | "quran-translations"
  | "quran-translit"
  | "quran-tajweed"
  | "i18n-offline";

export type ContentPackDef = {
  id: ContentPackId;
  /** APK-ға кіретін pack — орнатудан кейін офлайн дайын. */
  bundledInApk: boolean;
  jsonFiles: readonly BundledJsonName[];
  labelKk: string;
  hintKk: string;
  approxMb: number;
};

/** Хатым Arabic + KK + translit + tajweed APK-та; көптілді аудармалар CDN. */
export const CONTENT_PACKS: readonly ContentPackDef[] = [
  {
    id: "hatim-arabic",
    bundledInApk: true,
    jsonFiles: ["surah-list-api.json", "quran-uthmani-full.json"],
    labelKk: "Хатым Arabic (Uthmani)",
    hintKk: "604 бет араб мәтіні — APK ішінде (офлайн).",
    approxMb: 5,
  },
  {
    id: "quran-kk",
    bundledInApk: true,
    jsonFiles: ["quran-kk-from-db.json"],
    labelKk: "Құран қазақша мағына",
    hintKk: "Сүрелер мен оқу экранындағы қазақша аударма + кирилл транскрипция (APK ішінде).",
    approxMb: 3,
  },
  {
    id: "quran-translations",
    bundledInApk: false,
    jsonFiles: ["quran-translations-offline.json"],
    labelKk: "Құран аудармалары (барлық тіл)",
    hintKk: "Орыс, ағылшын, түрік және басқа офлайн аудармалар (CDN/cache).",
    approxMb: 18,
  },
  {
    id: "quran-translit",
    bundledInApk: true,
    jsonFiles: ["quran-en-transliteration-full.json"],
    labelKk: "Транслитерация",
    hintKk: "Latin әріппен оқуға арналған транслит — APK ішінде.",
    approxMb: 2,
  },
  {
    id: "quran-tajweed",
    bundledInApk: true,
    jsonFiles: ["quran-tajweed-offline.json"],
    labelKk: "Тәжуид белгілері",
    hintKk: "Хатым/мұсаф режимінде түсті тәжуид мәтіні — APK ішінде.",
    approxMb: 2,
  },
  {
    id: "i18n-offline",
    bundledInApk: true,
    jsonFiles: ["offline-auto-translations-apk.json"],
    labelKk: "Интерфейс аудармалары",
    hintKk: "ru/en/ky/uz/tr/ar UI — APK ішінде (~0.6 MB). Толық сөздік CDN-де қосымша.",
    approxMb: 1,
  },
] as const;

export function contentPackById(id: ContentPackId): ContentPackDef {
  const hit = CONTENT_PACKS.find((p) => p.id === id);
  if (!hit) throw new Error(`unknown content pack: ${id}`);
  return hit;
}

export function jsonFileToContentPackId(name: BundledJsonName): ContentPackId | null {
  for (const pack of CONTENT_PACKS) {
    if (pack.jsonFiles.includes(name)) return pack.id;
  }
  return null;
}
