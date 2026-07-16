import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAppTheme } from "../theme/ThemeContext";
import { useAppLocale } from "../i18n/runtime";
import type { MainTabParamList } from "./types";
import { hiddenStackHeaderOptions } from "./hiddenStackHeader";
import { lazyScreen } from "./lazyScreen";

const Stack = createNativeStackNavigator<MainTabParamList>();

const DashboardScreen = lazyScreen(() =>
  import("../screens/DashboardScreen").then((m) => ({ default: m.DashboardScreen }))
);

const OfficialKnowledgePortalScreen = lazyScreen(() => import("../screens/OfficialKnowledgePortalScreen").then((m) => ({ default: m.OfficialKnowledgePortalScreen })));
const PrayerTimesScreen = lazyScreen(() => import("../screens/PrayerTimesScreen").then((m) => ({ default: m.PrayerTimesScreen })));
const SavedTabScreen = lazyScreen(() => import("../screens/SavedTabScreen").then((m) => ({ default: m.SavedTabScreen })));
const SettingsScreen = lazyScreen(() => import("../screens/SettingsScreen").then((m) => ({ default: m.SettingsScreen })));
const DuasStack = lazyScreen(() => import("./DuasStack").then((m) => ({ default: m.DuasStack })));
const TasbihStack = lazyScreen(() => import("./TasbihStack").then((m) => ({ default: m.TasbihStack })));

/** Негізгі экрандар — таб жолағы жоқ, тек stack навигация. */
export function MainTabs() {
  const { colors } = useAppTheme();
  useAppLocale();

  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        ...hiddenStackHeaderOptions,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="Home" component={DashboardScreen} />
      <Stack.Screen name="Articles" component={OfficialKnowledgePortalScreen} />
      <Stack.Screen name="PrayerTab" component={PrayerTimesScreen} />
      <Stack.Screen name="Saved" component={SavedTabScreen} />
      <Stack.Screen name="Profile" component={SettingsScreen} />
      <Stack.Screen name="Duas" component={DuasStack} />
      <Stack.Screen name="Tasbih" component={TasbihStack} />
    </Stack.Navigator>
  );
}
