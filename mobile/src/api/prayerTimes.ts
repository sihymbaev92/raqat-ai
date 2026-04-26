/**
 * Aladhan ашық API (токенсіз) — боттағы логикамен үйлесімді.
 * https://aladhan.com/prayer-times-api
 */
const ALADHAN_BY_CITY = "https://api.aladhan.com/v1/timingsByCity";

const FETCH_TIMEOUT_MS = 25_000;

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

/** DD-MM-YYYY (Aladhan timingsByCity) */
function formatDateParam(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export async function fetchPrayerTimesByCity(
  city: string,
  country: string,
  method: number = 3
): Promise<PrayerTimesResult> {
  const params = new URLSearchParams({
    city: city.trim(),
    country: country.trim(),
    method: String(method),
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

/** Белгілі күн үшін (ертеңгі намаз хабарламасы үшін) */
export async function fetchPrayerTimesByCityForDate(
  city: string,
  country: string,
  when: Date,
  method: number = 3
): Promise<PrayerTimesResult> {
  const params = new URLSearchParams({
    city: city.trim(),
    country: country.trim(),
    method: String(method),
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
