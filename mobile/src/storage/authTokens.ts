import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { getRaqatApiBase } from "../config/raqatApiBase";
import { postAuthRefresh } from "../services/platformApiClient";
import { assertCanPersistAuthSecrets, isSensitiveAuthBlocked } from "../security/appSecurityShield";

const KEY_ACCESS = "raqat.auth.access_token";
const KEY_REFRESH = "raqat.auth.refresh_token";
const KEY_EXPIRES_AT = "raqat.auth.access_expires_at_ms";
const KEY_PLATFORM_USER = "raqat.auth.platform_user_id";
const AUTH_KEYS = [KEY_ACCESS, KEY_REFRESH, KEY_EXPIRES_AT, KEY_PLATFORM_USER] as const;

const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainService: "raqat.auth.tokens",
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

let secureStoreAvailablePromise: Promise<boolean> | null = null;

function secureStoreAvailable(): Promise<boolean> {
  if (Platform.OS === "web") return Promise.resolve(false);
  secureStoreAvailablePromise ??= SecureStore.isAvailableAsync().catch(() => false);
  return secureStoreAvailablePromise;
}

/** Auth құпия — тек SecureStore; release-та AsyncStorage fallback жоқ. */
async function setAuthItem(key: (typeof AUTH_KEYS)[number], value: string): Promise<void> {
  if (await secureStoreAvailable()) {
    await SecureStore.setItemAsync(key, value, SECURE_STORE_OPTIONS);
    await AsyncStorage.removeItem(key);
    return;
  }
  if (Platform.OS === "web" && (typeof __DEV__ !== "undefined" && __DEV__)) {
    await AsyncStorage.setItem(key, value);
    return;
  }
  throw new Error("Secure token storage is unavailable");
}

async function getAuthItem(key: (typeof AUTH_KEYS)[number]): Promise<string | null> {
  if (await secureStoreAvailable()) {
    const secureValue = await SecureStore.getItemAsync(key, SECURE_STORE_OPTIONS);
    if (secureValue) return secureValue;

    const legacyValue = await AsyncStorage.getItem(key);
    if (legacyValue) {
      try {
        await SecureStore.setItemAsync(key, legacyValue, SECURE_STORE_OPTIONS);
        await AsyncStorage.removeItem(key);
      } catch {
        await AsyncStorage.removeItem(key);
        return null;
      }
      return legacyValue;
    }
    return null;
  }

  if (Platform.OS === "web" && (typeof __DEV__ !== "undefined" && __DEV__)) {
    return AsyncStorage.getItem(key);
  }
  return null;
}

async function deleteAuthItem(key: (typeof AUTH_KEYS)[number]): Promise<void> {
  if (await secureStoreAvailable()) {
    await SecureStore.deleteItemAsync(key, SECURE_STORE_OPTIONS);
  }
  await AsyncStorage.removeItem(key);
}

export type LoginTokensPayload = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  platform_user_id?: string;
};

export async function saveLoginTokens(p: LoginTokensPayload): Promise<void> {
  await assertCanPersistAuthSecrets();
  const expSec = typeof p.expires_in === "number" && p.expires_in > 0 ? p.expires_in : 1800;
  const expiresAt = Date.now() + expSec * 1000;
  await Promise.all([
    setAuthItem(KEY_ACCESS, p.access_token),
    setAuthItem(KEY_REFRESH, p.refresh_token),
    setAuthItem(KEY_EXPIRES_AT, String(expiresAt)),
    setAuthItem(KEY_PLATFORM_USER, (p.platform_user_id || "").trim()),
  ]);
}

export async function clearLoginTokens(): Promise<void> {
  await Promise.all(AUTH_KEYS.map((key) => deleteAuthItem(key)));
}

export async function getStoredPlatformUserId(): Promise<string | null> {
  if (isSensitiveAuthBlocked()) return null;
  const v = (await getAuthItem(KEY_PLATFORM_USER))?.trim();
  return v || null;
}

/** Access токен (жарамдылығын тексермейді). */
export async function getStoredAccessToken(): Promise<string | null> {
  if (isSensitiveAuthBlocked()) return null;
  const t = (await getAuthItem(KEY_ACCESS))?.trim();
  return t || null;
}

/**
 * Access токен: мерзімі аяқталуға 2 мин қалғанда refresh жасайды.
 * Refresh сәтсіз болса — мерзімі өткен токенді қайтармайды (ұрлау тәуекелін азайту).
 */
export async function getValidAccessToken(): Promise<string | null> {
  if (isSensitiveAuthBlocked()) return null;

  const access = (await getAuthItem(KEY_ACCESS))?.trim();
  const refresh = (await getAuthItem(KEY_REFRESH))?.trim();
  const expRaw = await getAuthItem(KEY_EXPIRES_AT);
  const exp = expRaw ? parseInt(expRaw, 10) : 0;
  if (!access || !refresh) return null;
  if (Date.now() < exp - 120_000) return access;

  const base = getRaqatApiBase();
  if (!base) {
    await clearLoginTokens();
    return null;
  }

  const r = await postAuthRefresh(base, refresh);
  if (!r.ok || !r.access_token || !r.refresh_token) {
    await clearLoginTokens();
    return null;
  }
  try {
    await saveLoginTokens({
      access_token: r.access_token,
      refresh_token: r.refresh_token,
      expires_in: r.expires_in,
      platform_user_id: r.platform_user_id,
    });
  } catch {
    await clearLoginTokens();
    return null;
  }
  return r.access_token.trim();
}
