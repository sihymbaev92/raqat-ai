/**
 * Ағымдағы ауа райы (токенсіз HTTPS): Open-Meteo.
 * https://open-meteo.com/
 */
const OPEN_METEO = "https://api.open-meteo.com/v1/forecast";

export type OpenMeteoCurrent = {
  tempC: number;
  wmoCode: number;
  /** Open-Meteo current.is_day: 1 күндіз, 0 түн. */
  isDay?: boolean;
  /** API берген жергілікті уақыт жолы (timezone=auto). */
  observedAt?: string;
};

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: c.signal });
  } finally {
    clearTimeout(t);
  }
}

export async function fetchOpenMeteoCurrent(
  lat: number,
  lon: number,
  timeoutMs = 10_000
): Promise<OpenMeteoCurrent | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const u = new URL(OPEN_METEO);
  u.searchParams.set("latitude", String(lat));
  u.searchParams.set("longitude", String(lon));
  u.searchParams.set("current", "temperature_2m,weather_code,is_day");
  u.searchParams.set("timezone", "auto");
  try {
    const res = await fetchWithTimeout(u.toString(), timeoutMs);
    if (!res.ok) return null;
    const j = (await res.json()) as {
      current?: { temperature_2m?: number; weather_code?: number; is_day?: number; time?: string };
    };
    const cur = j.current;
    if (!cur || typeof cur.temperature_2m !== "number") return null;
    const wmo = typeof cur.weather_code === "number" ? cur.weather_code : 0;
    return {
      tempC: cur.temperature_2m,
      wmoCode: wmo,
      isDay: typeof cur.is_day === "number" ? cur.is_day === 1 : undefined,
      observedAt: typeof cur.time === "string" ? cur.time : undefined,
    };
  } catch {
    return null;
  }
}

function observedHour(observedAt?: string): number {
  const m = String(observedAt || "").match(/T(\d{1,2}):/);
  if (m) return Number(m[1]);
  return new Date().getHours();
}

function isMorningLight(observedAt?: string): boolean {
  const h = observedHour(observedAt);
  return h >= 4 && h <= 8;
}

/** WMO → түсті emoji (chip / виджет). */
export function wmoCodeToWeatherEmoji(
  code: number,
  opts?: { isDay?: boolean; observedAt?: string }
): string {
  const isDay = opts?.isDay;
  if (code === 0) {
    if (isDay === false) return "🌙";
    if (isMorningLight(opts?.observedAt)) return "🌅";
    return "☀️";
  }
  if (code >= 1 && code <= 3) {
    if (isDay === false) return "☁️";
    if (isMorningLight(opts?.observedAt)) return "🌅";
    return "🌤️";
  }
  if (code === 45 || code === 48) return "🌫️";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "🌧️";
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return "❄️";
  if (code >= 95 && code <= 99) return "⛈️";
  return "☁️";
}

/** WMO → MaterialCommunityIcons (weather-*) */
export function wmoCodeToWeatherIconName(
  code: number,
  opts?: { isDay?: boolean; observedAt?: string }
): string {
  const isDay = opts?.isDay;
  if (code === 0) {
    if (isDay === false) return "weather-night";
    if (isMorningLight(opts?.observedAt)) return "weather-sunset-up";
    return "weather-sunny";
  }
  if (code >= 1 && code <= 3) {
    if (isDay === false) return "weather-night-partly-cloudy";
    if (isMorningLight(opts?.observedAt)) return "weather-sunset-up";
    return "weather-partly-cloudy";
  }
  if (code === 45 || code === 48) return "weather-fog";
  if (code >= 51 && code <= 57) return "weather-rainy";
  if (code >= 61 && code <= 67) return "weather-pouring";
  if (code >= 71 && code <= 77) return "weather-snowy";
  if (code >= 80 && code <= 82) return "weather-pouring";
  if (code >= 95 && code <= 99) return "weather-lightning-rainy";
  if (code >= 85 && code <= 86) return "weather-snowy";
  return "weather-cloudy";
}
