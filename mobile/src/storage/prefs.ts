import AsyncStorage from "@react-native-async-storage/async-storage";

const K = {
  onboardingDone: "raqat_onboarding_done",
  city: "raqat_city",
  country: "raqat_country",
  savedCities: "raqat_saved_cities",
  notifEnabled: "raqat_notif_enabled",
  iftarEnabled: "raqat_iftar_enabled",
  prayerSourceMode: "raqat_prayer_source_mode",
  prayerMosqueShiftMin: "raqat_prayer_mosque_shift_min",
  tasbihDhikrId: "raqat_tasbih_dhikr_id",
  tasbihGoalMode: "raqat_tasbih_goal_mode",
  tasbihCount: "raqat_tasbih_count",
  /** Әр зікір id үшін жеке санау (JSON: { "1": 5, "2": 0, ... }) */
  tasbihDhikrCountsMap: "raqat_tasbih_dhikr_counts_map",
} as const;

export type TasbihGoalMode = "33" | "99" | "default";
export type PrayerSourceMode = "calc" | "mosque";

export type SavedCity = { city: string; country: string };

export async function getOnboardingDone(): Promise<boolean> {
  const v = await AsyncStorage.getItem(K.onboardingDone);
  return v === "1";
}

export async function setOnboardingDone(): Promise<void> {
  await AsyncStorage.setItem(K.onboardingDone, "1");
}

export async function getSelectedCity(): Promise<{ city: string; country: string }> {
  const city = (await AsyncStorage.getItem(K.city)) ?? "Shymkent";
  const country = (await AsyncStorage.getItem(K.country)) ?? "Kazakhstan";
  return { city, country };
}

export async function setSelectedCity(city: string, country: string): Promise<void> {
  await AsyncStorage.multiSet([
    [K.city, city.trim()],
    [K.country, country.trim()],
  ]);
}

export async function getSavedCities(): Promise<SavedCity[]> {
  const raw = await AsyncStorage.getItem(K.savedCities);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is SavedCity =>
        typeof x === "object" &&
        x !== null &&
        typeof (x as SavedCity).city === "string" &&
        typeof (x as SavedCity).country === "string"
    );
  } catch {
    return [];
  }
}

export async function addSavedCity(city: string, country: string): Promise<void> {
  const list = await getSavedCities();
  const next = [{ city: city.trim(), country: country.trim() }].concat(
    list.filter((x) => x.city !== city.trim() || x.country !== country.trim())
  );
  const capped = next.slice(0, 12);
  await AsyncStorage.setItem(K.savedCities, JSON.stringify(capped));
}

export async function getNotifEnabled(): Promise<boolean> {
  const v = await AsyncStorage.getItem(K.notifEnabled);
  return v !== "0";
}

export async function setNotifEnabled(on: boolean): Promise<void> {
  await AsyncStorage.setItem(K.notifEnabled, on ? "1" : "0");
}

export async function getIftarEnabled(): Promise<boolean> {
  const v = await AsyncStorage.getItem(K.iftarEnabled);
  return v === "1";
}

export async function setIftarEnabled(on: boolean): Promise<void> {
  await AsyncStorage.setItem(K.iftarEnabled, on ? "1" : "0");
}

export async function getPrayerSourceMode(): Promise<PrayerSourceMode> {
  const v = await AsyncStorage.getItem(K.prayerSourceMode);
  return v === "mosque" ? "mosque" : "calc";
}

export async function setPrayerSourceMode(mode: PrayerSourceMode): Promise<void> {
  await AsyncStorage.setItem(K.prayerSourceMode, mode);
}

export async function getPrayerMosqueShiftMin(): Promise<number> {
  const raw = await AsyncStorage.getItem(K.prayerMosqueShiftMin);
  const n = raw == null ? 0 : parseInt(raw, 10);
  if (!Number.isFinite(n)) return 0;
  return Math.max(-30, Math.min(30, n));
}

export async function setPrayerMosqueShiftMin(shiftMin: number): Promise<void> {
  const n = Math.max(-30, Math.min(30, Math.trunc(shiftMin)));
  await AsyncStorage.setItem(K.prayerMosqueShiftMin, String(n));
}

export async function getTasbihPrefs(): Promise<{
  dhikrId: number | null;
  goalMode: TasbihGoalMode;
  count: number;
}> {
  const idRaw = await AsyncStorage.getItem(K.tasbihDhikrId);
  const goalRaw = await AsyncStorage.getItem(K.tasbihGoalMode);
  const countRaw = await AsyncStorage.getItem(K.tasbihCount);
  const n = idRaw ? parseInt(idRaw, 10) : NaN;
  const dhikrId = Number.isFinite(n) ? n : null;
  const goalMode: TasbihGoalMode =
    goalRaw === "33" || goalRaw === "99" || goalRaw === "default" ? goalRaw : "default";
  const c = countRaw ? parseInt(countRaw, 10) : 0;
  const count = Number.isFinite(c) && c >= 0 ? c : 0;
  return { dhikrId, goalMode, count };
}

export async function setTasbihPrefs(
  dhikrId: number,
  goalMode: TasbihGoalMode,
  count: number
): Promise<void> {
  await AsyncStorage.multiSet([
    [K.tasbihDhikrId, String(dhikrId)],
    [K.tasbihGoalMode, goalMode],
    [K.tasbihCount, String(Math.max(0, Math.floor(count)))],
  ]);
}

/** Әр зікір үшін сақталған санаулар (id → count). */
export async function getAllDhikrCounts(): Promise<Record<number, number>> {
  const raw = await AsyncStorage.getItem(K.tasbihDhikrCountsMap);
  if (!raw) return {};
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<number, number> = {};
    for (const [key, v] of Object.entries(o)) {
      const id = parseInt(key, 10);
      if (!Number.isFinite(id)) continue;
      const n = typeof v === "number" ? v : parseInt(String(v), 10);
      if (Number.isFinite(n) && n >= 0) out[id] = Math.floor(n);
    }
    return out;
  } catch {
    return {};
  }
}

export async function setAllDhikrCounts(map: Record<number, number>): Promise<void> {
  const serial: Record<string, number> = {};
  for (const [k, v] of Object.entries(map)) {
    serial[String(k)] = Math.max(0, Math.floor(v));
  }
  await AsyncStorage.setItem(K.tasbihDhikrCountsMap, JSON.stringify(serial));
}

export async function setDhikrCountForId(dhikrId: number, count: number): Promise<void> {
  const all = await getAllDhikrCounts();
  all[dhikrId] = Math.max(0, Math.floor(count));
  await setAllDhikrCounts(all);
}

/** Ескі тек бір id сақталған кезде: оны картаға көшіру. */
export async function migrateLegacyTasbihCountIntoMap(): Promise<void> {
  const prefs = await getTasbihPrefs();
  if (prefs.dhikrId == null) return;
  const all = await getAllDhikrCounts();
  if (all[prefs.dhikrId] === undefined) {
    all[prefs.dhikrId] = prefs.count;
    await setAllDhikrCounts(all);
  }
}
