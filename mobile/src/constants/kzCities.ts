import { KZ_CITY_PRESETS_LIST, type KzCityPreset } from "./kzCityPresetsList";
import { haversineDistanceM } from "../utils/halalGeoFilter";

/** Сақталған атау / ескі жазбалар үшін тізімдегі `city` кілтіне түсіру. */
const CITY_KEY_ALIASES: Record<string, string> = {
  "nur-sultan": "Astana",
  nursultan: "Astana",
  "ust-kamenogorsk": "Oskemen",
  ustkamenogorsk: "Oskemen",
  uralsk: "Oral",
  chimkent: "Shymkent",
  "alma-ata": "Almaty",
  almaata: "Almaty",
  "нұр-сұлтан": "Astana",
  нұрсұлтан: "Astana",
  астана: "Astana",
  алматы: "Almaty",
  шымкент: "Shymkent",
  ақтау: "Aktau",
  ақтөбе: "Aktobe",
  атырау: "Atyrau",
  қарағанды: "Karaganda",
  қызылорда: "Kyzylorda",
  қостанай: "Kostanay",
  орал: "Oral",
  өскемен: "Oskemen",
  павлодар: "Pavlodar",
  семей: "Semey",
  тараз: "Taraz",
  түркістан: "Turkistan",
};

function canonicalCityKey(raw: string): string {
  const t = (raw ?? "").trim();
  if (!t) return t;
  const compact = t.toLowerCase().replace(/[\s_-]+/g, "");
  const byAlias = CITY_KEY_ALIASES[t.toLowerCase()] ?? CITY_KEY_ALIASES[compact];
  if (byAlias) return byAlias;
  const byLabel = KZ_CITY_PRESETS_LIST.find((p) => p.label.toLowerCase() === t.toLowerCase());
  return byLabel?.city ?? t;
}

function isKazakhstanCountry(raw: string): boolean {
  const t = (raw ?? "").trim().toLowerCase();
  if (!t) return true;
  return t === "kazakhstan" || t === "қазақстан" || t === "казахстан" || t === "kz";
}

/** Қазақша атау бойынша (экран тізімі). */
export const KZ_CITY_PRESETS: KzCityPreset[] = [...KZ_CITY_PRESETS_LIST].sort((a, b) =>
  a.label.localeCompare(b.label, "kk")
);

/** Аладханға жіберетін ағылшынша атау → басты экранда көрсетілетін қазақша атау */
export function cityLabelKkForApiName(city: string): string {
  return cityLabelForLocale(city, "kk");
}

/** API атауы немесе сақталған жазба → UI тіліне сәйкес қала атауы. */
export function cityLabelForLocale(
  city: string,
  locale: string,
  opts?: { tr?: (text: string) => string }
): string {
  const want = canonicalCityKey(city);
  const hit = KZ_CITY_PRESETS.find((p) => p.city.toLowerCase() === want.toLowerCase());
  if (locale === "en") return hit?.city ?? city.trim();
  if (locale === "kk") return hit?.label ?? city.trim();
  const kkLabel = hit?.label ?? city.trim();
  if (opts?.tr) return opts.tr(kkLabel);
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { resolveKkAutoTranslationText } = require("../quran/useKkAutoTranslator") as typeof import("../quran/useKkAutoTranslator");
    return resolveKkAutoTranslationText(kkLabel, locale, {});
  } catch {
    return locale === "kk" ? kkLabel : hit?.city ?? city.trim();
  }
}

/** Намаз / құбыла: тізімдегі қала үшін WGS84 координат (null — қолмен қаланы іздеу). */
export function getKzPresetCoords(city: string, country: string): { lat: number; lon: number } | null {
  if (!isKazakhstanCountry(country)) return null;
  const want = canonicalCityKey(city);
  const hit = KZ_CITY_PRESETS.find((p) => p.city.toLowerCase() === want.toLowerCase());
  if (!hit) return null;
  return { lat: hit.lat, lon: hit.lon };
}

/** Құбыла үшін қала орталығының шамамен координаталары (GPS болмағанда). */
export function getCityApproxCoords(city: string): { lat: number; lon: number } | null {
  return getKzPresetCoords(city, "Kazakhstan");
}

/** Қазақстан шамамен шекарасы (WGS84) — GPS автоматты қаланы таңдау үшін. */
export function isInKazakhstanBBox(lat: number, lon: number): boolean {
  return lat >= 40.2 && lat <= 55.6 && lon >= 46.2 && lon <= 87.5;
}

/** GPS координатынан ең жақын ҚР қала пресеті. */
export function findNearestKzCityPreset(
  lat: number,
  lon: number
): (KzCityPreset & { distanceM: number }) | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  let best: KzCityPreset | null = null;
  let bestD = Number.POSITIVE_INFINITY;
  for (const preset of KZ_CITY_PRESETS_LIST) {
    const d = haversineDistanceM(lat, lon, preset.lat, preset.lon);
    if (d < bestD) {
      bestD = d;
      best = preset;
    }
  }
  return best ? { ...best, distanceM: bestD } : null;
}

/** Геокод / IP атауы бойынша ҚР қала пресеті. */
export function findKzCityPresetByName(name: string, _country?: string): KzCityPreset | null {
  const norm = name.trim().toLowerCase();
  if (!norm) return null;
  for (const preset of KZ_CITY_PRESETS_LIST) {
    if (preset.city.toLowerCase() === norm) return preset;
    if (preset.label.toLowerCase() === norm) return preset;
    if (cityLabelKkForApiName(preset.city).toLowerCase() === norm) return preset;
  }
  return null;
}
