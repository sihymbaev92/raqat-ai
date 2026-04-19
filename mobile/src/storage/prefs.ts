import AsyncStorage from "@react-native-async-storage/async-storage";

const K = {
  onboardingDone: "raqat_onboarding_done",
  city: "raqat_city",
  country: "raqat_country",
  savedCities: "raqat_saved_cities",
  notifEnabled: "raqat_notif_enabled",
  iftarEnabled: "raqat_iftar_enabled",
  tasbihDhikrId: "raqat_tasbih_dhikr_id",
  tasbihGoalMode: "raqat_tasbih_goal_mode",
  tasbihCount: "raqat_tasbih_count",
} as const;

export type TasbihGoalMode = "33" | "99" | "default";

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
