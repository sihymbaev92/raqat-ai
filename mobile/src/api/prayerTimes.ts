/**
 * Қазақстан қалалары үшін ҚМДБ/Muftyat.kz ресми кестесі primary.
 * Aladhan ашық API (токенсіз) — fallback және Қазақстаннан тыс қалалар үшін.
 * https://aladhan.com/prayer-times-api
 * school=1 (Hanafi) — бесіннен кейінгі екінті (Asr) шафи есебінен гөрі ханафиға сәйкес;
 * method=2 (ISNA, 15°) — Қазақстанда жазғы таң уақытын 18° әдісінен ертерек шығармайды
 *   (мысалы, Шымкент 03.06.2026: method=3 → 02:37, method=2 → 03:05).
 */
import { cityLabelKkForApiName, getKzPresetCoords } from "../constants/kzCities";

const ALADHAN_BY_CITY = "https://api.aladhan.com/v1/timingsByCity";
const ALADHAN_TIMINGS = "https://api.aladhan.com/v1/timings";
const MUFTYAT_CITIES = "https://api.muftyat.kz/cities/";
const MUFTYAT_PRAYER_TIMES = "https://api.muftyat.kz/prayer-times";

const FETCH_TIMEOUT_MS = 25_000;
export const APP_PRAYER_CALCULATION_METHOD = 2;
export const APP_PRAYER_ASR_SCHOOL = 1; // Aladhan: 1 = Hanafi (Asr shadow factor 2)

type MuftyatCity = {
  title?: string;
  lat?: string;
  lng?: string;
};

type MuftyatPrayerRow = {
  fajr?: string;
  sunrise?: string;
  dhuhr?: string;
  asr?: string;
  maghrib?: string;
  isha?: string;
  Date?: string;
};

const muftyatCityCache = new Map<string, Promise<MuftyatCity | null>>();
const muftyatYearCache = new Map<string, Promise<MuftyatPrayerRow[]>>();

async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: c.signal });
  } finally {
    clearTimeout(t);
  }
}

export type PrayerTimesResult = {
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  source?: "muftyat" | "aladhan";
  date: string;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  error?: string;
};

export function shiftPrayerTime(hhmm: string, shiftMin: number): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec((hhmm || "").trim());
  if (!m) return hhmm;
  const hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return hhmm;
  let total = hh * 60 + mm + Math.trunc(shiftMin);
  while (total < 0) total += 24 * 60;
  total %= 24 * 60;
  const nh = String(Math.floor(total / 60)).padStart(2, "0");
  const nm = String(total % 60).padStart(2, "0");
  return `${nh}:${nm}`;
}

export function applyPrayerTimeShift(data: PrayerTimesResult, shiftMin: number): PrayerTimesResult {
  if (data.error || shiftMin === 0) return data;
  return {
    ...data,
    fajr: shiftPrayerTime(data.fajr, shiftMin),
    sunrise: shiftPrayerTime(data.sunrise, shiftMin),
    dhuhr: shiftPrayerTime(data.dhuhr, shiftMin),
    asr: shiftPrayerTime(data.asr, shiftMin),
    maghrib: shiftPrayerTime(data.maghrib, shiftMin),
    isha: shiftPrayerTime(data.isha, shiftMin),
  };
}

function normalizeTime(value: string): string {
  if (!value) return "";
  return value.split(/\s+/)[0]?.trim() ?? "";
}

type PrayerResultCoords = { latitude: number; longitude: number };

function isKazakhstanCountry(raw: string): boolean {
  const t = (raw ?? "").trim().toLowerCase();
  if (!t) return true;
  return t === "kazakhstan" || t === "қазақстан" || t === "казахстан" || t === "kz";
}

function formatLocalIsoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseNumber(raw: unknown): number | null {
  const n = typeof raw === "number" ? raw : parseFloat(String(raw ?? ""));
  return Number.isFinite(n) ? n : null;
}

function citySearchKey(city: string, country: string): string | null {
  if (!isKazakhstanCountry(country)) return null;
  return cityLabelKkForApiName(city).replace(/\s+қаласы$/i, "").trim() || city.trim();
}

function isLikelyCityMatch(row: MuftyatCity, query: string): boolean {
  const title = (row.title ?? "").trim().toLowerCase();
  const q = query.trim().toLowerCase();
  if (!title || !q) return false;
  return title === q || title === `${q} қаласы` || title.startsWith(`${q} `);
}

