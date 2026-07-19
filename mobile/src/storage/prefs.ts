import AsyncStorage from "@react-native-async-storage/async-storage";

const K = {
  onboardingDone: "raqat_onboarding_done",
  /** Орын + хабарлама + дағыс рұқсаттары бір рет сұралғаны */
  firstLaunchPermissionsBurst: "raqat_first_launch_perm_burst_v1",
  city: "raqat_city",
  country: "raqat_country",
  savedCities: "raqat_saved_cities",
  notifEnabled: "raqat_notif_enabled",
  iftarEnabled: "raqat_iftar_enabled",
  /** Намаз уақыты хабарламасының дыбыс түрі (жинақтағы MP3 немесе дыбыссыз) */
  prayerNotifSoundId: "raqat_prayer_notif_sound_id",
  /** Әр намазға жеке азан дыбысын өшіру (JSON array: fajr/dhuhr/asr/maghrib/isha) */
  prayerNotifMutedSalatKeys: "raqat_prayer_notif_muted_salat_keys_v1",
  /** Ескі boolean кілт (миграция үшін) */
  prayerNotifSoundEnabledLegacy: "raqat_prayer_notif_sound_enabled",
  prayerSourceMode: "raqat_prayer_source_mode",
  prayerMosqueShiftMin: "raqat_prayer_mosque_shift_min",
  tasbihDhikrId: "raqat_tasbih_dhikr_id",
  tasbihGoalMode: "raqat_tasbih_goal_mode",
  tasbihCount: "raqat_tasbih_count",
  /** Әр зікір id үшін жеке санау (JSON: { "1": 5, "2": 0, ... }) */
  tasbihDhikrCountsMap: "raqat_tasbih_dhikr_counts_map",
  qiblaMotionMode: "raqat_qibla_motion_mode_v1",
  /** GPS/Wi‑Fi арқылы қала, ауа райы, құбыла автоматты жаңарту */
  prayerLocationAuto: "raqat_prayer_location_auto_v1",
  cityLat: "raqat_city_lat_v1",
  cityLon: "raqat_city_lon_v1",
  /** Аноним қолданба статистикасы (opt-out) */
  usageAnalyticsEnabled: "raqat_usage_analytics_enabled_v1",
} as const;

export type QiblaMotionMode = "balanced" | "fast";

export type TasbihGoalMode = "33" | "100" | "infinite";
export type PrayerSourceMode = "calc" | "mosque";

export type CityLocationMode = "auto" | "manual";

export type SavedCity = { city: string; country: string };

export async function getOnboardingDone(): Promise<boolean> {
  const v = await AsyncStorage.getItem(K.onboardingDone);
  return v === "1";
}

export async function setOnboardingDone(): Promise<void> {
  await AsyncStorage.setItem(K.onboardingDone, "1");
}

export async function getFirstLaunchPermissionsBurstDone(): Promise<boolean> {
  return (await AsyncStorage.getItem(K.firstLaunchPermissionsBurst)) === "1";
}

export async function setFirstLaunchPermissionsBurstDone(): Promise<void> {
  await AsyncStorage.setItem(K.firstLaunchPermissionsBurst, "1");
}

export async function getSelectedCity(): Promise<{ city: string; country: string }> {
  const city = ((await AsyncStorage.getItem(K.city)) ?? "").trim() || "Shymkent";
  const country = ((await AsyncStorage.getItem(K.country)) ?? "").trim() || "Kazakhstan";
  return { city, country };
}

export async function setSelectedCity(city: string, country: string): Promise<void> {
  const safeCity = city.trim() || "Shymkent";
  const safeCountry = country.trim() || "Kazakhstan";
  await AsyncStorage.multiSet([
    [K.city, safeCity],
    [K.country, safeCountry],
  ]);
}

/** Әдепкі: GPS/Wi‑Fi/желі арқылы қала мен координатты автоматты алу. */
export async function getPrayerLocationAutoEnabled(): Promise<boolean> {
  const v = await AsyncStorage.getItem(K.prayerLocationAuto);
  return v !== "0";
}

export async function setPrayerLocationAutoEnabled(on: boolean): Promise<void> {
  await AsyncStorage.setItem(K.prayerLocationAuto, on ? "1" : "0");
}

export async function getCityLocationMode(): Promise<CityLocationMode> {
  return (await getPrayerLocationAutoEnabled()) ? "auto" : "manual";
}

export async function setSelectedCityCoords(lat: number, lon: number): Promise<void> {
  await AsyncStorage.multiSet([
    [K.cityLat, String(lat)],
    [K.cityLon, String(lon)],
  ]);
}

