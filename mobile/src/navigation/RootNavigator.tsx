import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MainTabs } from "./MainTabs";
import { MoreNavigator } from "./MoreStack";
import { AsmaAlHusnaScreen } from "../screens/AsmaAlHusnaScreen";
import { PrayerTimesScreen } from "../screens/PrayerTimesScreen";
import { QiblaScreen } from "../screens/QiblaScreen";
import { useAppTheme } from "../theme/ThemeContext";
import { kk } from "../i18n/kk";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { colors } = useAppTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen
        name="AsmaAlHusna"
        component={AsmaAlHusnaScreen}
        options={{
          headerShown: true,
          title: kk.asma.screenTitle,
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: "600" },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="PrayerTimes"
        component={PrayerTimesScreen}
        options={{
          headerShown: true,
          title: kk.prayer.title,
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: "600" },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="Qibla"
        component={QiblaScreen}
        options={{
          headerShown: true,
          title: kk.tabs.qibla,
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: "600" },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="MoreStack"
        component={MoreNavigator}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
