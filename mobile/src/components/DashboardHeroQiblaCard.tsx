import React, { useCallback, useRef } from "react";
import { Platform, Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { QiblaArrowPointer } from "./QiblaArrowPointer";
import { useQiblaMotion, useQiblaStable } from "../context/QiblaSensorContext";
import { qiblaAlignHint } from "../lib/qiblaHints";
import type { ThemeColors } from "../theme/colors";
import type { HomeTabCompositeNavigation } from "../navigation/types";
import { kk } from "../i18n/kk";

type Props = {
  colors: ThemeColors;
  /** Бүйірдегі дөңгелек растрмен бір қатар — бағана ені */
  columnWidth: number;
  /** inline — үш бағана ішіндегі орта; banner — үстінгі толық ендік құбыла */
  variant?: "inline" | "banner";
  styles: {
    heroQiblaCard: StyleProp<ViewStyle>;
    heroArrowInner: StyleProp<ViewStyle>;
    heroArrowArea: StyleProp<ViewStyle>;
    heroArrowLift: StyleProp<ViewStyle>;
    heroQiblaLabel: StyleProp<TextStyle>;
  };
  cardShadow: StyleProp<ViewStyle>;
};

/**
 * Магнитометр тек осы кіші блогта — бүкіл Dashboard қайта салынбайды.
 */
export function DashboardHeroQiblaCard({ colors, columnWidth, variant = "inline", styles, cardShadow }: Props) {
  const navigation = useNavigation<HomeTabCompositeNavigation>();
  const { refreshBearing, bearing } = useQiblaStable();
  const { rotateDeg, headingHasSample } = useQiblaMotion();
  const bearingReady = bearing != null;
  const motionReady = bearingReady && headingHasSample;
  const qiblaAligned =
    motionReady && qiblaAlignHint(rotateDeg, bearing, { headingReady: true }) === "aligned";
  const lastBearingFocusAt = useRef(0);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === "web") return undefined;
      const now = Date.now();
      if (now - lastBearingFocusAt.current < 25_000) return;
      lastBearingFocusAt.current = now;
      void refreshBearing();
      return undefined;
    }, [refreshBearing])
  );

  const isBanner = variant === "banner";
  const arrowSize = isBanner
    ? Math.min(72, Math.max(40, Math.round(columnWidth * 0.55)))
    : Math.min(46, Math.max(32, Math.round(columnWidth * 0.5)));
  return (
    <Pressable
      style={({ pressed }) => [
        styles.heroQiblaCard,
        isBanner
          ? { width: "100%" as const, minHeight: 124, alignSelf: "stretch" as const }
          : { flex: 1, minWidth: 0 },
        bearingReady &&
          !qiblaAligned && {
            borderColor: `${colors.success}44`,
            borderWidth: 1,
          },
        qiblaAligned && {
          borderColor: colors.success,
          borderWidth: 2,
          shadowColor: colors.success,
          shadowOpacity: 0.35,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 0 },
          elevation: 4,
        },
        cardShadow,
        pressed && { opacity: 0.94 },
        { position: "relative" as const },
      ]}
      onPress={() => navigation.navigate("Qibla")}
      onLongPress={() => void refreshBearing()}
      accessibilityRole="button"
      accessibilityLabel={kk.tabs.qibla}
      accessibilityHint={kk.dashboard.qiblaHeroFoot}
    >
      <View style={styles.heroArrowInner}>
        <View style={styles.heroArrowArea}>
          <View style={styles.heroArrowLift}>
            {!motionReady ? (
              <MaterialIcons name="navigation" size={Math.min(28, arrowSize * 0.55)} color={colors.accent} />
            ) : (
              <QiblaArrowPointer
                colors={colors}
                size={arrowSize}
                rotateDeg={rotateDeg}
                aligned={qiblaAligned}
                showDialRing={false}
                showDialHalo={false}
                showTopMarker={false}
                needlePulse={false}
                showPivotHub={false}
                minimalDial
                ornamentArrow
              />
            )}
          </View>
        </View>
        <Text style={styles.heroQiblaLabel}>{kk.tabs.qibla}</Text>
      </View>
    </Pressable>
  );
}
