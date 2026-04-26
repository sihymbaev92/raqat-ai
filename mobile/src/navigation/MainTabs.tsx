import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { DashboardScreen } from "../screens/DashboardScreen";
import { DuasStack } from "./DuasStack";
import { TasbihStack } from "./TasbihStack";
import { IslamicSideAyatRails } from "../components/IslamicSideAyatRails";
import { useAppTheme } from "../theme/ThemeContext";
import { kk } from "../i18n/kk";
import type { MainTabParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  const { colors } = useAppTheme();

  return (
    <IslamicSideAyatRails>
    <Tab.Navigator
      initialRouteName="Home"
      backBehavior="initialRoute"
      screenOptions={{
        /** Төменгі таб жолағын өшіреміз: бөлімдер Басты беттегі тайлдарда. */
        tabBarStyle: { display: "none" },
        /* false болса барлық таб бірден монтаждалады — алғашқы іске қосуда JS қатып қалуы мүмкін */
        lazy: true,
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "600", fontSize: 15 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          title: kk.navigation.homeTitle,
          tabBarLabel: "",
          headerTitleAlign: "left",
          /** Төменгі кастом жолда «Басты» түймесі жоқ — әдепкі таб жолынан жасырамыз */
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="Duas"
        component={DuasStack}
        options={{
          headerShown: false,
          tabBarLabel: kk.dashboard.duasShort,
        }}
      />
      <Tab.Screen
        name="Tasbih"
        component={TasbihStack}
        options={{
          headerShown: false,
        }}
      />
    </Tab.Navigator>
    </IslamicSideAyatRails>
  );
}
