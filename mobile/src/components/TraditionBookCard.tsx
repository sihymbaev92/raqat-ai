import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Pressable } from "@/ui/Pressable";
import type { TraditionBookEntry } from "../content/traditionBooksCatalog";
import type { TraditionKazakhPalette } from "../theme/traditionKazakhTheme";

type Props = {
  palette: TraditionKazakhPalette;
  book: TraditionBookEntry;
  onOpen: () => void;
  /** Машина-аударма (қазақша→таңдалған тіл). Берілмесе түпнұсқа көрінеді. */
  tr?: (text: string) => string;
};

export function TraditionBookCard({ palette, book, onOpen, tr }: Props) {
  const styles = makeStyles(palette);
  const t = tr ?? ((s: string) => s);

  return (
    <Pressable
      oyuBackdrop={false}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`${t(book.title)}. ${t(book.subtitle)}`}
    >
      <View style={styles.accentBar} />
      <View style={styles.headerText}>
        <Text style={styles.title} numberOfLines={2}>
          {t(book.title)}
        </Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {t(book.subtitle)}
        </Text>
      </View>
      {book.badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeTxt} numberOfLines={2}>
            {t(book.badge)}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function makeStyles(p: TraditionKazakhPalette) {
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      backgroundColor: p.cardBg,
      borderWidth: 1,
      borderColor: p.border,
      borderRadius: 14,
      marginBottom: 10,
      padding: 12,
      overflow: "hidden",
    },
    accentBar: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      backgroundColor: p.gold,
      borderTopLeftRadius: 14,
      borderBottomLeftRadius: 14,
    },
    headerText: { flex: 1, minWidth: 0, paddingLeft: 6 },
    title: { fontSize: 15, fontWeight: "900", color: p.text },
    subtitle: { fontSize: 12, color: p.muted, marginTop: 4, lineHeight: 17 },
    badge: {
      backgroundColor: p.goldSurface,
      borderWidth: 1,
      borderColor: p.border,
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 6,
      maxWidth: 100,
    },
    badgeTxt: { fontSize: 10, fontWeight: "800", color: p.goldMuted, textAlign: "center" },
  });
}
