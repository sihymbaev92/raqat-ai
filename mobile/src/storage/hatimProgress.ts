import AsyncStorage from "@react-native-async-storage/async-storage";
import { getRaqatApiBase } from "../config/raqatApiBase";
import { fetchMeHatim, putMeHatim } from "../services/platformApiClient";
import { getValidAccessToken } from "./authTokens";

const KEY_LEGACY_V1 = "raqat_hatim_progress_v1";
const KEY_V2 = "raqat_hatim_progress_v2";

export type HatimResume = { surah: number; ayah: number };

export type HatimProgressV2 = {
  v: 2;
  readSurahs: number[];
  resume: HatimResume | null;
  updatedAt: string;
};

function sortUnique(nums: number[]): number[] {
  const s = new Set(nums.filter((n) => n >= 1 && n <= 114));
  return Array.from(s).sort((a, b) => a - b);
}

type InternalState = {
  readSurahs: Set<number>;
  resume: HatimResume | null;
};

async function persist(state: InternalState): Promise<void> {
  const payload: HatimProgressV2 = {
    v: 2,
    readSurahs: sortUnique([...state.readSurahs]),
    resume: state.resume,
    updatedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(KEY_V2, JSON.stringify(payload));
}

async function loadInternal(): Promise<InternalState> {
  try {
    const rawV2 = await AsyncStorage.getItem(KEY_V2);
    if (rawV2) {
      const j = JSON.parse(rawV2) as HatimProgressV2;
      if (j.v === 2 && Array.isArray(j.readSurahs)) {
        const read = new Set(sortUnique(j.readSurahs.map((n) => parseInt(String(n), 10))));
        let resume: HatimResume | null = null;
        if (j.resume && j.resume.surah >= 1 && j.resume.surah <= 114 && j.resume.ayah >= 1) {
          resume = {
            surah: j.resume.surah,
            ayah: j.resume.ayah,
          };
        }
        return { readSurahs: read, resume };
      }
    }

    const legacy = await AsyncStorage.getItem(KEY_LEGACY_V1);
    if (legacy) {
      const j = JSON.parse(legacy) as { readSurahs?: number[] };
      const read = new Set(
        sortUnique((j.readSurahs ?? []).map((n) => parseInt(String(n), 10)))
      );
      const state: InternalState = { readSurahs: read, resume: null };
      await persist(state);
      await AsyncStorage.removeItem(KEY_LEGACY_V1);
      return state;
    }
  } catch {
    /* */
  }
  return { readSurahs: new Set(), resume: null };
}

export async function loadHatimProgress(): Promise<Set<number>> {
  const s = await loadInternal();
  return s.readSurahs;
}

export async function loadHatimResume(): Promise<HatimResume | null> {
  const s = await loadInternal();
  return s.resume;
}

export async function saveHatimProgress(read: Set<number>): Promise<void> {
  const cur = await loadInternal();
  await persist({ readSurahs: read, resume: cur.resume });
}

/**
 * Аятқа басу: соңғы орын сақталады; соңғы аят болса сүре «оқылды» деп белгіленеді.
 */
export async function recordHatimAyahTapped(
  surah: number,
  ayah: number,
  ayahCountInSurah: number
): Promise<{ completedSurah: boolean }> {
  const s = await loadInternal();
  const resume: HatimResume = {
    surah: Math.max(1, Math.min(114, surah)),
    ayah: Math.max(1, ayah),
  };
  let readSurahs = new Set(s.readSurahs);
  let completedSurah = false;
  const total = Math.max(0, ayahCountInSurah);
  if (total > 0 && ayah >= total) {
    readSurahs.add(resume.surah);
    completedSurah = true;
  }
  await persist({ readSurahs, resume });
  await pushHatimToServerIfLoggedIn(readSurahs);
  return { completedSurah };
}

export async function syncHatimWithServerBidirectional(): Promise<void> {
  const base = getRaqatApiBase();
  if (!base) return;
  const access = await getValidAccessToken();
  if (!access) return;
  const local = await loadInternal();
  const r = await fetchMeHatim(base, access);
  if (!r.ok || r.status === 401) return;
  const remoteArr = Array.isArray(r.read_surahs) ? r.read_surahs : [];
  const remote = new Set(sortUnique(remoteArr.map((x) => parseInt(String(x), 10))));
  if (remote.size === 0 && local.readSurahs.size > 0) {
    await putMeHatim(base, access, sortUnique([...local.readSurahs]));
    return;
  }
  await persist({ readSurahs: remote, resume: local.resume });
}

export async function pushHatimToServerIfLoggedIn(read: Set<number>): Promise<void> {
  const base = getRaqatApiBase();
  if (!base) return;
  const access = await getValidAccessToken();
  if (!access) return;
  await putMeHatim(base, access, sortUnique([...read]));
}

export async function toggleHatimSurah(n: number): Promise<Set<number>> {
  const cur = await loadInternal();
  const read = new Set(cur.readSurahs);
  if (read.has(n)) read.delete(n);
  else read.add(n);
  await persist({ readSurahs: read, resume: cur.resume });
  await pushHatimToServerIfLoggedIn(read);
  return read;
}

export function hatimProgressFraction(read: Set<number>): { read: number; total: number; pct: number } {
  const r = read.size;
  const total = 114;
  return { read: r, total, pct: total ? Math.min(1, r / total) : 0 };
}
