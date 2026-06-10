import AsyncStorage from "@react-native-async-storage/async-storage";

const FAV_KEY = "raqat_halal_fav_companies_v1";
const HISTORY_KEY = "raqat_halal_lookup_history_v1";
const MAX_HISTORY = 14;

export type HalalLookupHistoryEntry = {
  query: string;
  at: string;
  kind: "text" | "barcode";
};

export type HalalFavoriteCompany = {
  id: number;
  title: string;
  savedAt: string;
};

export async function loadHalalFavorites(): Promise<HalalFavoriteCompany[]> {
  try {
    const raw = await AsyncStorage.getItem(FAV_KEY);
    if (!raw) return [];
    const j = JSON.parse(raw) as HalalFavoriteCompany[];
    return Array.isArray(j) ? j.filter((x) => x.id > 0 && x.title.trim()) : [];
  } catch {
    return [];
  }
}

export async function toggleHalalFavorite(entry: HalalFavoriteCompany): Promise<HalalFavoriteCompany[]> {
  const list = await loadHalalFavorites();
  const idx = list.findIndex((x) => x.id === entry.id);
  let next: HalalFavoriteCompany[];
  if (idx >= 0) {
    next = [...list.slice(0, idx), ...list.slice(idx + 1)];
  } else {
    next = [{ ...entry, savedAt: new Date().toISOString() }, ...list].slice(0, 40);
  }
  await AsyncStorage.setItem(FAV_KEY, JSON.stringify(next));
  return next;
}

export function isHalalFavorite(list: HalalFavoriteCompany[], id: number): boolean {
  return list.some((x) => x.id === id);
}

export async function loadHalalLookupHistory(): Promise<HalalLookupHistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const j = JSON.parse(raw) as HalalLookupHistoryEntry[];
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
}

export async function pushHalalLookupHistory(
  query: string,
  kind: HalalLookupHistoryEntry["kind"]
): Promise<HalalLookupHistoryEntry[]> {
  const q = query.trim();
  if (q.length < 2) return loadHalalLookupHistory();
  const prev = await loadHalalLookupHistory();
  const filtered = prev.filter((e) => e.query.toLowerCase() !== q.toLowerCase());
  const next: HalalLookupHistoryEntry[] = [{ query: q, at: new Date().toISOString(), kind }, ...filtered].slice(
    0,
    MAX_HISTORY
  );
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

export async function clearHalalLookupHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
}
