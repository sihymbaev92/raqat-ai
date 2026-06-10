import AsyncStorage from "@react-native-async-storage/async-storage";
import { getRaqatApiBase } from "../config/raqatApiBase";
import {
  fetchMeQuranAyahMarkers,
  putMeQuranAyahMarkers,
} from "../services/platformApiClient";
import { getValidAccessToken } from "./authTokens";

const KEY = "quran_ayah_markers_v1";

export type AyahMarkerColorId = "gold" | "rose" | "sky" | "emerald" | "violet" | "slate";

export type AyahMarkerRecord = {
  colorId: AyahMarkerColorId;
  note: string;
};

export const AYAH_MARKER_COLOR_HEX: Record<AyahMarkerColorId, string> = {
  gold: "#C9A227",
  rose: "#E11D48",
  sky: "#0284C7",
  emerald: "#059669",
  violet: "#7C3AED",
  slate: "#57534E",
};

function ayahKey(surah: number, ayah: number): string {
  return `${surah}:${ayah}`;
}

export async function loadAyahMarkers(): Promise<Record<string, AyahMarkerRecord>> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw?.trim()) return {};
    const j = JSON.parse(raw) as unknown;
    if (!j || typeof j !== "object") return {};
    const out: Record<string, AyahMarkerRecord> = {};
    for (const [k, v] of Object.entries(j as Record<string, unknown>)) {
      if (!v || typeof v !== "object") continue;
      const o = v as Partial<AyahMarkerRecord>;
      if (!o.colorId || typeof o.note !== "string") continue;
      if (!(o.colorId in AYAH_MARKER_COLOR_HEX)) continue;
      out[k] = { colorId: o.colorId as AyahMarkerColorId, note: o.note };
    }
    return out;
  } catch {
    return {};
  }
}

async function writeAll(map: Record<string, AyahMarkerRecord>): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(map));
}

export async function getAyahMarker(surah: number, ayah: number): Promise<AyahMarkerRecord | null> {
  const all = await loadAyahMarkers();
  return all[ayahKey(surah, ayah)] ?? null;
}

export async function setAyahMarker(
  surah: number,
  ayah: number,
  patch: Partial<Pick<AyahMarkerRecord, "colorId" | "note">> & { colorId: AyahMarkerColorId }
): Promise<void> {
  const all = await loadAyahMarkers();
  const k = ayahKey(surah, ayah);
  const prev = all[k];
  all[k] = {
    colorId: patch.colorId,
    note: patch.note !== undefined ? patch.note : prev?.note ?? "",
  };
  await writeAll(all);
  void pushQuranAyahMarkersToServerIfLoggedIn(all);
}

export async function removeAyahMarker(surah: number, ayah: number): Promise<void> {
  const all = await loadAyahMarkers();
  delete all[ayahKey(surah, ayah)];
  await writeAll(all);
  void pushQuranAyahMarkersToServerIfLoggedIn(all);
}

function normalizeRemoteMarkers(raw: unknown): Record<string, AyahMarkerRecord> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, AyahMarkerRecord> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!v || typeof v !== "object") continue;
    const o = v as Partial<AyahMarkerRecord>;
    if (!o.colorId || typeof o.note !== "string") continue;
    if (!(o.colorId in AYAH_MARKER_COLOR_HEX)) continue;
    out[k] = { colorId: o.colorId as AyahMarkerColorId, note: o.note };
  }
  return out;
}

export async function pushQuranAyahMarkersToServerIfLoggedIn(
  state?: Record<string, AyahMarkerRecord>
): Promise<void> {
  const base = getRaqatApiBase();
  if (!base) return;
  const access = await getValidAccessToken();
  if (!access) return;
  const markers = state ?? (await loadAyahMarkers());
  if (Object.keys(markers).length === 0) return;
  await putMeQuranAyahMarkers(base, access, markers);
}

/** Логин / баптаулар: жергілікті ↔ сервер біріктіру. */
export async function syncQuranAyahMarkersWithServerBidirectional(): Promise<void> {
  const base = getRaqatApiBase();
  if (!base) return;
  const access = await getValidAccessToken();
  if (!access) return;
  const local = await loadAyahMarkers();
  const r = await fetchMeQuranAyahMarkers(base, access);
  if (!r.ok || r.status === 401) return;
  const remote = normalizeRemoteMarkers(r.markers);
  const remoteKeys = Object.keys(remote);
  const localKeys = Object.keys(local);
  if (remoteKeys.length === 0 && localKeys.length > 0) {
    await putMeQuranAyahMarkers(base, access, local);
    return;
  }
  if (remoteKeys.length === 0) return;
  const merged = { ...local, ...remote };
  await writeAll(merged);
  if (localKeys.length > 0) {
    await putMeQuranAyahMarkers(base, access, merged);
  }
}
