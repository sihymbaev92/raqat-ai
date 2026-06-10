import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DuasScreen } from "../screens/DuasScreen";
import { useAppTheme } from "../theme/ThemeContext";
import type { DuasStackParamList } from "./types";
import { hiddenStackHeaderOptions } from "./hiddenStackHeader";

const Stack = createNativeStackNavigator<DuasStackParamList>();

export function DuasStack() {
  const { colors } = useAppTheme();

  return (
    <Stack.Navigator
      initialRouteName="DuasHome"
      screenOptions={{
        ...hiddenStackHeaderOptions,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="DuasHome" component={DuasScreen} />
    </Stack.Navigator>
  );
}
