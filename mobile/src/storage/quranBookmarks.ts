import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "raqat_quran_bookmarks_v1";

export async function getBookmarkedSurahs(): Promise<number[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const j = JSON.parse(raw) as unknown;
    if (!Array.isArray(j)) return [];
    return j.filter((x): x is number => typeof x === "number" && x >= 1 && x <= 114);
  } catch {
    return [];
  }
}

export async function toggleBookmarkSurah(n: number): Promise<boolean> {
  const cur = await getBookmarkedSurahs();
  const has = cur.includes(n);
  const next = has ? cur.filter((x) => x !== n) : [...cur, n].sort((a, b) => a - b);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return !has;
}

export async function isSurahBookmarked(n: number): Promise<boolean> {
  const cur = await getBookmarkedSurahs();
  return cur.includes(n);
}
