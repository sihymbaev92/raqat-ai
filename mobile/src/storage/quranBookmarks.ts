import AsyncStorage from "@react-native-async-storage/async-storage";
import { getRaqatApiBase } from "../config/raqatApiBase";
import { fetchMeQuranBookmarks, putMeQuranBookmarks } from "../services/platformApiClient";
import { getValidAccessToken } from "./authTokens";

const KEY = "raqat_quran_bookmarks_v1";

function sortUniqueSurahs(nums: number[]): number[] {
  const s = new Set(nums.filter((n) => n >= 1 && n <= 114));
  return Array.from(s).sort((a, b) => a - b);
}

function sameSortedSurahs(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((n, i) => n === b[i]);
}

function normalizeRemoteSurahs(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  return sortUniqueSurahs(raw.filter((x): x is number => typeof x === "number"));
}

export async function getBookmarkedSurahs(): Promise<number[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const j = JSON.parse(raw) as unknown;
    if (!Array.isArray(j)) return [];
    return sortUniqueSurahs(j.filter((x): x is number => typeof x === "number"));
  } catch {
    return [];
  }
}

async function writeBookmarkedSurahs(next: number[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(sortUniqueSurahs(next)));
}

export async function toggleBookmarkSurah(n: number): Promise<boolean> {
  const cur = await getBookmarkedSurahs();
  const has = cur.includes(n);
  const next = has ? cur.filter((x) => x !== n) : sortUniqueSurahs([...cur, n]);
  await writeBookmarkedSurahs(next);
  void pushQuranBookmarksToServerIfLoggedIn(next);
  return !has;
}

export async function isSurahBookmarked(n: number): Promise<boolean> {
  const cur = await getBookmarkedSurahs();
  return cur.includes(n);
}

export async function pushQuranBookmarksToServerIfLoggedIn(surahs?: number[]): Promise<void> {
  const base = getRaqatApiBase();
  if (!base) return;
  const access = await getValidAccessToken();
  if (!access) return;
  const payload = surahs ?? (await getBookmarkedSurahs());
  await putMeQuranBookmarks(base, access, payload);
}

/** Логин / foreground: жергілікті ↔ сервер біріктіру (union merge). */
export async function syncQuranBookmarksWithServerBidirectional(): Promise<void> {
  const base = getRaqatApiBase();
  if (!base) return;
  const access = await getValidAccessToken();
  if (!access) return;
  const local = await getBookmarkedSurahs();
  const r = await fetchMeQuranBookmarks(base, access);
  if (!r.ok || r.status === 401) return;
  const remote = normalizeRemoteSurahs(r.surahs);
  if (remote.length === 0 && local.length > 0) {
    await putMeQuranBookmarks(base, access, local);
    return;
  }
  if (remote.length === 0) return;
  const merged = sortUniqueSurahs([...local, ...remote]);
  await writeBookmarkedSurahs(merged);
  if (!sameSortedSurahs(remote, merged)) {
    await putMeQuranBookmarks(base, access, merged);
  }
}
