/**
 * Ағымдағы ауа райы (токенсіз HTTPS): Open-Meteo.
 * https://open-meteo.com/
 */
const OPEN_METEO = "https://api.open-meteo.com/v1/forecast";

export type OpenMeteoCurrent = {
  tempC: number;
  wmoCode: number;
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
  u.searchParams.set("current", "temperature_2m,weather_code");
  u.searchParams.set("timezone", "auto");
  try {
    const res = await fetchWithTimeout(u.toString(), timeoutMs);
    if (!res.ok) return null;
    const j = (await res.json()) as {
      current?: { temperature_2m?: number; weather_code?: number };
    };
    const cur = j.current;
    if (!cur || typeof cur.temperature_2m !== "number") return null;
    const wmo = typeof cur.weather_code === "number" ? cur.weather_code : 0;
    return { tempC: cur.temperature_2m, wmoCode: wmo };
  } catch {
    return null;
  }
}

/** WMO → MaterialCommunityIcons (weather-*) */
export function wmoCodeToWeatherIconName(code: number): string {
  if (code === 0) return "weather-sunny";
  if (code >= 1 && code <= 3) return "weather-partly-cloudy";
  if (code === 45 || code === 48) return "weather-fog";
  if (code >= 51 && code <= 57) return "weather-rainy";
  if (code >= 61 && code <= 67) return "weather-pouring";
  if (code >= 71 && code <= 77) return "weather-snowy";
  if (code >= 80 && code <= 82) return "weather-pouring";
  if (code >= 95 && code <= 99) return "weather-lightning-rainy";
  if (code >= 85 && code <= 86) return "weather-snowy";
  return "weather-cloudy";
}
