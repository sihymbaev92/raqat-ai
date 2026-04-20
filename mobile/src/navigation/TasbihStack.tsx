import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { TasbihListScreen } from "../screens/TasbihListScreen";
import { TasbihCounterScreen } from "../screens/TasbihCounterScreen";
import { useAppTheme } from "../theme/ThemeContext";
import { kk } from "../i18n/kk";
import type { TasbihStackParamList } from "./types";

const Stack = createNativeStackNavigator<TasbihStackParamList>();

export function TasbihStack() {
  const { colors } = useAppTheme();

  return (
    <Stack.Navigator
      initialRouteName="TasbihList"
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "600", fontSize: 15 },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="TasbihList"
        component={TasbihListScreen}
        options={{ title: kk.tasbih.screenTitle }}
      />
      <Stack.Screen name="TasbihCounter" component={TasbihCounterScreen} />
    </Stack.Navigator>
  );
}