export async function getSelectedCityCoords(): Promise<{ lat: number; lon: number } | null> {
  const latRaw = await AsyncStorage.getItem(K.cityLat);
  const lonRaw = await AsyncStorage.getItem(K.cityLon);
  const lat = latRaw != null ? Number(latRaw) : NaN;
  const lon = lonRaw != null ? Number(lonRaw) : NaN;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon };
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

export type PrayerNotifSoundId = "off" | "adhan_haramain";

export type PrayerNotifSalatKey = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

const PRAYER_SOUND_IDS: PrayerNotifSoundId[] = ["off", "adhan_haramain"];

export const PRAYER_NOTIF_SALAT_KEYS: PrayerNotifSalatKey[] = [
  "fajr",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
];

/** Баптаулар тізімі — жинақтағы жалғыз азан. */
export const PRAYER_NOTIF_SOUND_UI_ORDER: PrayerNotifSoundId[] = ["adhan_haramain"];

function isPrayerNotifSoundId(x: string | null): x is PrayerNotifSoundId {
  return x != null && (PRAYER_SOUND_IDS as string[]).includes(x);
}

export async function getPrayerNotifSoundId(): Promise<PrayerNotifSoundId> {
  const raw = await AsyncStorage.getItem(K.prayerNotifSoundId);
  if (isPrayerNotifSoundId(raw)) return raw;
  const migrated = migrateLegacyPrayerNotifSoundId(raw);
  if (migrated) {
    await AsyncStorage.setItem(K.prayerNotifSoundId, migrated);
    return migrated;
  }
  const legacy = await AsyncStorage.getItem(K.prayerNotifSoundEnabledLegacy);
  /** Ескі нұсқадан жаңарғанда — бұрынғы қосқышқа сәйкес; чисто орнатқанда — азан әдепкісі */
  const next: PrayerNotifSoundId =
    legacy === "0" ? "off" : "adhan_haramain";
  await AsyncStorage.setItem(K.prayerNotifSoundId, next);
  return next;
}

function migrateLegacyPrayerNotifSoundId(raw: string | null): PrayerNotifSoundId | null {
  switch (raw) {
    case "off":
      return "off";
    case "adhan_haramain":
      return "adhan_haramain";
    case "azan_madina":
    case "adhan_madina_clear":
    case "azan_makkah":
    case "adhan_makkah_live":
    case "azan_soft":
    case "adhan_soft_cc0":
    case "azan_takbir":
    case "adhan_takbir_high":
    case "azan_classic":
    case "system":
    case "bell":
    case "chime":
      return "adhan_haramain";
    default:
      return null;
  }
}

export async function setPrayerNotifSoundId(id: PrayerNotifSoundId): Promise<void> {
  await AsyncStorage.setItem(K.prayerNotifSoundId, id);
}

function isPrayerNotifSalatKey(x: unknown): x is PrayerNotifSalatKey {
  return typeof x === "string" && (PRAYER_NOTIF_SALAT_KEYS as string[]).includes(x);
}

export async function getPrayerNotifMutedSalatKeys(): Promise<PrayerNotifSalatKey[]> {
  const raw = await AsyncStorage.getItem(K.prayerNotifMutedSalatKeys);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const deduped = new Set<PrayerNotifSalatKey>();
    for (const x of parsed) {
      if (isPrayerNotifSalatKey(x)) deduped.add(x);
    }
    return PRAYER_NOTIF_SALAT_KEYS.filter((k) => deduped.has(k));
  } catch {
    return [];
  }
}

export async function setPrayerNotifMutedSalatKeys(keys: PrayerNotifSalatKey[]): Promise<void> {
  const allowed = new Set(keys.filter(isPrayerNotifSalatKey));
  const ordered = PRAYER_NOTIF_SALAT_KEYS.filter((k) => allowed.has(k));
  await AsyncStorage.setItem(K.prayerNotifMutedSalatKeys, JSON.stringify(ordered));
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

export async function getQiblaMotionMode(): Promise<QiblaMotionMode> {
  const v = await AsyncStorage.getItem(K.qiblaMotionMode);
  if (v === "fast" || v === "balanced") return v;
  return "balanced";
}

export async function setQiblaMotionMode(mode: QiblaMotionMode): Promise<void> {
  await AsyncStorage.setItem(K.qiblaMotionMode, mode);
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
    goalRaw === "33"
      ? "33"
      : goalRaw === "100" || goalRaw === "99"
        ? "100"
        : "infinite";
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

/** Әдепкі: қосулы. Пайдаланушы өшіре алады. */
export async function getUsageAnalyticsEnabled(): Promise<boolean> {
  const v = await AsyncStorage.getItem(K.usageAnalyticsEnabled);
  if (v == null) return true;
  return v === "1" || v === "true";
}

export async function setUsageAnalyticsEnabled(on: boolean): Promise<void> {
  await AsyncStorage.setItem(K.usageAnalyticsEnabled, on ? "1" : "0");
}
