import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import { kk } from "../i18n/kk";
import type { TraditionKazakhPalette } from "../theme/traditionKazakhTheme";

type Props = {
  palette: TraditionKazakhPalette;
};

/** Дін мен дәстүр — ескерту және кеңейтілетін кіріспе. */
export function TraditionIntroPanel({ palette }: Props) {
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const tg = kk.features.traditionGuide;
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.wrap}>
      <View style={styles.disclaimerRow}>
        <MaterialIcons name="info-outline" size={16} color={palette.gold} />
        <Text style={styles.disclaimer} selectable>
          {tg.disclaimer}
        </Text>
      </View>
      <Pressable
        oyuBackdrop={false}
        onPress={() => setExpanded((v) => !v)}
        style={({ pressed }) => [styles.toggleRow, pressed && { opacity: 0.9 }]}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={expanded ? tg.introMoreHide : tg.introMoreShow}
      >
        <Text style={styles.toggleLabel}>{expanded ? tg.introMoreHide : tg.introMoreShow}</Text>
        <MaterialIcons
          name={expanded ? "expand-less" : "expand-more"}
          size={22}
          color={palette.gold}
        />
      </Pressable>
      {expanded ? (
        <Text style={styles.detail} selectable>
          {tg.introDetail}
        </Text>
      ) : null}
    </View>
  );
}

function makeStyles(p: TraditionKazakhPalette) {
  return StyleSheet.create({
    wrap: {
      marginBottom: 12,
      padding: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: p.border,
      backgroundColor: p.cardBg,
    },
    disclaimerRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
    },
    disclaimer: {
      flex: 1,
      fontSize: 12,
      lineHeight: 18,
      color: p.muted,
      fontWeight: "600",
    },
    toggleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 10,
      paddingVertical: 4,
    },
    toggleLabel: {
      flex: 1,
      fontSize: 13,
      fontWeight: "800",
      color: p.goldMuted,
    },
    detail: {
      marginTop: 8,
      fontSize: 13,
      lineHeight: 20,
      color: p.text,
    },
  });
}
