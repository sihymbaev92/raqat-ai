import AsyncStorage from "@react-native-async-storage/async-storage";
import { getRaqatApiBase } from "../config/raqatApiBase";
import { postAuthRefresh } from "../services/platformApiClient";

const KEY_ACCESS = "raqat.auth.access_token";
const KEY_REFRESH = "raqat.auth.refresh_token";
const KEY_EXPIRES_AT = "raqat.auth.access_expires_at_ms";
const KEY_PLATFORM_USER = "raqat.auth.platform_user_id";

export type LoginTokensPayload = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  platform_user_id?: string;
};

export async function saveLoginTokens(p: LoginTokensPayload): Promise<void> {
  const expSec = typeof p.expires_in === "number" && p.expires_in > 0 ? p.expires_in : 1800;
  const expiresAt = Date.now() + expSec * 1000;
  await AsyncStorage.multiSet([
    [KEY_ACCESS, p.access_token],
    [KEY_REFRESH, p.refresh_token],
    [KEY_EXPIRES_AT, String(expiresAt)],
    [KEY_PLATFORM_USER, (p.platform_user_id || "").trim()],
  ]);
}

export async function clearLoginTokens(): Promise<void> {
  await AsyncStorage.multiRemove([KEY_ACCESS, KEY_REFRESH, KEY_EXPIRES_AT, KEY_PLATFORM_USER]);
}

export async function getStoredPlatformUserId(): Promise<string | null> {
  const v = (await AsyncStorage.getItem(KEY_PLATFORM_USER))?.trim();
  return v || null;
}

/** Access токен (жарамдылығын тексермейді). */
export async function getStoredAccessToken(): Promise<string | null> {
  const t = (await AsyncStorage.getItem(KEY_ACCESS))?.trim();
  return t || null;
}

/**
 * Access токен: мерзімі аяқталуға 2 мин қалғанда refresh жасайды.
 */
export async function getValidAccessToken(): Promise<string | null> {
  const access = (await AsyncStorage.getItem(KEY_ACCESS))?.trim();
  const refresh = (await AsyncStorage.getItem(KEY_REFRESH))?.trim();
  const expRaw = await AsyncStorage.getItem(KEY_EXPIRES_AT);
  const exp = expRaw ? parseInt(expRaw, 10) : 0;
  if (!access || !refresh) return null;
  if (Date.now() < exp - 120_000) return access;

  const base = getRaqatApiBase();
  if (!base) return access;

  const r = await postAuthRefresh(base, refresh);
  if (!r.ok || !r.access_token || !r.refresh_token) {
    return access;
  }
  await saveLoginTokens({
    access_token: r.access_token,
    refresh_token: r.refresh_token,
    expires_in: r.expires_in,
    platform_user_id: r.platform_user_id,
  });
  return r.access_token.trim();
}
