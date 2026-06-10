import AsyncStorage from "@react-native-async-storage/async-storage";

export type TraditionFavoriteType = "topic" | "article";

export type TraditionFavorite = {
  type: TraditionFavoriteType;
  id: string;
  savedAt: string;
};

const KEY = "raqat_tradition_favorites_v1";

function favoriteKey(item: Pick<TraditionFavorite, "type" | "id">): string {
  return `${item.type}:${item.id}`;
}

export async function listTraditionFavorites(): Promise<TraditionFavorite[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { items?: TraditionFavorite[] };
    return Array.isArray(parsed.items)
      ? parsed.items.filter(
          (item) =>
            item &&
            typeof item.id === "string" &&
            (item.type === "topic" || item.type === "article")
        )
      : [];
  } catch {
    return [];
  }
}

export async function saveTraditionFavorites(items: TraditionFavorite[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify({ items }));
}

export async function isTraditionFavorite(type: TraditionFavoriteType, id: string): Promise<boolean> {
  const items = await listTraditionFavorites();
  return items.some((item) => item.type === type && item.id === id);
}

export async function toggleTraditionFavorite(
  type: TraditionFavoriteType,
  id: string
): Promise<{ active: boolean; items: TraditionFavorite[] }> {
  const items = await listTraditionFavorites();
  const key = favoriteKey({ type, id });
  const exists = items.some((item) => favoriteKey(item) === key);
  const next = exists
    ? items.filter((item) => favoriteKey(item) !== key)
    : [{ type, id, savedAt: new Date().toISOString() }, ...items];
  await saveTraditionFavorites(next);
  return { active: !exists, items: next };
}
