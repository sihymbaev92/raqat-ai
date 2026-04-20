import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DuasScreen } from "../screens/DuasScreen";
import { CommunityDuaScreen } from "../screens/CommunityDuaScreen";
import { useAppTheme } from "../theme/ThemeContext";
import { kk } from "../i18n/kk";
import type { DuasStackParamList } from "./types";

const Stack = createNativeStackNavigator<DuasStackParamList>();

export function DuasStack() {
  const { colors } = useAppTheme();

  return (
    <Stack.Navigator
      initialRouteName="DuasHome"
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "600", fontSize: 15 },
        headerBackTitleVisible: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="DuasHome" component={DuasScreen} options={{ title: kk.navigation.duasTitle }} />
      <Stack.Screen
        name="CommunityDua"
        component={CommunityDuaScreen}
        options={{ title: kk.communityDua.screenTitle }}
      />
    </Stack.Navigator>
  );
}
