import React from "react";
import { View, Text, StyleSheet, Platform, useWindowDimensions, type ViewStyle } from "react-native";
import { Pressable } from "@/ui/Pressable";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { tabIcons, type MciName } from "../theme/appIcons";
import { typography, uiFontStyle } from "../theme/typography";
import { kk } from "../i18n/kk";
import { useAppLocale } from "../i18n/runtime";
import type { MainTabParamList } from "./types";

/** @react-navigation/bottom-tabs ішіндегі getPaddingBottom-пен үйлесімді төменгі шегініс */
function tabBarPaddingBottom(bottom: number): number {
  return Math.max(bottom - Platform.select({ ios: 10, default: 2 }), 0);
}

const TAB_BAR_TOP_PAD = Platform.select({ ios: 8, default: 6 });
const TAB_BAR_EXTRA_BOTTOM = 2;

type VisibleTab = {
  name: keyof Pick<
    MainTabParamList,
    "Home" | "Articles" | "PrayerTab" | "Saved" | "Profile"
  >;
  label: string;
  icon: { active: MciName; inactive: MciName };
};

function visibleTabs(): VisibleTab[] {
  return [
    { name: "Home", label: kk.navigation.tabHome, icon: tabIcons.home },
    { name: "Articles", label: kk.navigation.tabArticles, icon: tabIcons.articles },
    { name: "PrayerTab", label: kk.navigation.tabPrayerTimes, icon: tabIcons.prayer },
    { name: "Saved", label: kk.navigation.tabSaved, icon: tabIcons.saved },
    { name: "Profile", label: kk.navigation.tabProfile, icon: tabIcons.profile },
  ];
}

export function MainTabBar({ state, navigation, insets }: BottomTabBarProps) {
  const locale = useAppLocale();
  const { width: windowWidth } = useWindowDimensions();
  const tabIconBox = Math.min(40, Math.max(28, Math.round(windowWidth * 0.085)));
  const { colors } = useAppTheme();
  const tabPadBottom = tabBarPaddingBottom(insets.bottom) + TAB_BAR_EXTRA_BOTTOM;
  const styles = makeStyles(colors);
  const currentName = state.routes[state.index]?.name;
  const tabs = React.useMemo(() => visibleTabs(), [locale]);

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: TAB_BAR_TOP_PAD,
          paddingBottom: tabPadBottom,
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
        },
      ]}
    >
      {tabs.map((tab) => {
        const route = state.routes.find((r) => r.name === tab.name);
        if (!route) return null;
        const focused = currentName === tab.name;
        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(tab.name);
          }
        };
        return (
          <Pressable
            key={tab.name}
            oyuBackdrop={false}
            onPress={onPress}
            style={({ pressed }) => [styles.tab, pressed && { opacity: 0.92 }]}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.label}
            testID={`main-tab-${tab.name}`}
          >
            <TabIconWrap
              focused={focused}
              colors={colors}
              iconName={focused ? tab.icon.active : tab.icon.inactive}
              iconStyles={styles}
              iconSize={tabIconBox}
            />
            <Text
              style={[styles.tabLabel, { color: focused ? colors.accent : colors.muted }]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function TabIconWrap({
  focused,
  colors,
  iconName,
  iconStyles,
  iconSize = 28,
}: {
  focused: boolean;
  colors: ThemeColors;
  iconName: MciName;
  iconStyles: { iconWrap: ViewStyle };
  iconSize?: number;
}) {
  const tint = focused ? colors.accent : colors.muted;
  const glyphSize = Math.round(iconSize * 0.55);
  return (
    <View style={[iconStyles.iconWrap, { width: iconSize, height: iconSize }]}>
      <MaterialCommunityIcons name={iconName} size={glyphSize} color={tint} />
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      paddingHorizontal: 2,
      borderTopWidth: StyleSheet.hairlineWidth,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        android: { elevation: 8 },
      }),
    },
    tab: {
      flex: 1,
      alignItems: "center",
      justifyContent: "flex-end",
      minHeight: 44,
      minWidth: 0,
      paddingBottom: 0,
    },
    tabLabel: {
      ...uiFontStyle("bold"),
      ...typography.tab,
      marginTop: 2,
      textAlign: "center",
    },
    iconWrap: {
      alignItems: "center",
      justifyContent: "center",
    },
  });
}
