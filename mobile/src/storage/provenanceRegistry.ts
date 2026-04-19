import AsyncStorage from "@react-native-async-storage/async-storage";
import type { InstitutionSource } from "../ecosystem/types";

const KEY = "raqat_ecosystem_lineage_v1";

export type StoredLineage = {
  version: number;
  savedAt: string;
  items: InstitutionSource[];
};

/** Каталог түпнұсқасын құрылғыда сақтау — дерек қайдан екені мен дәлелдер қалпы сақталады */
export async function persistCatalogLineage(items: InstitutionSource[]): Promise<void> {
  const payload: StoredLineage = {
    version: 1,
    savedAt: new Date().toISOString(),
    items,
  };
  await AsyncStorage.setItem(KEY, JSON.stringify(payload));
}

export async function loadCatalogLineage(): Promise<StoredLineage | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredLineage;
  } catch {
    return null;
  }
}
