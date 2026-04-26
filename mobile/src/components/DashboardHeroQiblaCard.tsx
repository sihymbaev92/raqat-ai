import React, { useCallback, useRef } from "react";
import { Platform, Pressable, Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
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
  const { rotateDeg } = useQiblaMotion();
  const bearingReady = bearing != null;
  const qiblaAligned = qiblaAlignHint(rotateDeg, bearing) === "aligned" && bearingReady;
  const lastBearingFocusAt = useRef(0);

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastBearingFocusAt.current < 25_000) return;
      lastBearingFocusAt.current = now;
      void refreshBearing();
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
      {bearingReady ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 8,
            right: isBanner ? 12 : 8,
            width: 9,
            height: 9,
            borderRadius: 5,
            backgroundColor: colors.success,
            borderWidth: 1.5,
            borderColor: qiblaAligned ? `${colors.success}ff` : `${colors.card}`,
            zIndex: 2,
            ...(Platform.OS === "ios"
              ? {
                  shadowColor: colors.success,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.8,
                  shadowRadius: 3,
                }
              : { elevation: 3 }),
          }}
        />
      ) : null}
      <View style={styles.heroArrowInner}>
        <View style={styles.heroArrowArea}>
          <View style={styles.heroArrowLift}>
            <QiblaArrowPointer colors={colors} size={arrowSize} rotateDeg={rotateDeg} aligned={qiblaAligned} />
          </View>
        </View>
        <Text style={styles.heroQiblaLabel}>{kk.tabs.qibla}</Text>
      </View>
    </Pressable>
  );
}