async function fetchMuftyatCity(city: string, country: string): Promise<MuftyatCity | null> {
  const query = citySearchKey(city, country);
  if (!query) return null;
  const key = query.toLowerCase();
  const cached = muftyatCityCache.get(key);
  if (cached) return cached;

  const task = (async () => {
    const url = `${MUFTYAT_CITIES}?search=${encodeURIComponent(query)}`;
    const r = await fetchWithTimeout(url, {}, FETCH_TIMEOUT_MS);
    if (!r.ok) return null;
    const payload = (await r.json()) as { results?: MuftyatCity[] };
    const rows = Array.isArray(payload.results) ? payload.results : [];
    return rows.find((row) => isLikelyCityMatch(row, query)) ?? rows[0] ?? null;
  })().catch(() => null);
  muftyatCityCache.set(key, task);
  return task;
}

async function fetchMuftyatYearRows(year: number, lat: number, lng: number): Promise<MuftyatPrayerRow[]> {
  const key = `${year}:${lat}:${lng}`;
  const cached = muftyatYearCache.get(key);
  if (cached) return cached;

  const task = (async () => {
    const url = `${MUFTYAT_PRAYER_TIMES}/${year}/${lat}/${lng}`;
    const r = await fetchWithTimeout(url, {}, FETCH_TIMEOUT_MS);
    if (!r.ok) return [];
    const payload = (await r.json()) as { result?: MuftyatPrayerRow[] };
    return Array.isArray(payload.result) ? payload.result : [];
  })().catch(() => []);
  muftyatYearCache.set(key, task);
  return task;
}

export function parseMuftyatPrayerRow(
  row: MuftyatPrayerRow,
  city: string,
  country: string,
  coords: PrayerResultCoords
): PrayerTimesResult {
  return {
    city,
    country,
    latitude: coords.latitude,
    longitude: coords.longitude,
    source: "muftyat",
    date: row.Date ?? "",
    fajr: normalizeTime(row.fajr ?? ""),
    sunrise: normalizeTime(row.sunrise ?? ""),
    dhuhr: normalizeTime(row.dhuhr ?? ""),
    asr: normalizeTime(row.asr ?? ""),
    maghrib: normalizeTime(row.maghrib ?? ""),
    isha: normalizeTime(row.isha ?? ""),
  };
}

async function fetchPrayerTimesByMuftyatForDate(
  city: string,
  country: string,
  when: Date
): Promise<PrayerTimesResult | null> {
  const officialCity = await fetchMuftyatCity(city, country);
  const lat = parseNumber(officialCity?.lat);
  const lng = parseNumber(officialCity?.lng);
  if (lat == null || lng == null) return null;

  const rows = await fetchMuftyatYearRows(when.getFullYear(), lat, lng);
  const day = formatLocalIsoDate(when);
  const row = rows.find((item) => item.Date === day);
  if (!row) return null;

  return parseMuftyatPrayerRow(row, city, country, { latitude: lat, longitude: lng });
}

/** Aladhan JSON → қолданба пішіні (unit-тестте де қолданылады) */
export function parseAladhanPayload(
  payload: unknown,
  city: string,
  country: string,
  coords?: PrayerResultCoords
): PrayerTimesResult {
  const data = (payload as { data?: Record<string, unknown> })?.data;
  const timings = (data?.timings ?? {}) as Record<string, string>;
  const meta = (data?.date ?? {}) as Record<string, unknown>;
  const readable =
    (meta?.readable as string | undefined) ??
    ((meta?.gregorian as { date?: string } | undefined)?.date) ??
    new Date().toISOString().slice(0, 10);

  return {
    city,
    country,
    ...(coords ? coords : {}),
    source: "aladhan",
    date: readable,
    fajr: normalizeTime(timings.Fajr ?? ""),
    sunrise: normalizeTime(timings.Sunrise ?? ""),
    dhuhr: normalizeTime(timings.Dhuhr ?? ""),
    asr: normalizeTime(timings.Asr ?? ""),
    maghrib: normalizeTime(timings.Maghrib ?? ""),
    isha: normalizeTime(timings.Isha ?? ""),
  };
}

export type PrayerResultLocalDayKey = { y: number; m0: number; d: number };

/**
 * `PrayerTimesResult.date` — Aladhan readable (әдетте DD-MM-YYYY) немесе YYYY-MM-DD.
 * Кэшті жергілікті күнмен салыстыру үшін (түн өткен соң UI «барлығы өтті» қатесін болдырмау).
 */
