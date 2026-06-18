import { KZ_CITY_PRESETS_LIST, type KzCityPreset } from "./kzCityPresetsList";

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
  const want = canonicalCityKey(city);
  const hit = KZ_CITY_PRESETS.find((p) => p.city.toLowerCase() === want.toLowerCase());
  return hit?.label ?? city.trim();
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
