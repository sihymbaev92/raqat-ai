/**
 * Aladhan ашық API (токенсіз) — боттағы логикамен үйлесімді.
 * https://aladhan.com/prayer-times-api
 * school=1 (Hanafi) — бесіннен кейінгі екінті (Asr) шафи есебінен гөрі ханафиға сәйкес;
 * method=2 (ISNA, 15°) — Қазақстанда жазғы таң уақытын 18° әдісінен ертерек шығармайды
 *   (мысалы, Шымкент 03.06.2026: method=3 → 02:37, method=2 → 03:05).
 */
import { getKzPresetCoords } from "../constants/kzCities";

const ALADHAN_BY_CITY = "https://api.aladhan.com/v1/timingsByCity";
const ALADHAN_TIMINGS = "https://api.aladhan.com/v1/timings";

const FETCH_TIMEOUT_MS = 25_000;
export const APP_PRAYER_CALCULATION_METHOD = 2;

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

/** Aladhan JSON → қолданба пішіні (unit-тестте де қолданылады) */
export function parseAladhanPayload(payload: unknown, city: string, country: string): PrayerTimesResult {
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

/** Координат бойынша (тізімдегі Қазақстан қалалары үшін дәлірек). */
export async function fetchPrayerTimesByCoordinates(
  lat: number,
  lng: number,
  city: string,
  country: string,
  method: number = APP_PRAYER_CALCULATION_METHOD
): Promise<PrayerTimesResult> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    method: String(method),
    school: "1",
  });
  const url = `${ALADHAN_TIMINGS}?${params.toString()}`;
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

/** Тізімдегі қала болса координатпен, әйтпесе қаламен (Aladhan geocode). */
export async function fetchPrayerTimesForLocation(
  city: string,
  country: string,
  method: number = APP_PRAYER_CALCULATION_METHOD
): Promise<PrayerTimesResult> {
  const coords = getKzPresetCoords(city, country);
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
    school: "1", // Aladhan: 0=Shafi, 1=Hanafi (Imam Azam jamaat practice)
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
    school: "1",
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

/** Белгілі күн үшін (ертеңгі намаз хабарламасы үшін) */
export async function fetchPrayerTimesForLocationForDate(
  city: string,
  country: string,
  when: Date,
  method: number = APP_PRAYER_CALCULATION_METHOD
): Promise<PrayerTimesResult> {
  const coords = getKzPresetCoords(city, country);
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
    school: "1",
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
