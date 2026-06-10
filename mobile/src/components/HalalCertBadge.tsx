import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import type { ThemeColors } from "../theme/colors";
import {
  halalCertBadgeColors,
  halalCertLabelKk,
  halalCertTone,
} from "../utils/halalCertDisplay";

type Props = {
  /** API status (active) немесе қазақша белгі */
  status: string | null | undefined;
  colors: ThemeColors;
  isDark: boolean;
  compact?: boolean;
};

/** halaldamu.kz стиліне жақын сертификат бейджі (түсті қорап + нүкте). */
export function HalalCertBadge({ status, colors, isDark, compact }: Props) {
  const label = (halalCertLabelKk(status) || (status ?? "").trim()).trim();
  if (!label) return null;

  const tone = halalCertTone(status);
  const palette = halalCertBadgeColors(tone, isDark);
  const styles = useMemo(() => makeStyles(compact), [compact]);

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
        },
      ]}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <View style={[styles.dot, { backgroundColor: palette.dot }]} />
      <Text style={[styles.txt, { color: palette.text }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function makeStyles(compact?: boolean) {
  return StyleSheet.create({
    wrap: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 6,
      marginTop: compact ? 2 : 4,
      paddingHorizontal: compact ? 8 : 10,
      paddingVertical: compact ? 4 : 5,
      borderRadius: 999,
      borderWidth: 1,
      maxWidth: "100%",
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    txt: {
      fontSize: compact ? 10 : 11,
      fontWeight: "800",
      letterSpacing: 0.2,
      flexShrink: 1,
    },
  });
}
