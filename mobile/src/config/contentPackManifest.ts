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

/** Хатым Arabic әрқашан APK-та; қалғаны CDN + local cache. */
export const CONTENT_PACKS: readonly ContentPackDef[] = [
  {
    id: "hatim-arabic",
    bundledInApk: false,
    jsonFiles: ["surah-list-api.json", "quran-uthmani-full.json"],
    labelKk: "Хатым Arabic (Uthmani)",
    hintKk: "604 бет араб мәтіні — бірінші ашқанда CDN/cache (APK slim).",
    approxMb: 5,
  },
  {
    id: "quran-kk",
    bundledInApk: false,
    jsonFiles: ["quran-kk-from-db.json"],
    labelKk: "Құран қазақша мағына",
    hintKk: "Сүрелер мен оқу экранындағы қазақша аударма.",
    approxMb: 3,
  },
  {
    id: "quran-translations",
    bundledInApk: false,
    jsonFiles: ["quran-translations-offline.json"],
    labelKk: "Құран аудармалары (барлық тіл)",
    hintKk: "Орыс, ағылшын, түрік және басқа офлайн аудармалар.",
    approxMb: 18,
  },
  {
    id: "quran-translit",
    bundledInApk: false,
    jsonFiles: ["quran-en-transliteration-full.json"],
    labelKk: "Транслитерация",
    hintKk: "Лatin әріппен оқуға арналған транслит.",
    approxMb: 2,
  },
  {
    id: "quran-tajweed",
    bundledInApk: false,
    jsonFiles: ["quran-tajweed-offline.json"],
    labelKk: "Тәжуид белгілері",
    hintKk: "Хатым/мұсаф режимінде түсті тәжуид мәтіні.",
    approxMb: 2,
  },
  {
    id: "i18n-offline",
    bundledInApk: false,
    jsonFiles: ["offline-auto-translations-core.json"],
    labelKk: "Интерфейс аудармалары",
    hintKk: "Орыс, ағылшын, қырғыз, өзбек, түрік, араб UI.",
    approxMb: 42,
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
