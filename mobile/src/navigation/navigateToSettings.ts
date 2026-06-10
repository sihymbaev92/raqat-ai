import { navigateToMoreStackScreen, type StackNavLike } from "./navigateToMoreStack";

type NavLike = StackNavLike & {
  getState?: () => { routeNames?: string[] };
};

type DomainSettingsScreen = "Settings" | "PrayerSettings" | "QuranSettings";

function canNavigateSettingsDirect(navigation: NavLike | undefined, screen: DomainSettingsScreen): boolean {
  try {
    const names = navigation?.getState?.()?.routeNames;
    return Array.isArray(names) && names.includes(screen);
  } catch {
    return false;
  }
}

function navigateMoreStackScreen(screen: DomainSettingsScreen, navigation?: NavLike): void {
  if (navigation && canNavigateSettingsDirect(navigation, screen)) {
    navigation.navigate(screen);
    return;
  }
  navigateToMoreStackScreen(screen, undefined, navigation);
}

/** Жалпы қолданба баптаулары (көрініс, API, құбыла, сілтемелер). */
export function navigateToAppSettings(navigation?: NavLike): void {
  try {
    const names = navigation?.getState?.()?.routeNames;
    if (Array.isArray(names) && names.includes("Profile")) {
      navigation?.navigate("Profile" as never);
      return;
    }
  } catch {
    /* fallback */
  }
  navigateMoreStackScreen("Settings", navigation);
}

/** Намаз: қала, кесте, хабарламалар, азан дыбысы. */
export function navigateToPrayerSettings(navigation?: NavLike): void {
  navigateMoreStackScreen("PrayerSettings", navigation);
}

/** Құран оқу интерфейсі және офлайн дерек. */
export function navigateToQuranSettings(navigation?: NavLike): void {
  navigateMoreStackScreen("QuranSettings", navigation);
}
