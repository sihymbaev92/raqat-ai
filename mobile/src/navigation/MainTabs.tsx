import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { DashboardScreen } from "../screens/DashboardScreen";
import { DuasScreen } from "../screens/DuasScreen";
import { TasbihScreen } from "../screens/TasbihScreen";
import { MainTabBar } from "./MainTabBar";
import { useAppTheme } from "../theme/ThemeContext";
import { kk } from "../i18n/kk";
import type { MainTabParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  const { colors } = useAppTheme();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      backBehavior="initialRoute"
      tabBar={(props) => <MainTabBar {...props} />}
      screenOptions={{
        /* false болса барлық таб бірден монтаждалады — алғашқы іске қосуда JS қатып қалуы мүмкін */
        lazy: true,
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "600", fontSize: 15 },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600", marginBottom: 2 },
        tabBarIconStyle: { marginTop: 4 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          title: kk.navigation.homeTitle,
          tabBarLabel: "",
          headerTitleAlign: "center",
          /** Төменгі кастом жолда «Басты» түймесі жоқ — әдепкі таб жолынан жасырамыз */
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="Duas"
        component={DuasScreen}
        options={{
          title: kk.navigation.duasTitle,
          tabBarLabel: kk.dashboard.duasShort,
        }}
      />
      <Tab.Screen
        name="Tasbih"
        component={TasbihScreen}
        options={{
          title: kk.tasbih.screenTitle,
        }}
      />
    </Tab.Navigator>
  );
}
