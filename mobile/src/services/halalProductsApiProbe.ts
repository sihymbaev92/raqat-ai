import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchHalalDamuProductsBrowse } from "../api/halalDamuWp";

const STORAGE_KEY = "halal_products_api_probe_v1";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

export type HalalProductsApiProbe = {
  hasProducts: boolean;
  total: number;
  checkedAt: string;
  error?: string;
};

type Stored = HalalProductsApiProbe & { cachedAt: number };

export async function readCachedHalalProductsApiProbe(): Promise<HalalProductsApiProbe | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    if (!parsed?.checkedAt || Date.now() - (parsed.cachedAt ?? 0) > CACHE_TTL_MS) return null;
    return {
      hasProducts: Boolean(parsed.hasProducts),
      total: parsed.total ?? 0,
      checkedAt: parsed.checkedAt,
      error: parsed.error,
    };
  } catch {
    return null;
  }
}

export async function probeHalalProductsApi(force = false): Promise<HalalProductsApiProbe> {
  if (!force) {
    const cached = await readCachedHalalProductsApiProbe();
    if (cached) return cached;
  }

  const checkedAt = new Date().toISOString();
  try {
    const { items, meta, error } = await fetchHalalDamuProductsBrowse({ perPage: 3, page: 1 });
    const total = meta?.totalItems ?? items.length;
    const result: HalalProductsApiProbe = {
      hasProducts: total > 0 || items.length > 0,
      total,
      checkedAt,
      error,
    };
    const stored: Stored = { ...result, cachedAt: Date.now() };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    return result;
  } catch {
    const result: HalalProductsApiProbe = {
      hasProducts: false,
      total: 0,
      checkedAt,
      error: "network",
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...result, cachedAt: Date.now() } satisfies Stored));
    return result;
  }
}
