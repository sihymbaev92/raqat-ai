import React, { useMemo } from "react";
import { View, Text, StyleSheet, Platform, type ImageSourcePropType } from "react-native";
import { Pressable } from "@/ui/Pressable";
import { RasterImage } from "@/ui/RasterImage";
import type { ThemeColors } from "../theme/colors";
import { BRAND_FONT_FACE } from "../fonts/brandFont";

type Props = {
  image: ImageSourcePropType;
  title: string;
  colors: ThemeColors;
  isDark: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  /** Промо логотип қоршауының түсі */
  logoFrameVariant?: "halal" | "ai";
};

/** Басты бет: Халал Даму / RAHAT OMIR AI — хаб экрандарымен бір визуал тіл. */
export function DashboardHubPromoHalf({
  image,
  title,
  colors,
  isDark,
  onPress,
  accessibilityLabel,
  logoFrameVariant = "ai",
}: Props) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const logoFrameColors = useMemo(() => {
    if (logoFrameVariant === "halal") {
      return {
        border: isDark ? "rgba(52, 211, 153, 0.65)" : "#34d399",
        bg: isDark ? "rgba(6, 95, 70, 0.35)" : "#ffffff",
      };
    }
    return {
      border: isDark ? colors.accent : "rgba(38, 166, 154, 0.75)",
      bg: isDark ? colors.card : "#ffffff",
    };
  }, [logoFrameVariant, isDark, colors.accent, colors.card]);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.root, pressed && styles.pressed]}
    >
      <View style={styles.inner}>
        <View
          style={[
            styles.logoWrap,
            {
              borderColor: logoFrameColors.border,
              backgroundColor: logoFrameColors.bg,
            },
          ]}
        >
          <RasterImage
            source={image}
            style={styles.logo}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        </View>
        <Text
          style={styles.title}
          numberOfLines={3}
          ellipsizeMode="tail"
          adjustsFontSizeToFit
          minimumFontScale={0.82}
        >
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      minWidth: 0,
    },
    pressed: {
      opacity: 0.92,
      transform: [{ scale: 0.985 }],
    },
    inner: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      paddingHorizontal: 8,
      minHeight: 88,
      gap: 6,
    },
    logoWrap: {
      width: 58,
      height: 58,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
      borderRadius: 14,
      borderWidth: 2,
      padding: 3,
      overflow: "hidden",
    },
    logo: {
      width: "92%",
      height: "92%",
    },
    title: {
      color: colors.text,
      fontSize: 12,
      fontWeight: "900",
      letterSpacing: 0.2,
      lineHeight: 15,
      textAlign: "center",
      width: "100%",
      minHeight: 32,
      paddingHorizontal: 2,
      ...Platform.select({
        android: { fontFamily: BRAND_FONT_FACE.extrabold },
        default: {},
      }),
    },
  });
}