export function parsePrayerResultLocalDayKey(dateStr: string): PrayerResultLocalDayKey | null {
  const s = (dateStr || "").trim();
  if (!s) return null;
  const ddmmyyyy = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(s);
  if (ddmmyyyy) {
    const d = parseInt(ddmmyyyy[1], 10);
    const mon = parseInt(ddmmyyyy[2], 10) - 1;
    const y = parseInt(ddmmyyyy[3], 10);
    if (mon < 0 || mon > 11 || d < 1 || d > 31 || y < 1900 || y > 2100) return null;
    const probe = new Date(y, mon, d);
    if (probe.getFullYear() !== y || probe.getMonth() !== mon || probe.getDate() !== d) return null;
    return { y, m0: mon, d };
  }
  const ymd = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (ymd) {
    const y = parseInt(ymd[1], 10);
    const mon = parseInt(ymd[2], 10) - 1;
    const d = parseInt(ymd[3], 10);
    if (mon < 0 || mon > 11 || d < 1 || d > 31) return null;
    const probe = new Date(y, mon, d);
    if (probe.getFullYear() !== y || probe.getMonth() !== mon || probe.getDate() !== d) return null;
    return { y, m0: mon, d };
  }
  const t = Date.parse(s);
  if (!Number.isNaN(t)) {
    const dt = new Date(t);
    return { y: dt.getFullYear(), m0: dt.getMonth(), d: dt.getDate() };
  }
  return null;
}

export function isPrayerTimesResultForLocalToday(
  r: PrayerTimesResult,
  now: Date = new Date()
): boolean {
  if (r.error) return false;
  const key = parsePrayerResultLocalDayKey(r.date);
  if (!key) return false;
  return key.y === now.getFullYear() && key.m0 === now.getMonth() && key.d === now.getDate();
}

/** DD-MM-YYYY (Aladhan timingsByCity) */
function formatDateParam(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

/** Координат бойынша (Aladhan) — бүгінгі күн. */
export async function fetchPrayerTimesByCoordinates(
  lat: number,
  lng: number,
  city: string,
  country: string,
  method: number = APP_PRAYER_CALCULATION_METHOD,
  when: Date = new Date()
): Promise<PrayerTimesResult> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    method: String(method),
    school: String(APP_PRAYER_ASR_SCHOOL),
  });
  const url = `${ALADHAN_TIMINGS}/${formatDateParam(when)}?${params.toString()}`;
  try {
    const r = await fetchWithTimeout(url, {}, FETCH_TIMEOUT_MS);
    if (!r.ok) {
      return {
        city,
        country,
        date: "",
        fajr: "",
        sunrise: "",
        dhuhr: "",
        asr: "",
        maghrib: "",
        isha: "",
        error: `HTTP ${r.status}`,
      };
    }
    const payload = await r.json();
    return parseAladhanPayload(payload, city, country, { latitude: lat, longitude: lng });
  } catch (e) {
    const msg =
      e instanceof Error
        ? e.name === "AbortError"
          ? "Timeout"
          : e.message
        : "Network error";
    return {
      city,
      country,
      date: "",
      fajr: "",
      sunrise: "",
      dhuhr: "",
      asr: "",
      maghrib: "",
      isha: "",
      error: msg,
    };
  }
}

/** Тізімдегі қала / GPS координаты / Aladhan geocode. */
export async function fetchPrayerTimesForLocation(
  city: string,
  country: string,
  method: number = APP_PRAYER_CALCULATION_METHOD,
  coordsHint?: { lat: number; lon: number } | null
): Promise<PrayerTimesResult> {
  const official = await fetchPrayerTimesByMuftyatForDate(city, country, new Date());
  if (official) return official;

  const coords =
    coordsHint && Number.isFinite(coordsHint.lat) && Number.isFinite(coordsHint.lon)
      ? coordsHint
      : getKzPresetCoords(city, country);
  if (coords) {
    return fetchPrayerTimesByCoordinates(coords.lat, coords.lon, city, country, method);
  }
  return fetchPrayerTimesByCity(city, country, method);
}

