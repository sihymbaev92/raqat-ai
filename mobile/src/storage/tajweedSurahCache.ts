import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_PREFIX = "raqat_tajweed_surah_v1_";

const memory = new Map<number, Record<number, string>>();

export function peekTajweedSurahMemoryCache(surah: number): Record<number, string> | null {
  return memory.get(surah) ?? null;
}

export function rememberTajweedSurahInMemory(surah: number, map: Record<number, string>): void {
  if (!Object.keys(map).length) return;
  memory.set(surah, map);
}

export async function readTajweedSurahDiskCache(surah: number): Promise<Record<number, string> | null> {
  const hit = memory.get(surah);
  if (hit) return hit;
  try {
    const raw = await AsyncStorage.getItem(`${KEY_PREFIX}${surah}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, string>;
    const map: Record<number, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      const n = Number(k);
      if (Number.isFinite(n) && (v ?? "").includes("[")) map[n] = v;
    }
    if (!Object.keys(map).length) return null;
    memory.set(surah, map);
    return map;
  } catch {
    return null;
  }
}

export async function writeTajweedSurahDiskCache(
  surah: number,
  map: Record<number, string>
): Promise<void> {
  if (!Object.keys(map).length) return;
  memory.set(surah, map);
  const serial: Record<string, string> = {};
  for (const [k, v] of Object.entries(map)) serial[String(k)] = v;
  await AsyncStorage.setItem(`${KEY_PREFIX}${surah}`, JSON.stringify(serial));
}

/** Jest — memory-only cache reset. */
export function clearTajweedSurahMemoryCacheForTests(): void {
  memory.clear();
}
