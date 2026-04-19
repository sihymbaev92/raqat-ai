import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Image,
  useWindowDimensions,
  type ViewStyle,
} from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { menuIconAssets } from "../theme/menuIconAssets";

type MciName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

/**
 * Төменгі қатар: Дұғалар | 99 есім | Тәспі
 * (Басты бет — әдепкі экран, бірақ төменгі жолда жоқ; Дұғалар/Тәспіден «Басты» арқылы)
 */
export function MainTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { width: windowWidth } = useWindowDimensions();
  /** Төменгі қатар: суреттер батырма ішінде мүмкіндігінше үлкен (шықпайды) */
  const tabRasterSize = Math.min(42, Math.max(32, Math.round(windowWidth * 0.104)));
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const tabPadBottom = Math.max(insets.bottom, Platform.OS === "android" ? 12 : 8);
  const styles = makeStyles(colors);

  const duasRoute = state.routes.find((r) => r.name === "Duas");
  const tasbihRoute = state.routes.find((r) => r.name === "Tasbih");
  if (!duasRoute || !tasbihRoute) {
    return null;
  }

  const currentName = state.routes[state.index]?.name;
  const duasFocused = currentName === "Duas";
  const tasbihFocused = currentName === "Tasbih";

  const parent = navigation.getParent();

  const goDuas = () => {
    const e = navigation.emit({
      type: "tabPress",
      target: duasRoute.key,
      canPreventDefault: true,
    });
    if (!duasFocused && !e.defaultPrevented) {
      navigation.navigate("Duas");
    }
  };

  const goAsma = () => {
    parent?.navigate("AsmaAlHusna" as never);
  };

  const goTasbih = () => {
    const e = navigation.emit({
      type: "tabPress",
      target: tasbihRoute.key,
      canPreventDefault: true,
    });
    if (!tasbihFocused && !e.defaultPrevented) {
      navigation.navigate("Tasbih");
    }
  };

  const duasLabel = kk.dashboard.duasShort;
  const asmaLabel = kk.tabs.asmaSub;
  const tasbihLabel = kk.tabs.tasbih;

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingBottom: tabPadBottom,
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
      ]}
    >
      <Pressable
        onPress={goDuas}
        style={({ pressed }) => [styles.sideTab, pressed && { opacity: 0.92 }]}
        accessibilityRole="button"
        accessibilityState={{ selected: duasFocused }}
        accessibilityLabel={duasLabel}
      >
        <TabIconWrap
          focused={duasFocused}
          colors={colors}
          imageSource={menuIconAssets.tabDuas}
          iconStyles={styles}
          iconSize={tabRasterSize}
        />
        <Text
          style={[styles.tabLabel, { color: duasFocused ? colors.accent : colors.muted }]}
          numberOfLines={1}
        >
          {duasLabel}
        </Text>
      </Pressable>

      <Pressable
        onPress={goAsma}
        style={({ pressed }) => [styles.sideTab, pressed && { opacity: 0.92 }]}
        accessibilityRole="button"
        accessibilityState={{ selected: false }}
        accessibilityLabel={kk.tabs.asma}
      >
        <TabIconWrap
          focused={false}
          colors={colors}
          imageSource={menuIconAssets.tabAsma}
          iconStyles={styles}
          iconSize={tabRasterSize}
        />
        <Text style={[styles.tabLabel, { color: colors.muted }]} numberOfLines={1}>
          {asmaLabel}
        </Text>
      </Pressable>

      <Pressable
        onPress={goTasbih}
        style={({ pressed }) => [styles.sideTab, pressed && { opacity: 0.92 }]}
        accessibilityRole="button"
        accessibilityState={{ selected: tasbihFocused }}
        accessibilityLabel={tasbihLabel}
      >
        <TabIconWrap
          focused={tasbihFocused}
          colors={colors}
          imageSource={menuIconAssets.tabTasbih}
          iconStyles={styles}
          iconSize={tabRasterSize}
        />
        <Text
          style={[styles.tabLabel, { color: tasbihFocused ? colors.accent : colors.muted }]}
          numberOfLines={1}
        >
          {tasbihLabel}
        </Text>
      </Pressable>
    </View>
  );
}

function TabIconWrap({
  focused,
  colors,
  iconName,
  imageSource,
  iconStyles,
  iconSize = 30,
}: {
  focused: boolean;
  colors: ThemeColors;
  iconName?: MciName;
  imageSource?: React.ComponentProps<typeof Image>["source"];
  iconStyles: { iconWrap: ViewStyle; iconWrapFocused: ViewStyle };
  /** Дұғалар / тәспі сияқты нақты бейнелерді сәл үлкінірек көрсету */
  iconSize?: number;
}) {
  const tint = focused ? colors.accent : colors.muted;
  return (
    <View
      style={[
        iconStyles.iconWrap,
        {
          borderColor: focused ? colors.accent : "transparent",
          backgroundColor: focused ? "rgba(229, 193, 88, 0.12)" : "transparent",
        },
        focused && iconStyles.iconWrapFocused,
      ]}
    >
      {imageSource != null ? (
        <Image
          source={imageSource}
          style={{ width: iconSize, height: iconSize, opacity: focused ? 1 : 0.72 }}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      ) : iconName ? (
        <MaterialCommunityIcons name={iconName} size={iconSize} color={tint} />
      ) : null}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      paddingTop: 8,
      paddingHorizontal: 4,
      minHeight: 60,
      borderTopWidth: StyleSheet.hairlineWidth,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
        },
        android: { elevation: 10 },
      }),
    },
    sideTab: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 4,
      minWidth: 0,
    },
    tabLabel: {
      fontSize: 11,
      fontWeight: "700",
      marginTop: 4,
      marginBottom: 2,
      lineHeight: 13,
      textAlign: "center",
    },
    iconWrap: {
      alignItems: "center",
      justifyContent: "center",
      minWidth: 44,
      minHeight: 44,
      paddingVertical: 2,
      paddingHorizontal: 4,
      borderRadius: 16,
      borderWidth: 0,
    },
    iconWrapFocused: {
      borderWidth: 1.5,
    },
  });
}
