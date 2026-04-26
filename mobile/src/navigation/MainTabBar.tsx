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
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { menuIconAssets } from "../theme/menuIconAssets";

type MciName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

/**
 * Төменгі қатар: Дұғалар | 99 есім | Тәспі
 * (Басты бет — әдепкі экран, бірақ төменгі жолда жоқ; Дұғалар/Тәспіден «Басты» арқылы)
 */
/** @react-navigation/bottom-tabs ішіндегі getPaddingBottom-пен үйлесімді төменгі шегініс */
function tabBarPaddingBottom(bottom: number): number {
  return Math.max(bottom - Platform.select({ ios: 10, default: 2 }), 0);
}

/** Үстіңгі сызудан айырып, иконкалар+мәтінді төменірек (экран астына) жылжыту. */
const TAB_BAR_TOP_PAD = Platform.select({ ios: 10, default: 8 });
const TAB_BAR_EXTRA_BOTTOM = 4;

export function MainTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const { width: windowWidth } = useWindowDimensions();
  /** Төменгі қатар: иконкаларды айқынырақ үлкейту */
  const tabRasterSize = Math.min(78, Math.max(58, Math.round(windowWidth * 0.2)));
  const { colors } = useAppTheme();
  const tabPadBottom =
    tabBarPaddingBottom(insets.bottom) + TAB_BAR_EXTRA_BOTTOM;
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
          paddingTop: TAB_BAR_TOP_PAD,
          paddingBottom: tabPadBottom,
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
        },
      ]}
    >
      <Pressable
        onPress={goDuas}
        style={({ pressed }) => [styles.sideTab, pressed && { opacity: 0.92 }]}
        hitSlop={8}
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
        hitSlop={8}
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
        hitSlop={8}
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
  iconStyles: { iconWrap: ViewStyle };
  /** Дұғалар / тәспі сияқты нақты бейнелерді сәл үлкінірек көрсету */
  iconSize?: number;
}) {
  const tint = focused ? colors.accent : colors.muted;
  /** Сыртқы шеңбер: фокус жиек + ішкі дөңгелек клип */
  const ringPad = 4;
  const outer = iconSize + ringPad * 2;
  const outerR = outer / 2;
  const innerR = iconSize / 2;
  return (
    <View
      style={[
        iconStyles.iconWrap,
        {
          width: outer,
          height: outer,
          borderRadius: outerR,
          borderWidth: focused ? 1.5 : 0,
          borderColor: focused ? colors.accent : "transparent",
          backgroundColor: focused ? colors.accentSurface : "transparent",
          alignItems: "center",
          justifyContent: "center",
        },
      ]}
    >
      {imageSource != null ? (
        <View
          style={{
            width: iconSize,
            height: iconSize,
            borderRadius: innerR,
            overflow: "hidden",
            backgroundColor: colors.bg,
          }}
        >
          <Image
            source={imageSource}
            style={{
              width: iconSize,
              height: iconSize,
              opacity: focused ? 1 : 0.72,
            }}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        </View>
      ) : iconName ? (
        <View
          style={{
            width: iconSize,
            height: iconSize,
            borderRadius: innerR,
            overflow: "hidden",
            backgroundColor: "transparent",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialCommunityIcons name={iconName} size={Math.round(iconSize * 0.62)} color={tint} />
        </View>
      ) : null}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      flexDirection: "row",
      /** Биік бағанада иконка+мәтін ортада емес, төменгі шекке туралы тұруы керек */
      alignItems: "flex-end",
      justifyContent: "space-between",
      paddingTop: 0,
      paddingHorizontal: 4,
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
      justifyContent: "flex-end",
      paddingTop: 0,
      paddingBottom: 0,
      minHeight: 46,
      minWidth: 0,
    },
    tabLabel: {
      fontSize: 10,
      fontWeight: "700",
      marginTop: 1,
      marginBottom: 0,
      lineHeight: 12,
      textAlign: "center",
    },
    /** Негізгі өлшемдер TabIconWrap ішінде iconSize бойынша есептеледі */
    iconWrap: {
      alignItems: "center",
      justifyContent: "center",
    },
  });
}
