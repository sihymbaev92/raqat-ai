/**
 * Imam Ai платформа API негізгі мекенжайы (трейлинг слеш жоқ).
 * 1) EXPO_PUBLIC_IMAM_AI_API_BASE — әдепкі жаңа атауы
 * 2) EXPO_PUBLIC_RAQAT_API_BASE — мұра (егер жоғарыдағы бос болса)
 * 3) app.config.js → expo.extra.imamAiApiBase, содан кейін extra.raqatApiBase
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getExpoExtra } from "./expoExtra";

const API_BASE_OVERRIDE_KEY = "imam_ai_api_base_override_v1";
const LEGACY_OVERRIDE_KEY = "raqat_api_base_override_v1";

let apiBaseOverride = "";

function normalizeBase(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  return t.replace(/\/+$/, "");
}

/** Overrideсыз: .env → app.config.js extra (жинақтағы нақты әдепкі). */
export function getBundledRaqatApiBase(): string {
  const imamEnv =
    typeof process !== "undefined" && process.env?.EXPO_PUBLIC_IMAM_AI_API_BASE
      ? String(process.env.EXPO_PUBLIC_IMAM_AI_API_BASE)
      : "";
  if (imamEnv.trim()) return normalizeBase(imamEnv);
  const rqEnv =
    typeof process !== "undefined" && process.env?.EXPO_PUBLIC_RAQAT_API_BASE
      ? String(process.env.EXPO_PUBLIC_RAQAT_API_BASE)
      : "";
  if (rqEnv.trim()) return normalizeBase(rqEnv);

  const ex = getExpoExtra();
  const rawImam = ex?.imamAiApiBase;
  if (rawImam != null && String(rawImam).trim()) return normalizeBase(String(rawImam));
  const rawR = ex?.raqatApiBase;
  if (rawR != null && String(rawR).trim()) return normalizeBase(String(rawR));
  return "";
}

export function getRaqatApiBase(): string {
  if (apiBaseOverride) return apiBaseOverride;
  return getBundledRaqatApiBase();
}

export async function hydrateRaqatApiBaseOverride(): Promise<void> {
  try {
    let raw = await AsyncStorage.getItem(API_BASE_OVERRIDE_KEY);
    if (!raw?.trim()) {
      raw = await AsyncStorage.getItem(LEGACY_OVERRIDE_KEY);
      if (raw?.trim()) await AsyncStorage.setItem(API_BASE_OVERRIDE_KEY, normalizeBase(raw));
    }
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
    await AsyncStorage.removeItem(LEGACY_OVERRIDE_KEY);
    return "";
  }
  apiBaseOverride = normalized;
  await AsyncStorage.setItem(API_BASE_OVERRIDE_KEY, normalized);
  await AsyncStorage.removeItem(LEGACY_OVERRIDE_KEY);
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
