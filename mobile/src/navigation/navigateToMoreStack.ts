import { CommonActions } from "@react-navigation/native";
import type { NavigatorScreenParams } from "@react-navigation/native";
import { rootNavigationRef } from "./rootNavigationRef";
import type { MainTabParamList, MoreStackParamList, RootStackParamList } from "./types";

/** Navigation helpers — any React Navigation stack/tab instance. */
export type StackNavLike = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigate: (...args: any[]) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: (...args: any[]) => void;
  getParent?: () => StackNavLike | undefined;
  getState?: () => { routeNames?: string[] };
};

type RootShortcutScreen = keyof Pick<RootStackParamList, "PrayerTimes" | "Qibla" | "AsmaAlHusna">;
type MainTabScreen = keyof Pick<MainTabParamList, "Tasbih" | "Duas">;

function moreStackParams<S extends keyof MoreStackParamList>(
  screen: S,
  params?: MoreStackParamList[S]
): NavigatorScreenParams<MoreStackParamList> {
  return (params !== undefined ? { screen, params } : { screen }) as NavigatorScreenParams<MoreStackParamList>;
}

const MORE_STACK_ROUTE_MARKERS = [
  "ContentHub",
  "QuranList",
  "QuranSurah",
  "Hatim",
  "QuranMushafBook",
  "NamazGuide",
  "Settings",
  "QuranSettings",
] as const;

/** Шақырушы MoreStack navigator-інде ме. */
export function isInsideMoreStackNavigator(navigation?: StackNavLike): boolean {
  try {
    const names = navigation?.getState?.()?.routeNames;
    if (!Array.isArray(names)) return false;
    return MORE_STACK_ROUTE_MARKERS.some((m) => names.includes(m));
  } catch {
    return false;
  }
}

function navigateMoreStackDirect<S extends keyof MoreStackParamList>(
  navigation: StackNavLike,
  screen: S,
  params?: MoreStackParamList[S]
): void {
  if (params !== undefined) {
    navigation.navigate(screen as string, params as object);
  } else {
    navigation.navigate(screen as string);
  }
}

function tryNavigateMoreStack(navigation: StackNavLike | undefined, nested: NavigatorScreenParams<MoreStackParamList>): boolean {
  if (!navigation) return false;
  try {
    navigation.navigate("MoreStack", nested as object);
    return true;
  } catch {
    /* composite nav */
  }
  const parent = navigation.getParent?.();
  if (parent) {
    try {
      parent.navigate("MoreStack", nested as object);
      return true;
    } catch {
      /* parent stack */
    }
  }
  return false;
}

/** MoreStack ішіндегі экран (Намаз, Құран, т.б.) — түбір stack арқылы сенімді ашу. */
export function navigateToMoreStackScreen<S extends keyof MoreStackParamList>(
  screen: S,
  params?: MoreStackParamList[S],
  navigation?: StackNavLike
): void {
  const nested = moreStackParams(screen, params);

  if (navigation && isInsideMoreStackNavigator(navigation)) {
    navigateMoreStackDirect(navigation, screen, params);
    return;
  }

  if (rootNavigationRef.isReady()) {
    const rootState = rootNavigationRef.getRootState();
    const onMoreStack = rootState?.routes?.[rootState.index ?? 0]?.name === "MoreStack";
    if (onMoreStack) {
      rootNavigationRef.dispatch(
        CommonActions.navigate({
          name: "MoreStack",
          params: nested,
          merge: true,
        })
      );
    } else {
      rootNavigationRef.navigate("MoreStack", nested);
    }
    return;
  }

  const action = CommonActions.navigate({
    name: "MoreStack",
    params: nested,
  });

  const parent = navigation?.getParent?.();
  if (parent) {
    try {
      parent.dispatch(action);
    } catch {
      parent.navigate("MoreStack", nested as object);
    }
  } else if (navigation) {
    try {
      navigation.dispatch(action);
    } catch {
      tryNavigateMoreStack(navigation, nested);
    }
  }
}

/** Құран хатымы — MoreStack/Hatim (басты бет, сүре тізімі, баптаулар). */
export function navigateToHatim(navigation?: StackNavLike): void {
  navigateToMoreStackScreen("Hatim", undefined, navigation);
}

/** Hafs 604-беттік хатым мұсаф. */
export function navigateToQuranMushafBook(
  params: MoreStackParamList["QuranMushafBook"],
  navigation?: StackNavLike
): void {
  navigateToMoreStackScreen("QuranMushafBook", params, navigation);
}

/** Сүре оқу экраны. Мұсаф режимі сұралса — нақты Hafs 604 бетіне ашады. */
export function navigateToQuranSurah(
  params: MoreStackParamList["QuranSurah"],
  navigation?: StackNavLike
): void {
  if (params.mushafLayout) {
    navigateToMoreStackScreen(
      "QuranMushafBook",
      {
        focusSurah: params.surahNumber,
        focusAyah: params.initialAyah ?? 1,
        continuousMushaf: true,
      },
      navigation
    );
    return;
  }

  const nested = moreStackParams("QuranSurah", params);

  if (navigation && isInsideMoreStackNavigator(navigation)) {
    try {
      navigation.navigate("QuranSurah", params as object);
      return;
    } catch {
      /* түбір арқылы қайта сынау */
    }
  }

  if (rootNavigationRef.isReady()) {
    rootNavigationRef.navigate("MoreStack", nested);
    return;
  }

  const action = CommonActions.navigate({
    name: "MoreStack",
    params: nested,
  });
  const parent = navigation?.getParent?.();
  if (parent) {
    try {
      parent.dispatch(action);
    } catch {
      parent.navigate("MoreStack", nested as object);
    }
  } else if (navigation) {
    try {
      navigation.dispatch(action);
    } catch {
      tryNavigateMoreStack(navigation, nested);
    }
  }
}

/** Түбір stack: намаз уақыты, құбыла, 99 есім. */
export function navigateToRootStackScreen(
  screen: RootShortcutScreen,
  params?: RootStackParamList[RootShortcutScreen],
  navigation?: StackNavLike
): void {
  const action = CommonActions.navigate({
    name: screen,
    params,
    merge: true,
  });

  if (rootNavigationRef.isReady()) {
    rootNavigationRef.dispatch(action);
    return;
  }

  const parent = navigation?.getParent?.();
  if (parent) {
    try {
      parent.dispatch(action);
      return;
    } catch {
      parent.navigate(screen, params);
      return;
    }
  }

  if (navigation) {
    try {
      navigation.dispatch(action);
    } catch {
      navigation.navigate(screen, params);
    }
  }
}

/** Негізгі таб: тәспі, жергілікті дұғалар. */
export function navigateToMainTabScreen<T extends MainTabScreen>(
  tab: T,
  tabParams?: MainTabParamList[T],
  navigation?: StackNavLike
): void {
  const nested =
    tabParams !== undefined ? { screen: tab, params: tabParams } : { screen: tab };
  const action = CommonActions.navigate({
    name: "Main",
    params: nested,
    merge: true,
  });

  if (rootNavigationRef.isReady()) {
    rootNavigationRef.dispatch(action);
    return;
  }

  const parent = navigation?.getParent?.();
  if (parent) {
    try {
      parent.dispatch(action);
      return;
    } catch {
      parent.navigate("Main", nested);
      return;
    }
  }

  if (navigation) {
    try {
      navigation.dispatch(action);
    } catch {
      navigation.navigate("Main", nested);
    }
  }
}
