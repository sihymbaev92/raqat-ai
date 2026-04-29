/**
 * Платформа API негізгі мекенжайы (трейлинг слеш жоқ).
 * 1) EXPO_PUBLIC_RAQAT_API_BASE — .env немесе іске қосу алдында
 * 2) app.json → expo.extra.raqatApiBase
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getExpoExtra } from "./expoExtra";

const API_BASE_OVERRIDE_KEY = "raqat_api_base_override_v1";
let apiBaseOverride = "";

function normalizeBase(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  return t.replace(/\/+$/, "");
}

export function getRaqatApiBase(): string {
  if (apiBaseOverride) return apiBaseOverride;
  const env =
    typeof process !== "undefined" && process.env?.EXPO_PUBLIC_RAQAT_API_BASE
      ? String(process.env.EXPO_PUBLIC_RAQAT_API_BASE)
      : "";
  if (env.trim()) return normalizeBase(env);
  const raw = getExpoExtra()?.raqatApiBase;
  if (raw != null && String(raw).trim()) return normalizeBase(String(raw));
  return "";
}

export async function hydrateRaqatApiBaseOverride(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(API_BASE_OVERRIDE_KEY);
    apiBaseOverride = raw ? normalizeBase(raw) : "";
  } catch {
    apiBaseOverride = "";
  }
}

export async function saveRaqatApiBaseOverride(nextBase: string): Promise<string> {
  const normalized = normalizeBase(nextBase);
  if (!normalized) {
    apiBaseOverride = "";
    await AsyncStorage.removeItem(API_BASE_OVERRIDE_KEY);
    return "";
  }
  apiBaseOverride = normalized;
  await AsyncStorage.setItem(API_BASE_OVERRIDE_KEY, normalized);
  return normalized;
}

function truthy(v: string): boolean {
  const t = v.trim().toLowerCase();
  return t === "1" || t === "true" || t === "yes" || t === "on";
}

/**
 * API-only режим: сыртқы fallback (alquran.cloud т.б.) өшіріледі.
 * Продта дерек бір көзден алынуы үшін қолданылады.
 */
export function isRaqatApiOnlyMode(): boolean {
  const env =
    typeof process !== "undefined" && process.env?.EXPO_PUBLIC_RAQAT_API_ONLY
      ? String(process.env.EXPO_PUBLIC_RAQAT_API_ONLY)
      : "";
  if (env.trim()) return truthy(env);
  const extra = getExpoExtra()?.raqatApiOnly as boolean | string | undefined;
  if (typeof extra === "boolean") return extra;
  if (typeof extra === "string" && extra.trim()) return truthy(extra);
  return false;
}
