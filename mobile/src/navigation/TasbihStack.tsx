import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { TasbihListScreen } from "../screens/TasbihListScreen";
import { TasbihCounterScreen } from "../screens/TasbihCounterScreen";
import { useAppTheme } from "../theme/ThemeContext";
import type { TasbihStackParamList } from "./types";
import { hiddenStackHeaderOptions } from "./hiddenStackHeader";

const Stack = createNativeStackNavigator<TasbihStackParamList>();

export function TasbihStack() {
  const { colors } = useAppTheme();

  return (
    <Stack.Navigator
      initialRouteName="TasbihList"
      screenOptions={hiddenStackHeaderOptions}
    >
      <Stack.Screen name="TasbihList" component={TasbihListScreen} />
      <Stack.Screen name="TasbihCounter" component={TasbihCounterScreen} />
    </Stack.Navigator>
  );
}
