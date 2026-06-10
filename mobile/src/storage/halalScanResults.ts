import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  HalalDamuAdditiveItem,
  HalalDamuCompanyCard,
  HalalDamuProductItem,
} from "../api/halalDamuWp";

const SCAN_RESULTS_KEY = "raqat_halal_scan_results_v1";
export const MAX_HALAL_SCAN_RESULTS = 20;

export type HalalScanResultSnapshot = {
  barcode: string;
  at: string;
  products: HalalDamuProductItem[];
  additives: HalalDamuAdditiveItem[];
  companies: HalalDamuCompanyCard[];
};

function normalizeBarcode(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 4 ? digits : raw.trim();
}

export async function loadHalalScanResults(): Promise<HalalScanResultSnapshot[]> {
  try {
    const raw = await AsyncStorage.getItem(SCAN_RESULTS_KEY);
    if (!raw) return [];
    const j = JSON.parse(raw) as HalalScanResultSnapshot[];
    if (!Array.isArray(j)) return [];
    return j.filter((x) => x && typeof x.barcode === "string" && x.barcode.trim().length >= 4);
  } catch {
    return [];
  }
}

export async function pushHalalScanResult(entry: Omit<HalalScanResultSnapshot, "at">): Promise<HalalScanResultSnapshot[]> {
  const barcode = normalizeBarcode(entry.barcode);
  if (barcode.length < 4) return loadHalalScanResults();
  const prev = await loadHalalScanResults();
  const filtered = prev.filter((e) => normalizeBarcode(e.barcode) !== barcode);
  const next: HalalScanResultSnapshot[] = [
    {
      barcode,
      at: new Date().toISOString(),
      products: entry.products ?? [],
      additives: entry.additives ?? [],
      companies: entry.companies ?? [],
    },
    ...filtered,
  ].slice(0, MAX_HALAL_SCAN_RESULTS);
  await AsyncStorage.setItem(SCAN_RESULTS_KEY, JSON.stringify(next));
  return next;
}

export async function clearHalalScanResults(): Promise<void> {
  await AsyncStorage.removeItem(SCAN_RESULTS_KEY);
}

export function findHalalScanResult(
  list: HalalScanResultSnapshot[],
  query: string
): HalalScanResultSnapshot | undefined {
  const key = normalizeBarcode(query);
  if (key.length < 4) return undefined;
  return list.find((e) => normalizeBarcode(e.barcode) === key);
}
