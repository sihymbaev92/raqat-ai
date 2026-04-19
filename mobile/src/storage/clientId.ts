import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "raqat_client_id_v1";

function randomSegment(): string {
  return Math.random().toString(36).slice(2, 12);
}

export async function getOrCreateClientId(): Promise<string> {
  try {
    const existing = (await AsyncStorage.getItem(KEY))?.trim();
    if (existing && existing.length >= 8) return existing;
    const id = `rq-${Date.now().toString(36)}-${randomSegment()}`;
    await AsyncStorage.setItem(KEY, id);
    return id;
  } catch {
    return `rq-fallback-${Date.now()}-${randomSegment()}`;
  }
}
