import React, { useCallback, useRef } from "react";
import { Pressable, Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
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
export function DashboardHeroQiblaCard({ colors, columnWidth, styles, cardShadow }: Props) {
  const navigation = useNavigation<HomeTabCompositeNavigation>();
  const { refreshBearing, bearing } = useQiblaStable();
  const { rotateDeg } = useQiblaMotion();
  const qiblaAligned = qiblaAlignHint(rotateDeg, bearing) === "aligned" && bearing != null;
  const lastBearingFocusAt = useRef(0);

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastBearingFocusAt.current < 25_000) return;
      lastBearingFocusAt.current = now;
      void refreshBearing();
    }, [refreshBearing])
  );

  const arrowSize = Math.min(40, Math.max(28, Math.round(columnWidth * 0.42)));
  return (
    <Pressable
      style={({ pressed }) => [
        styles.heroQiblaCard,
        { width: columnWidth },
        cardShadow,
        pressed && { opacity: 0.94 },
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
            <QiblaArrowPointer colors={colors} size={arrowSize} rotateDeg={rotateDeg} aligned={qiblaAligned} />
          </View>
        </View>
        <Text style={styles.heroQiblaLabel}>{kk.tabs.qibla}</Text>
      </View>
    </Pressable>
  );
}
