import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MainTabs } from "./MainTabs";
import { hiddenStackHeaderOptions } from "./hiddenStackHeader";
import { useAppLocale } from "../i18n/runtime";
import type { RootStackParamList } from "./types";
import { lazyScreen } from "./lazyScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();
const AsmaAlHusnaScreen = lazyScreen(() => import("../screens/AsmaAlHusnaScreen").then((m) => ({ default: m.AsmaAlHusnaScreen })));
const PrayerTimesScreen = lazyScreen(() => import("../screens/PrayerTimesScreen").then((m) => ({ default: m.PrayerTimesScreen })));
const PrayerAzanScreen = lazyScreen(() => import("../screens/PrayerAzanScreen").then((m) => ({ default: m.PrayerAzanScreen })));
const QiblaScreen = lazyScreen(() => import("../screens/QiblaScreen").then((m) => ({ default: m.QiblaScreen })));
const MoreNavigator = lazyScreen(() => import("./MoreStack").then((m) => ({ default: m.MoreNavigator })));

export function RootNavigator() {
  useAppLocale();

  return (
    <Stack.Navigator screenOptions={hiddenStackHeaderOptions}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="AsmaAlHusna" component={AsmaAlHusnaScreen} />
      <Stack.Screen name="PrayerTimes" component={PrayerTimesScreen} />
      <Stack.Screen name="PrayerAzan" component={PrayerAzanScreen} />
      <Stack.Screen name="Qibla" component={QiblaScreen} />
      <Stack.Screen name="MoreStack" component={MoreNavigator} />
    </Stack.Navigator>
  );
}
