import type { HalalDamuMapMarker } from "../api/halalDamuWp";

export type HalalMapSessionSnapshot = {
  html: string;
  markers: HalalDamuMapMarker[];
  markerKey: string;
};

const MAX_SESSIONS = 4;
const sessions = new Map<string, HalalMapSessionSnapshot>();

export function halalMapMarkerKey(
  markers: HalalDamuMapMarker[],
  user?: { lat: number; lon: number } | null
): string {
  if (!markers.length) return user ? `u:${user.lat.toFixed(4)},${user.lon.toFixed(4)}` : "empty";
  const first = markers[0]!;
  const last = markers[markers.length - 1]!;
  const u = user ? `${user.lat.toFixed(4)},${user.lon.toFixed(4)}` : "";
  return `${markers.length}:${first.id}:${last.id}:${u}`;
}

export function peekHalalMapSession(key?: string): HalalMapSessionSnapshot | null {
  if (key != null) {
    return sessions.get(key) ?? null;
  }
  const vals = [...sessions.values()];
  return vals.length ? vals[vals.length - 1]! : null;
}

export function storeHalalMapSession(snapshot: HalalMapSessionSnapshot): void {
  sessions.set(snapshot.markerKey, snapshot);
  while (sessions.size > MAX_SESSIONS) {
    const oldest = sessions.keys().next().value;
    if (oldest == null) break;
    sessions.delete(oldest);
  }
}

export function clearHalalMapSessionCache(): void {
  sessions.clear();
}
