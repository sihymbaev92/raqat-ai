import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "raqat_community_dua_banner_dismiss_v1";

export async function getDismissedCommunityDuaId(): Promise<number | null> {
  try {
    const raw = (await AsyncStorage.getItem(KEY))?.trim();
    if (!raw) return null;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

export async function setDismissedCommunityDuaId(id: number): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, String(id));
  } catch {
    /* ignore */
  }
}
