import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { kk } from "../../i18n/kk";
import type { TraditionKazakhPalette } from "../../theme/traditionKazakhTheme";

type Props = {
  palette: TraditionKazakhPalette;
};

/** «Дін мен дәстүр» — экранның жүйелі оқу реті (①→④). */
export function TraditionScreenMap({ palette }: Props) {
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const tg = kk.features.traditionGuide;
  const lines = useMemo(
    () => tg.traditionScreenMapBody.split("\n").map((s) => s.trim()).filter(Boolean),
    [tg.traditionScreenMapBody]
  );

  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <Text style={styles.title} accessibilityRole="header">
        {tg.traditionScreenMapTitle}
      </Text>
      {lines.map((line) => (
        <Text key={line} style={styles.line} selectable>
          {line}
        </Text>
      ))}
    </View>
  );
}

function makeStyles(p: TraditionKazakhPalette) {
  return StyleSheet.create({
    wrap: {
      marginBottom: 12,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: p.border,
      backgroundColor: p.cardElevated,
      gap: 6,
    },
    title: {
      fontSize: 14,
      fontWeight: "900",
      color: p.goldMuted,
      marginBottom: 4,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    line: {
      fontSize: 13,
      lineHeight: 20,
      color: p.text,
      fontWeight: "600",
    },
  });
}
