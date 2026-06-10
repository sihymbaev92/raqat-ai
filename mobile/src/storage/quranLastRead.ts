import AsyncStorage from "@react-native-async-storage/async-storage";
import { recordQuranReadingDay } from "./quranReadingStreak";
import { getRaqatApiBase } from "../config/raqatApiBase";
import { fetchMeQuranLastRead, putMeQuranLastRead } from "../services/platformApiClient";
import { getValidAccessToken } from "./authTokens";

const ENABLED_KEY = "quran_last_read_enabled_v1";
const STATE_KEY = "quran_last_read_state_v1";

export type QuranLastReadGlobal = { surah: number; ayah: number; ts: string };

export type QuranLastReadState = {
  global: QuranLastReadGlobal | null;
  /** Сүре нөмірі → соңғы аят (сол сүре ішінде) */
  bySurah: Record<string, number>;
};

const emptyState = (): QuranLastReadState => ({ global: null, bySurah: {} });

export async function getQuranLastReadEnabled(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(ENABLED_KEY);
    if (v == null) return true;
    return v === "1";
  } catch {
    return true;
  }
}

export async function setQuranLastReadEnabled(on: boolean): Promise<void> {
  await AsyncStorage.setItem(ENABLED_KEY, on ? "1" : "0");
}

export async function loadQuranLastReadState(): Promise<QuranLastReadState> {
  try {
    const raw = await AsyncStorage.getItem(STATE_KEY);
    if (!raw?.trim()) return emptyState();
    const j = JSON.parse(raw) as Partial<QuranLastReadState>;
    const global =
      j.global &&
      typeof j.global.surah === "number" &&
      typeof j.global.ayah === "number" &&
      typeof j.global.ts === "string"
        ? j.global
        : null;
    const bySurah: Record<string, number> = {};
    if (j.bySurah && typeof j.bySurah === "object") {
      for (const [k, v] of Object.entries(j.bySurah)) {
        if (typeof v === "number" && v > 0) bySurah[k] = Math.floor(v);
      }
    }
    return { global, bySurah };
  } catch {
    return emptyState();
  }
}

async function writeState(next: QuranLastReadState): Promise<void> {
  await AsyncStorage.setItem(STATE_KEY, JSON.stringify(next));
}

function stateHasData(st: QuranLastReadState): boolean {
  if (st.global) return true;
  return Object.keys(st.bySurah).length > 0;
}

function toApiPayload(st: QuranLastReadState): {
  global: QuranLastReadGlobal | null;
  by_surah: Record<string, number>;
} {
  return {
    global: st.global,
    by_surah: { ...st.bySurah },
  };
}

function mergeLastReadState(local: QuranLastReadState, remote: QuranLastReadState): QuranLastReadState {
  const bySurah = { ...local.bySurah };
  for (const [k, v] of Object.entries(remote.bySurah)) {
    const cur = bySurah[k];
    if (cur == null || v > cur) bySurah[k] = v;
  }
  let global = local.global;
  if (remote.global) {
    if (!global || remote.global.ts > global.ts) global = remote.global;
  }
  return { global, bySurah };
}

function remoteToState(payload: {
  global?: QuranLastReadGlobal | null;
  by_surah?: Record<string, number>;
}): QuranLastReadState {
  const bySurah: Record<string, number> = {};
  if (payload.by_surah && typeof payload.by_surah === "object") {
    for (const [k, v] of Object.entries(payload.by_surah)) {
      if (typeof v === "number" && v > 0) bySurah[k] = Math.floor(v);
    }
  }
  const g = payload.global;
  const global =
    g &&
    typeof g.surah === "number" &&
    typeof g.ayah === "number" &&
    typeof g.ts === "string"
      ? g
      : null;
  return { global, bySurah };
}

export async function pushQuranLastReadToServerIfLoggedIn(state?: QuranLastReadState): Promise<void> {
  const base = getRaqatApiBase();
  if (!base) return;
  const access = await getValidAccessToken();
  if (!access) return;
  const st = state ?? (await loadQuranLastReadState());
  if (!stateHasData(st)) return;
  await putMeQuranLastRead(base, access, toApiPayload(st));
}

export async function syncQuranLastReadWithServerBidirectional(): Promise<void> {
  const base = getRaqatApiBase();
  if (!base) return;
  const access = await getValidAccessToken();
  if (!access) return;
  const local = await loadQuranLastReadState();
  const r = await fetchMeQuranLastRead(base, access);
  if (!r.ok || r.status === 401) return;
  const remote = remoteToState({ global: r.global ?? null, by_surah: r.by_surah ?? {} });
  if (!stateHasData(remote) && stateHasData(local)) {
    await putMeQuranLastRead(base, access, toApiPayload(local));
    return;
  }
  if (!stateHasData(remote)) return;
  const merged = mergeLastReadState(local, remote);
  await writeState(merged);
  await putMeQuranLastRead(base, access, toApiPayload(merged));
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSave: { surah: number; ayah: number } | null = null;

/** Скролл кезінде шақырылады — 800 ms дебаунс. */
export function scheduleQuranLastReadSave(surah: number, ayah: number): void {
  pendingSave = { surah, ayah };
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    const p = pendingSave;
    pendingSave = null;
    if (p) void persistQuranLastRead(p.surah, p.ayah);
  }, 800);
}

/**
 * Дебаунсты тазалап, көрсетілген сүре/аятты бірден сақтайды (blur, қолданушы анық орын).
 * pending-тен жаңа болуы мүмкін — blur кезінде footer нүктесі басым.
 */
export async function saveQuranLastReadNow(surah: number, ayah: number): Promise<void> {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  pendingSave = null;
  await persistQuranLastRead(surah, ayah);
}

async function persistQuranLastRead(surah: number, ayah: number): Promise<void> {
  const ok = await getQuranLastReadEnabled();
  if (!ok) return;
  if (surah < 1 || surah > 114 || ayah < 1) return;
  const prev = await loadQuranLastReadState();
  const ts = new Date().toISOString();
  const global: QuranLastReadGlobal = { surah, ayah, ts };
  const bySurah = { ...prev.bySurah, [String(surah)]: Math.floor(ayah) };
  const next = { global, bySurah };
  await writeState(next);
  void pushQuranLastReadToServerIfLoggedIn(next);
  void recordQuranReadingDay();
}

export async function clearQuranLastReadPositions(): Promise<void> {
  await writeState(emptyState());
  void pushQuranLastReadToServerIfLoggedIn(emptyState());
}
