import { Platform } from "react-native";

/** Ескі Android WebView + ұзын тізім — консервативті лимиттер. */
export function halalPreferLowMemoryMode(): boolean {
  return Platform.OS === "android";
}

export function halalNearbyRenderCap(defaultCap = 30): number {
  return halalPreferLowMemoryMode() ? Math.min(defaultCap, 16) : defaultCap;
}

export function halalCatalogPageSize(defaultSize = 24): number {
  return halalPreferLowMemoryMode() ? Math.min(defaultSize, 16) : defaultSize;
}

export function halalMapMarkerCap(defaultCap = 600): number {
  return halalPreferLowMemoryMode() ? Math.min(defaultCap, 220) : defaultCap;
}

export function halalMapClusterChunkMs(): { chunkInterval: number; chunkDelay: number } {
  if (halalPreferLowMemoryMode()) {
    return { chunkInterval: 140, chunkDelay: 60 };
  }
  return { chunkInterval: 80, chunkDelay: 35 };
}