export async function fetchPrayerTimesByCity(
  city: string,
  country: string,
  method: number = APP_PRAYER_CALCULATION_METHOD
): Promise<PrayerTimesResult> {
  const params = new URLSearchParams({
    city: city.trim(),
    country: country.trim(),
    method: String(method),
    school: String(APP_PRAYER_ASR_SCHOOL),
  });
  const url = `${ALADHAN_BY_CITY}?${params.toString()}`;
  try {
    const r = await fetchWithTimeout(url, {}, FETCH_TIMEOUT_MS);
    if (!r.ok) {
      return {
        city,
        country,
        date: "",
        fajr: "",
        sunrise: "",
        dhuhr: "",
        asr: "",
        maghrib: "",
        isha: "",
        error: `HTTP ${r.status}`,
      };
    }
    const payload = await r.json();
    return parseAladhanPayload(payload, city, country);
  } catch (e) {
    const msg =
      e instanceof Error
        ? e.name === "AbortError"
          ? "Timeout"
          : e.message
        : "Network error";
    return {
      city,
      country,
      date: "",
      fajr: "",
      sunrise: "",
      dhuhr: "",
      asr: "",
      maghrib: "",
      isha: "",
      error: msg,
    };
  }
}

export async function fetchPrayerTimesByCoordinatesForDate(
  lat: number,
  lng: number,
  city: string,
  country: string,
  when: Date,
  method: number = APP_PRAYER_CALCULATION_METHOD
): Promise<PrayerTimesResult> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    method: String(method),
    school: String(APP_PRAYER_ASR_SCHOOL),
  });
  const url = `${ALADHAN_TIMINGS}/${formatDateParam(when)}?${params.toString()}`;
  try {
    const r = await fetchWithTimeout(url, {}, FETCH_TIMEOUT_MS);
    if (!r.ok) {
      return {
        city,
        country,
        date: "",
        fajr: "",
        sunrise: "",
        dhuhr: "",
        asr: "",
        maghrib: "",
        isha: "",
        error: `HTTP ${r.status}`,
      };
    }
    const payload = await r.json();
    return parseAladhanPayload(payload, city, country, { latitude: lat, longitude: lng });
  } catch (e) {
    const msg =
      e instanceof Error
        ? e.name === "AbortError"
          ? "Timeout"
          : e.message
        : "Network error";
    return {
      city,
      country,
      date: "",
      fajr: "",
      sunrise: "",
      dhuhr: "",
      asr: "",
      maghrib: "",
      isha: "",
      error: msg,
    };
  }
}

/** Белгілі күн үшін (ертеңгі намаз хабарламасы үшін) */
export async function fetchPrayerTimesForLocationForDate(
  city: string,
  country: string,
  when: Date,
  method: number = APP_PRAYER_CALCULATION_METHOD,
  coordsHint?: { lat: number; lon: number } | null
): Promise<PrayerTimesResult> {
  const official = await fetchPrayerTimesByMuftyatForDate(city, country, when);
  if (official) return official;

  const coords =
    coordsHint && Number.isFinite(coordsHint.lat) && Number.isFinite(coordsHint.lon)
      ? coordsHint
      : getKzPresetCoords(city, country);
  if (coords) {
    return fetchPrayerTimesByCoordinatesForDate(coords.lat, coords.lon, city, country, when, method);
  }
  return fetchPrayerTimesByCityForDate(city, country, when, method);
}

/** Белгілі күн үшін — тек қаламен (геокод). */
export async function fetchPrayerTimesByCityForDate(
  city: string,
  country: string,
  when: Date,
  method: number = APP_PRAYER_CALCULATION_METHOD
): Promise<PrayerTimesResult> {
  const params = new URLSearchParams({
    city: city.trim(),
    country: country.trim(),
    method: String(method),
    school: String(APP_PRAYER_ASR_SCHOOL),
    date: formatDateParam(when),
  });
  const url = `${ALADHAN_BY_CITY}?${params.toString()}`;
  try {
    const r = await fetchWithTimeout(url, {}, FETCH_TIMEOUT_MS);
    if (!r.ok) {
      return {
        city,
        country,
        date: "",
        fajr: "",
        sunrise: "",
        dhuhr: "",
        asr: "",
        maghrib: "",
        isha: "",
        error: `HTTP ${r.status}`,
      };
    }
    const payload = await r.json();
    return parseAladhanPayload(payload, city, country);
  } catch (e) {
    const msg =
      e instanceof Error
        ? e.name === "AbortError"
          ? "Timeout"
          : e.message
        : "Network error";
    return {
      city,
      country,
      date: "",
      fajr: "",
      sunrise: "",
      dhuhr: "",
      asr: "",
      maghrib: "",
      isha: "",
      error: msg,
    };
  }
}
